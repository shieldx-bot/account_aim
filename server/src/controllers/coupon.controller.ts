import { Router } from 'express';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError } from '../utils/app-error.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

export const couponRouter = Router();

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
