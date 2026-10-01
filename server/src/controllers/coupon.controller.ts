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
      `SELECT code, discount_percent, expires_at FROM coupons
       WHERE UPPER(code) = $1 AND active = true
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Invalid or expired coupon code.',
      });
    }

    const coupon = result.rows[0];
    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} applied: ${coupon.discount_percent}% off.`,
      data: { code: coupon.code, discountPercent: Number(coupon.discount_percent) },
    });
  })
);
