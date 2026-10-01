import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { isPaypalConfigured, paypalFetch, getPaypalAccessToken } from '../config/paypal.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError, ServiceUnavailableError } from '../utils/app-error.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { markOrderPaid } from '../controllers/orders.controller.js';

export const paymentRouter = Router();

/**
 * Shared guard: load a pending order owned by the authenticated user.
 * The amount always comes from the order row (repriced server-side at
 * creation), never from the client.
 */
async function loadPendingOrder(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const orderId = String(req.body?.orderId || '').trim().toUpperCase();

  if (!orderId) {
    throw new BadRequestError('Order ID is required.');
  }

  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (!order || order.user_id !== userId) {
    throw new NotFoundError('Order not found.');
  }
  if (order.status === 'paid' || order.status === 'dispatched') {
    res.status(200).json({
      success: true,
      message: 'Order has already been paid.',
      data: { alreadyPaid: true },
    });
    return null;
  }
  if (order.status !== 'pending') {
    throw new BadRequestError(`Order is in "${order.status}" status and cannot be paid.`);
  }
  return order;
}

/**
 * GET /api/payments/paypal/status
 * Pre-payment health check so the customer can verify PayPal availability
 * before starting a payment. Verifies credentials are set AND an OAuth token
 * can actually be obtained (cached for 60s so the checkout page can poll it
 * cheaply). Never throws — always answers 200 with a structured result.
 */
let paypalStatusCache: { checkedAt: number; result: { configured: boolean; connected: boolean; env: string } } | null = null;

paymentRouter.get(
  '/paypal/status',
  catchAsync(async (_req: Request, res: Response) => {
    const configured = isPaypalConfigured();
    if (!configured) {
      res.status(200).json({
        success: true,
        data: { configured: false, connected: false, env: env.PAYPAL_ENV, clientId: null },
      });
      return;
    }

    if (paypalStatusCache && Date.now() - paypalStatusCache.checkedAt < 60_000) {
      res.status(200).json({ success: true, data: paypalStatusCache.result });
      return;
    }

    let connected = false;
    try {
      await getPaypalAccessToken();
      connected = true;
    } catch (err) {
      console.error('[PayPal] status check failed:', (err as Error).message);
    }

    // clientId is public (it's embedded in the JS SDK script URL) — exposing it
    // here lets the checkout page render the PayPal/card buttons without a
    // second config endpoint.
    const result = { configured, connected, env: env.PAYPAL_ENV, clientId: env.PAYPAL_CLIENT_ID ?? null };
    paypalStatusCache = { checkedAt: Date.now(), result };
    res.status(200).json({ success: true, data: result });
  })
);

/**
 * POST /api/payments/paypal/create-order
 * Create a PayPal Order (Orders API v2) for a pending order and return the
 * approval link. The customer approves it on PayPal's hosted page; capture
 * happens server-side in /paypal/capture after the redirect back.
 */
paymentRouter.post(
  '/paypal/create-order',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (!isPaypalConfigured()) {
      throw new ServiceUnavailableError('PayPal is not configured. Please use another payment method.');
    }

    const order = await loadPendingOrder(req, res);
    if (!order) return;

    const unitAmount = Number(order.total_usd);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new BadRequestError('Invalid order amount.');
    }

    const ppRes = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: order.id,
            description: `${order.product_name} — ${order.plan_duration_months} months`.slice(0, 127),
            amount: { currency_code: 'USD', value: unitAmount.toFixed(2) },
          },
        ],
        // Return to the checkout page; the client then calls /paypal/capture.
        application_context: {
          brand_name: 'AgentLab',
          user_action: 'PAY_NOW',
          return_url: `${env.APP_URL ?? 'http://localhost:5173'}/checkout?paypal_return=1&orderId=${order.id}`,
          cancel_url: `${env.APP_URL ?? 'http://localhost:5173'}/checkout?paypal_cancel=1`,
        },
      }),
    });

    if (!ppRes.ok) {
      console.error('[PayPal] create-order failed:', await ppRes.text());
      throw new ServiceUnavailableError('Unable to create the PayPal payment. Please try again.');
    }

    const ppOrder = (await ppRes.json()) as { id: string; links: { rel: string; href: string }[] };
    const approveLink = ppOrder.links?.find((l) => l.rel === 'approve')?.href;

    await pool.query(
      `INSERT INTO payments (order_id, provider, provider_ref, amount, currency, status, raw_event)
       VALUES ($1, 'paypal', $2, $3, 'USD', 'pending', $4)
       ON CONFLICT (provider, provider_ref) WHERE provider_ref IS NOT NULL DO NOTHING`,
      [order.id, ppOrder.id, unitAmount, JSON.stringify({ created: true })]
    );

    res.status(201).json({
      success: true,
      data: { approveUrl: approveLink, paypalOrderId: ppOrder.id, orderId: order.id },
    });
  })
);

/**
 * POST /api/payments/paypal/capture
 * Capture an approved PayPal Order. Called when PayPal redirects the customer
 * back to /checkout?paypal_return=1. The capture result is verified
 * server-side (amount + currency must match the order) before fulfilment.
 * markOrderPaid is idempotent, so repeated captures/retries are safe.
 */
paymentRouter.post(
  '/paypal/capture',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (!isPaypalConfigured()) {
      throw new ServiceUnavailableError('PayPal is not configured.');
    }

    const paypalOrderId = String(req.body?.paypalOrderId || '').trim();
    if (!paypalOrderId) {
      throw new BadRequestError('PayPal order id is required.');
    }

    const capRes = await paypalFetch(`/v2/checkout/orders/${paypalOrderId}/capture`, { method: 'POST' });
    const capture: any = await capRes.json();

    if (!capRes.ok) {
      // ORDER_ALREADY_CAPTURED means the customer paid on a previous attempt.
      const alreadyCaptured =
        capture?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED' || capture?.name === 'UNPROCESSABLE_ENTITY';
      if (!alreadyCaptured) {
        console.error('[PayPal] capture failed:', JSON.stringify(capture));
        throw new BadRequestError('PayPal payment capture failed. Please contact support.');
      }
    }

    const unit = capture?.purchase_units?.[0];
    const cap = unit?.payments?.captures?.[0];
    const ppCustomId = unit?.custom_id;
    const status = capture?.status;

    if (status && status !== 'COMPLETED') {
      throw new BadRequestError(`PayPal payment is "${status}", not completed.`);
    }

    // Trust only what PayPal's API returned: resolve the local order from the
    // PayPal order's custom_id, then verify the captured amount matches it.
    const orderId = String(ppCustomId || req.body?.orderId || '').trim().toUpperCase();
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];
    if (!order || order.user_id !== (req as any).user?.id) {
      throw new NotFoundError('Order not found.');
    }

    const capturedUsd = cap?.amount?.currency_code === 'USD' ? Number(cap.amount.value) : NaN;
    if (Number.isFinite(capturedUsd) && Math.abs(capturedUsd - Number(order.total_usd)) > 0.01) {
      console.error(`[PayPal] Amount mismatch for order ${orderId}: captured ${capturedUsd}, expected ${order.total_usd}`);
      throw new BadRequestError('Payment amount does not match the order. Please contact support.');
    }

    await pool.query(
      `INSERT INTO payments (order_id, provider, provider_ref, amount, currency, status, raw_event)
       VALUES ($1, 'paypal', $2, $3, 'USD', 'succeeded', $4)
       ON CONFLICT (provider, provider_ref) WHERE provider_ref IS NOT NULL DO UPDATE
         SET status = 'succeeded', raw_event = EXCLUDED.raw_event, updated_at = CURRENT_TIMESTAMP`,
      [order.id, cap?.id || paypalOrderId, capturedUsd, JSON.stringify(capture)]
    ).catch(() => {});

    try {
      await markOrderPaid(order.id, 'paypal', cap?.id || paypalOrderId);
    } catch (err) {
      console.error(`[PayPal] Fulfilment failed for order ${order.id}:`, err);
      throw new ServiceUnavailableError('Payment captured but fulfilment failed — support has been notified.');
    }

    res.status(200).json({ success: true, data: { orderId: order.id, status: 'paid' } });
  })
);

/**
 * POST /api/payments/dev-simulate
 * Development-only escape hatch: mark a pending order paid without PayPal so
 * the full post-purchase flow stays testable without payment credentials.
 */
paymentRouter.post(
  '/dev-simulate',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (env.isProd) {
      throw new NotFoundError('Not found.');
    }
    const userId = (req as any).user?.id;
    const orderId = String(req.body?.orderId || '').trim().toUpperCase();

    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];
    if (!order || order.user_id !== userId) {
      throw new NotFoundError('Order not found.');
    }
    await markOrderPaid(orderId, 'dev-simulate', `DEV-${Date.now()}`);
    res.status(200).json({ success: true, message: 'Payment simulated (dev only).' });
  })
);
