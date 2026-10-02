import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/app-error.js';
import { computeOrderPrice, TIER_DISCOUNTS } from '../utils/pricing.js';
import { decryptSecret, encryptSecret } from '../services/crypto.service.js';
import { sendLookupOtpEmail, sendOrderConfirmationEmail } from '../services/email.service.js';
import { processOrderReferral } from './referral.controller.js';

/**
 * In-memory cache for the last issued OTP per order (plaintext code is only
 * ever held here transiently so the development channel can echo it back —
 * in production this is where an email/SMS provider hook would deliver it).
 */
const otpCodeCache = new Map<string, { code: string; expiresAt: number }>();

const constantTimeEquals = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Format an order row from DB (snake_case → camelCase)
 */
export const formatOrderRow = (row: any) => ({
  orderId: row.id,
  userId: row.user_id,
  guestEmail: row.guest_email,
  productId: row.product_id,
  productName: row.product_name,
  productSlug: row.product_slug,
  planDurationMonths: Number(row.plan_duration_months),
  provisioningType: row.provisioning_type,
  targetEmail: row.target_email,
  quantity: Number(row.quantity),
  unitPriceVND: Number(row.unit_price_vnd),
  unitPriceUSD: Number(row.unit_price_usd),
  discountVND: Number(row.discount_vnd),
  discountUSD: Number(row.discount_usd),
  totalAmount: Number(row.total_vnd),
  totalVND: Number(row.total_vnd),
  totalUSD: Number(row.total_usd),
  currency: row.currency,
  paymentMethod: row.payment_method,
  paymentGatewayRef: row.payment_gateway_ref,
  status: row.status,
  couponCode: row.coupon_code,
  referralCode: row.referral_code,
  warrantyExpireDate: row.warranty_expire_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Format a subscription row from DB
 */
export const formatSubscriptionRow = (row: any) => ({
  id: row.id,
  orderId: row.order_id,
  userId: row.user_id,
  productId: row.product_id,
  productName: row.product_name,
  productSlug: row.product_slug,
  brand: row.brand,
  provisioningType: row.provisioning_type,
  accountEmail: row.account_email,
  accountPassword: decryptSecret(row.account_password_encrypted),
  accessToken: row.access_token,
  startDate: row.start_date,
  expiresAt: row.expires_at,
  daysRemaining: Number(row.days_remaining),
  status: row.status,
  autoRenew: Boolean(row.auto_renew),
  createdAt: row.created_at,
});

/**
 * Generate a unique order ID
 */
const generateOrderId = () => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `AGTLAB-${num}`;
};

/**
 * POST /api/orders
 * Create a new order (authenticated users only).
 *
 * SECURITY: the order is repriced entirely server-side. Client-supplied price
 * fields are ignored — the amount charged comes from the product catalog,
 * the duration discount table, the user's tier and a server-validated coupon.
 * The order starts as 'pending'; money moves only after the payment gateway
 * webhook confirms (markOrderPaid).
 */
export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('You must be logged in to place an order.');
  }

  const {
    productId,
    planDurationMonths,
    provisioningType,
    targetEmail,
    guestEmail,
    quantity,
    couponCode,
    referralCode,
  } = req.body;

  // Validate required fields — product identity, not pricing
  if (!productId || !guestEmail) {
    throw new BadRequestError('Missing required order information.');
  }

  const months = [1, 3, 6, 12].includes(Number(planDurationMonths)) ? Number(planDurationMonths) : 1;
  const qty = Math.min(Math.max(Number(quantity) || 1, 1), 10);

  // Verify product exists and is active — and take the price from HERE
  const productCheck = await pool.query(
    'SELECT id, name, slug, current_price_vnd, current_price_usd FROM products WHERE id = $1 AND is_active = true',
    [productId]
  );
  if (productCheck.rows.length === 0) {
    throw new NotFoundError('Product not found or no longer sold.');
  }
  const product = productCheck.rows[0];

  // Tier discount comes from the DB user record, never from the request
  const userRes = await pool.query('SELECT tier FROM users WHERE id = $1', [userId]);
  const tierDiscount = TIER_DISCOUNTS[userRes.rows[0]?.tier] ?? 0;

  // Coupon discount is validated against the coupons table
  let couponDiscount = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const couponRes = await pool.query(
      `SELECT code, discount_percent FROM coupons
       WHERE UPPER(code) = $1 AND active = true AND (expires_at IS NULL OR expires_at > NOW())`,
      [String(couponCode).trim().toUpperCase()]
    );
    if (couponRes.rows.length === 0) {
      throw new BadRequestError('Discount code is invalid or has expired.');
    }
    couponDiscount = Number(couponRes.rows[0].discount_percent);
    appliedCoupon = couponRes.rows[0].code;
  }

  const price = computeOrderPrice(
    Number(product.current_price_vnd),
    Number(product.current_price_usd),
    months,
    qty,
    tierDiscount + couponDiscount
  );

  if (price.totalVND <= 0) {
    throw new BadRequestError('Payment amount is invalid.');
  }

  // Ensure orderId is unique
  let orderId = generateOrderId();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) break;
    orderId = generateOrderId();
    attempts++;
  }

  // Calculate warranty expiry date
  const warrantyMonths = months <= 1 ? 1 : months;
  const warrantyDate = new Date();
  warrantyDate.setMonth(warrantyDate.getMonth() + warrantyMonths);

  // Insert order into DB — 'pending' until the payment webhook confirms
  const result = await pool.query(
    `INSERT INTO orders (
      id, user_id, guest_email, product_id, product_name, product_slug,
      plan_duration_months, provisioning_type, target_email, quantity,
      unit_price_vnd, unit_price_usd, discount_vnd, discount_usd,
      total_vnd, total_usd, currency, payment_method,
      status, coupon_code, warranty_expire_date, referral_code
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
      orderId,
      userId,
      guestEmail.trim().toLowerCase(),
      productId,
      product.name,
      product.slug,
      months,
      provisioningType || 'pre_created',
      targetEmail || null,
      qty,
      price.unitPriceVND,
      price.unitPriceUSD,
      price.discountVND,
      price.discountUSD,
      price.totalVND,
      price.totalUSD,
      'USD',
      'paypal',
      'pending',
      appliedCoupon,
      warrantyDate.toISOString().split('T')[0],
      String(referralCode || '').trim().toUpperCase() || null,
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Order created. Please complete the payment.',
    data: {
      ...formatOrderRow(result.rows[0]),
      provisioned: false,
    },
  });
});

/**
 * Mark a pending order as paid and fulfil it: referral attribution, inventory
 * allocation, subscription creation and the confirmation email.
 *
 * Idempotent — safe to call from repeated capture retries. The WHERE clause on
 * status='pending' acts as the concurrency guard: whichever caller flips the
 * status first owns fulfilment; everyone else gets the already-paid order back.
 */
export const markOrderPaid = async (
  orderId: string,
  provider: string,
  providerRef: string | null
): Promise<{ fulfilled: boolean; order?: any }> => {
  const paidRes = await pool.query(
    `UPDATE orders SET status = 'paid', payment_method = $2, payment_gateway_ref = $3,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [orderId, provider, providerRef]
  );
  // Lucky Wheel: the prize coupon applies to a single order — the moment that
  // order is paid, the code is deleted from the database entirely.
  if (orderId) {
    await pool
      .query(
        `DELETE FROM coupons WHERE code = (
           SELECT coupon_code FROM orders WHERE id = $1
         ) AND source = 'wheel'`,
        [orderId]
      )
      .catch(() => {}); // never block fulfilment on coupon cleanup
  }


  const order = paidRes.rows[0];
  if (!order) {
    // Already paid (or cancelled) — nothing left to do
    return { fulfilled: false };
  }

  // ── Referral attribution & reward (only once, on real payment) ──
  if (order.referral_code) {
    try {
      await processOrderReferral({
        referralCode: order.referral_code,
        orderId: order.id,
        buyerUserId: order.user_id,
        buyerEmail: order.guest_email,
        orderTotalVND: Number(order.total_vnd),
      });
    } catch (refErr) {
      console.error('[Referral] Processing failed for order', order.id, refErr);
    }
  }

  // ── Auto-provisioning: allocate a real account from the warehouse ──
  try {
    const accRes = await pool.query(
      `SELECT * FROM inventory_accounts
       WHERE (product_id = $1 OR LOWER(tool) = LOWER($2)) AND pool = 'active' AND status = 'available'
       ORDER BY CASE WHEN product_id = $1 THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1 FOR UPDATE SKIP LOCKED`,
      [order.product_id, order.product_name]
    );
    const acc = accRes.rows[0] ?? null;
    if (acc) {
      await pool.query(
        `UPDATE inventory_accounts
         SET status = 'assigned', assigned_order_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [order.id, acc.id]
      );
      const encPassword = encryptSecret(acc.password);

      // Create subscription record bound to the allocated account
      await pool.query(
        `INSERT INTO subscriptions (
          order_id, user_id, product_id, product_name, product_slug, brand,
          provisioning_type, account_email, account_password_encrypted,
          start_date, expires_at, days_remaining, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE,$10,
                  GREATEST(0, ($10::date - CURRENT_DATE)), 'active')`,
        [
          order.id,
          order.user_id,
          order.product_id,
          order.product_name,
          order.product_slug,
          order.product_slug.split('-')[0] || 'aipro',
          order.provisioning_type || 'pre_created',
          acc.email,
          encPassword,
          order.warranty_expire_date,
        ]
      );

      await sendOrderConfirmationEmail(order.guest_email, {
        orderId: order.id,
        productName: order.product_name,
        planDurationMonths: Number(order.plan_duration_months),
        quantity: Number(order.quantity),
        totalUSD: Number(order.total_usd),
        accountEmail: acc.email,
        accountPassword: acc.password,
      });
    } else {
      // No stock — order is paid but unfulfilled; admin fulfils manually
      console.warn(`[Provisioning] No available account for paid order ${order.id}`);
    }
  } catch (provErr) {
    // Provisioning failure must not fail the webhook — admin can fulfil manually
    console.error('[Provisioning] Auto-allocation failed for order', order.id, provErr);
  }

  return { fulfilled: true, order };
};

/**
 * Strip credential material from a subscription payload. The unauthenticated
 * lookup gate must never expose account passwords / 2FA tokens — those are
 * only released after server-side OTP verification (verifyLookupOtp).
 */
export const redactSubscriptionCredentials = (sub: any) => {
  if (!sub) return sub;
  return { ...sub, accountPassword: '', accessToken: '' };
};

/**
 * GET /api/orders/lookup?email=&orderId=
 * Public lookup gate: find an order by Order ID alone, or by Email + guestEmail.
 * Returns only non-sensitive metadata (credentials require OTP verification client-side
 * and are served through the owner's session / delivery page).
 */
export const lookupOrderByEmailOrId = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const orderId = String(req.query.orderId || '').trim().toUpperCase();

  if (!email && !orderId) {
    throw new BadRequestError('Email or order ID is required for lookup.');
  }

  const result = orderId
    ? await pool.query('SELECT * FROM orders WHERE UPPER(id) = $1', [orderId])
    : await pool.query(
        `SELECT * FROM orders WHERE LOWER(guest_email) = $1 OR LOWER(target_email) = $1
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

  if (result.rows.length === 0) {
    throw new NotFoundError('No order matches the lookup information.');
  }

  const order = result.rows[0];

  // Attach active subscription credentials for the matched order
  const subRes = await pool.query(
    `SELECT s.*, p.brand AS prod_brand FROM subscriptions s
     LEFT JOIN products p ON p.id = s.product_id
     WHERE s.order_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [order.id]
  );

  res.status(200).json({
    success: true,
    data: {
      order: formatOrderRow(order),
      // Credentials stay redacted until the customer passes OTP verification
      subscription: subRes.rows[0] ? redactSubscriptionCredentials(formatSubscriptionRow(subRes.rows[0])) : null,
    },
  });
});

/**
 * POST /api/orders/lookup/otp
 * Issue a real, server-side OTP for the warranty self-service lookup.
 * The code is hashed into lookup_otps (5-min expiry); plaintext is only
 * echoed back in development so QA can complete the flow without an email
 * provider. In production the echo disappears and a mailer hook delivers it.
 */
export const requestLookupOtp = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const orderId = String(req.body?.orderId || '').trim().toUpperCase();

  if (!email || !orderId) {
    throw new BadRequestError('Email or order ID is required to send an OTP.');
  }

  // Order must exist AND the claimed email must own it
  const orderRes = await pool.query(
    `SELECT id, guest_email, target_email FROM orders WHERE UPPER(id) = $1`,
    [orderId]
  );
  if (orderRes.rows.length === 0) {
    throw new NotFoundError('Order not found.');
  }
  const owner = orderRes.rows[0];
  const ownsEmail =
    String(owner.guest_email || '').toLowerCase() === email ||
    String(owner.target_email || '').toLowerCase() === email;
  if (!ownsEmail) {
    throw new UnauthorizedError('This email does not own this order.');
  }

  // Throttle: refuse to re-issue while a live (unconsumed) OTP is < 60s old
  const recentRes = await pool.query(
    `SELECT created_at FROM lookup_otps
     WHERE order_id = $1 AND LOWER(email) = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [owner.id, email]
  );
  if (recentRes.rows.length > 0) {
    const ageMs = Date.now() - new Date(recentRes.rows[0].created_at).getTime();
    if (ageMs < 60_000) {
      throw new BadRequestError('An OTP was sent recently. Please wait or enter the code you received.');
    }
  }

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);

  await pool.query(
    `INSERT INTO lookup_otps (order_id, email, code_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
    [owner.id, email, codeHash]
  );

  otpCodeCache.set(`${owner.id}:${email}`, {
    code,
    expiresAt: Date.now() + 5 * 60_000,
  });

  // Production delivery channel: Resend transactional email (best-effort —
  // the API response never depends on the mail provider being reachable).
  const emailResult = await sendLookupOtpEmail(email, code, owner.id);

  const payload: Record<string, unknown> = {
    success: true,
    message: emailResult.delivered
      ? 'Your OTP code has been sent to your email (valid for 5 minutes).'
      : 'Could not send the OTP email. Please try again later or contact support.',
    data: { orderId: owner.id, expiresInSec: 300, emailDelivered: emailResult.delivered },
  };
  if (!env.isProd) {
    // Dev-only delivery channel so QA can complete the flow without a mailbox.
    (payload as any).devCode = code;
    (payload as any).message = 'OTP code generated (valid for 5 minutes).';
  }
  res.status(201).json(payload);
});

/**
 * POST /api/orders/lookup/verify-otp
 * Validate the OTP against PostgreSQL (bcrypt compare, expiry, attempt cap).
 * On success returns the FULL order + subscription record including
 * credentials, which are never exposed by the unauthenticated lookup gate.
 */
export const verifyLookupOtp = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const orderId = String(req.body?.orderId || '').trim().toUpperCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !orderId || !/^\d{6}$/.test(code)) {
    throw new BadRequestError('Invalid OTP code (6 digits required).');
  }

  const otpRes = await pool.query(
    `SELECT * FROM lookup_otps
     WHERE order_id = $1 AND LOWER(email) = $2 AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [orderId, email]
  );
  if (otpRes.rows.length === 0) {
    throw new UnauthorizedError('OTP has expired or was never sent. Please request a new code.');
  }
  const otp = otpRes.rows[0];

  if (Number(otp.attempts) >= 5) {
    await pool.query(`UPDATE lookup_otps SET consumed_at = NOW() WHERE id = $1`, [otp.id]);
    throw new UnauthorizedError('Too many incorrect attempts (more than 5). The OTP has been deactivated.');
  }

  const cached = otpCodeCache.get(`${orderId}:${email}`);
  const devMatch =
    env.NODE_ENV !== 'production' &&
    cached &&
    cached.expiresAt > Date.now() &&
    constantTimeEquals(cached.code, code);

  const ok = devMatch || (await bcrypt.compare(code, otp.code_hash));

  if (!ok) {
    await pool.query(`UPDATE lookup_otps SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
    throw new UnauthorizedError('Incorrect OTP code.');
  }

  await pool.query(`UPDATE lookup_otps SET consumed_at = NOW() WHERE id = $1`, [otp.id]);
  otpCodeCache.delete(`${orderId}:${email}`);

  const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (orderRes.rows.length === 0) {
    throw new NotFoundError('The corresponding order no longer exists.');
  }
  const subRes = await pool.query(
    `SELECT s.*, p.brand AS prod_brand FROM subscriptions s
     LEFT JOIN products p ON p.id = s.product_id
     WHERE s.order_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [orderId]
  );

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully.',
    data: {
      order: formatOrderRow(orderRes.rows[0]),
      subscription: subRes.rows[0] ? formatSubscriptionRow(subRes.rows[0]) : null,
    },
  });
});

/**
 * GET /api/orders/me
 * Get orders for the authenticated user
 */
export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('You must be logged in.')
  }

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(formatOrderRow),
    count: result.rows.length,
  });
});

/**
 * GET /api/orders/:orderId
 * Get a specific order (must belong to the authenticated user or admin)
 */
export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  const { orderId } = req.params;

  if (!userId) {
    throw new UnauthorizedError('You must be logged in.')
  }

  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Order not found.');
  }

  const order = result.rows[0];

  // Only the order owner or admin can view
  if (order.user_id !== userId && userRole !== 'admin') {
    throw new UnauthorizedError('You are not allowed to view this order.');
  }

  res.status(200).json({
    success: true,
    data: formatOrderRow(order),
  });
});

/**
 * GET /api/subscriptions/me
 * Get active subscriptions for the authenticated user
 */
export const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('You must be logged in.')
  }

  const result = await pool.query(
    `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY expires_at ASC`,
    [userId]
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(formatSubscriptionRow),
    count: result.rows.length,
  });
});

/**
 * PATCH /api/subscriptions/:id/auto-renew
 * Toggle auto-renew flag on a subscription (owner only)
 */
export const updateSubscriptionAutoRenew = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new UnauthorizedError('You must be logged in.')

  const { id } = req.params;
  const { autoRenew } = req.body;

  if (typeof autoRenew !== 'boolean') {
    throw new BadRequestError('The autoRenew value must be true/false.');
  }

  const result = await pool.query(
    `UPDATE subscriptions SET auto_renew = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [autoRenew, id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Subscription not found, or you are not allowed to modify it.');
  }

  res.status(200).json({
    success: true,
    message: `Auto-renew has been ${autoRenew ? 'enabled' : 'disabled'}.`,
    data: formatSubscriptionRow(result.rows[0]),
  });
});

/**
 * GET /api/admin/orders
 * Admin: Get all orders with filtering
 */
export const getAllOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const { status, limit: rawLimit, offset: rawOffset, search } = req.query;
  const limit = Math.min(Number(rawLimit) || 50, 200);
  const offset = Number(rawOffset) || 0;

  let query = `SELECT o.*, u.name as user_name, u.email as user_email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(o.id ILIKE $${params.length} OR o.guest_email ILIKE $${params.length} OR o.product_name ILIKE $${params.length})`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM orders o';
  const countParams: any[] = [];
  const countConditions: string[] = [];
  if (status && status !== 'all') {
    countParams.push(status);
    countConditions.push(`o.status = $${countParams.length}`);
  }
  if (search) {
    countParams.push(`%${search}%`);
    countConditions.push(`(o.id ILIKE $${countParams.length} OR o.guest_email ILIKE $${countParams.length})`);
  }
  if (countConditions.length > 0) {
    countQuery += ' WHERE ' + countConditions.join(' AND ');
  }
  const countResult = await pool.query(countQuery, countParams);

  res.status(200).json({
    success: true,
    data: result.rows.map((row) => ({
      ...formatOrderRow(row),
      userName: row.user_name,
      userEmail: row.user_email,
    })),
    total: Number(countResult.rows[0].count),
    count: result.rows.length,
  });
});

/**
 * PATCH /api/admin/orders/:orderId/status
 * Admin: Update order status (e.g., pending → dispatched)
 */
export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['pending', 'paid', 'dispatched', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid status. Only the following are accepted: ${validStatuses.join(', ')}`);
  }

  const result = await pool.query(
    `UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [status, notes || null, orderId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Order not found.');
  }

  // Manual fulfilment path: admin marking a pending order paid triggers the
  // same idempotent fulfilment as the PayPal capture endpoint.
  if (status === 'paid') {
    await markOrderPaid(String(orderId), 'admin', null);
  }

  res.status(200).json({
    success: true,
    message: `Order ${orderId} status updated to "${status}".`,
    data: formatOrderRow(result.rows[0]),
  });
});

/**
 * GET /api/admin/users
 * Admin: Get all users with stats
 */
export const getAllUsersAdmin = catchAsync(async (req: Request, res: Response) => {
  const { search, role } = req.query;

  let query = `
    SELECT u.*,
      COUNT(o.id) as orders_count,
      COALESCE(SUM(o.total_vnd), 0) as total_spent_vnd
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (role && role !== 'all') {
    params.push(role);
    conditions.push(`u.role = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY u.id ORDER BY u.created_at DESC';

  const result = await pool.query(query, params);

  res.status(200).json({
    success: true,
    data: result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      avatar: row.avatar,
      balanceVND: Number(row.balance_vnd),
      balanceUSD: Number(row.balance_usd),
      tier: row.tier,
      phone: row.phone,
      createdAt: row.created_at,
      ordersCount: Number(row.orders_count),
      totalSpentVND: Number(row.total_spent_vnd),
      status: row.status || 'active',
    })),
  });
});

/**
 * PATCH /api/admin/users/:userId/status
 * Admin: Lock (ban) or unlock (activate) a user account
 */
export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'banned'].includes(status)) {
    throw new BadRequestError(`Invalid status. Only the following are accepted: active, banned`);
  }

  const result = await pool.query(
    `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, status`,
    [status, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  res.status(200).json({
    success: true,
    message: `Account ${result.rows[0].email} has been ${status === 'banned' ? 'banned' : 'unbanned'}.`,
    data: result.rows[0],
  });
});

/**
 * PATCH /api/admin/users/:userId/role
 * Admin: Update user role
 */
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['member', 'admin'].includes(role)) {
    throw new BadRequestError('Invalid role.');
  }

  const result = await pool.query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [role, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  res.status(200).json({
    success: true,
    message: `Role for ${result.rows[0].email} updated to "${role}".`,
  });
});

/**
 * POST /api/admin/users/:userId/balance
 * Admin: Add balance to user wallet
 */
export const addUserBalance = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amountUSD, amountVND } = req.body;

  // Single-currency app: admins top up in USD. Legacy amountVND payloads are
  // converted at the fixed rate (25,000 VND = 1 USD) for backward compatibility.
  const amountUsd = Number(
    amountUSD ?? (Number(amountVND) > 0 ? Number(amountVND) / 25000 : NaN)
  );

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new BadRequestError('Top-up amount is invalid.');
  }

  const amountVndDerived = Math.round(amountUsd * 25000);

  const result = await pool.query(
    `UPDATE users SET 
      balance_vnd = balance_vnd + $1,
      balance_usd = balance_usd + $2,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING id, email, balance_vnd, balance_usd`,
    [amountVndDerived, amountUsd, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  res.status(200).json({
    success: true,
    message: `Credited $${amountUsd.toFixed(2)} USD to the user's wallet.`,
    data: {
      balanceVND: Number(result.rows[0].balance_vnd),
      balanceUSD: Number(result.rows[0].balance_usd),
    },
  });
});

/**
 * GET /api/admin/stats
 * Admin: Get dashboard statistics
 */
export const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const [
    revenueToday,
    ordersToday,
    ordersTotal,
    ordersPending,
    usersTotal,
    activeSubscriptions,
  ] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(total_usd), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid','dispatched')`),
    pool.query(`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`),
    pool.query(`SELECT COUNT(*) as count FROM orders`),
    pool.query(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`),
    pool.query(`SELECT COUNT(*) as count FROM users`),
    pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status IN ('active','expiring_soon')`),
  ]);

  res.status(200).json({
    success: true,
    data: {
      revenueToday: Number(revenueToday.rows[0].total),
      ordersToday: Number(ordersToday.rows[0].count),
      ordersTotal: Number(ordersTotal.rows[0].count),
      ordersPending: Number(ordersPending.rows[0].count),
      usersTotal: Number(usersTotal.rows[0].count),
      activeSubscriptions: Number(activeSubscriptions.rows[0].count),
    },
  });
});
