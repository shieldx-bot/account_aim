import { Router } from 'express';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError } from '../utils/app-error.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

export const couponRouter = Router();

const toCouponDto = (c: any) => ({
  code: c.code,
  discountPercent: Number(c.discount_percent),
  active: Boolean(c.active),
  expiresAt: c.expires_at ? new Date(c.expires_at).toISOString() : null,
  source: c.source,
  usedByOrder: c.used_by_order ?? null,
});

/**
 * GET /api/coupons/admin/list
 * Admin: latest 200 coupons for the management card — includes per-visitor
 * wheel prizes so support can extend a customer's code before it lapses.
 */
couponRouter.get(
  '/admin/list',
  authenticateToken,
  requireAdmin,
  catchAsync(async (_req, res) => {
    const result = await pool.query(
      `SELECT code, discount_percent, active, expires_at, source, used_by_order
       FROM coupons ORDER BY created_at DESC LIMIT 200`
    );
    res.status(200).json({ success: true, data: result.rows.map(toCouponDto) });
  })
);

/**
 * PATCH /api/coupons/admin/:code
 * Admin: adjust a coupon's lifetime (ISO `expiresAt`, or null = never expires)
 * and/or flip its `active` switch. Body: { expiresAt?, active? }.
 */
couponRouter.patch(
  '/admin/:code',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req, res) => {
    const code = String(req.params?.code || '').trim().toUpperCase();
    if (!code) {
      throw new BadRequestError('Coupon code is required.');
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (req.body?.expiresAt !== undefined) {
      if (req.body.expiresAt === null || req.body.expiresAt === '') {
        params.push(null);
        updates.push(`expires_at = $${params.length}`);
      } else {
        const d = new Date(req.body.expiresAt);
        if (Number.isNaN(d.getTime())) {
          throw new BadRequestError('expiresAt must be a valid ISO date or null.');
        }
        params.push(d.toISOString());
        updates.push(`expires_at = $${params.length}`);
      }
    }
    if (req.body?.active !== undefined) {
      params.push(Boolean(req.body.active));
      updates.push(`active = $${params.length}`);
    }
    if (updates.length === 0) {
      throw new BadRequestError('Nothing to update — send expiresAt and/or active.');
    }

    params.push(code);
    const result = await pool.query(
      `UPDATE coupons SET ${updates.join(', ')} WHERE UPPER(code) = $${params.length}
       RETURNING code, discount_percent, active, expires_at, source, used_by_order`,
      params
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Coupon not found.');
    }

    res.status(200).json({ success: true, data: toCouponDto(result.rows[0]) });
  })
);

/**
 * POST /api/coupons/validate
 * Server-side coupon validation — replaces the hardcoded client-side list
 * (DEVVIP10/AI2025) so discount rates are never trusted from the browser.
 *
 * Returns `expiresAt` (ISO) when the coupon has a lifetime so the checkout can
 * show a real countdown; a lapsed code is reported with reason 'expired' so the
 * UI can steer the customer back to the wheel for a fresh one.
 */
couponRouter.post(
  '/validate',
  authenticateToken,
  catchAsync(async (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) {
      throw new BadRequestError('Please enter a coupon code.');
    }

    const result = await pool.query(
      `SELECT code, discount_percent, expires_at, active FROM coupons
       WHERE UPPER(code) = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Invalid or expired coupon code.',
        reason: 'unknown',
      });
    }

    const coupon = result.rows[0];
    const expired = coupon.expires_at ? new Date(coupon.expires_at).getTime() <= Date.now() : false;
    if (!coupon.active || expired) {
      return res.status(200).json({
        success: false,
        message: expired ? 'This coupon has expired.' : 'This coupon is no longer active.',
        reason: expired ? 'expired' : 'inactive',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} applied: ${coupon.discount_percent}% off.`,
      data: {
        code: coupon.code,
        discountPercent: Number(coupon.discount_percent),
        expiresAt: coupon.expires_at ? new Date(coupon.expires_at).toISOString() : null,
      },
    });
  })
);
