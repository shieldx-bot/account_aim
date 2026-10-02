import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError } from '../utils/app-error.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

export const luckyWheelRouter = Router();

/** In-memory per-IP spin throttle: 10 spins / 10 minutes (visitor cap is in DB). */
const SPIN_RATE_LIMIT = 10;
const SPIN_WINDOW_MS = 10 * 60 * 1000;
const spinHits = new Map<string, number[]>();

function isSpinRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (spinHits.get(ip) || []).filter((t) => now - t < SPIN_WINDOW_MS);
  list.push(now);
  spinHits.set(ip, list);
  return list.length > SPIN_RATE_LIMIT;
}

interface WheelSegment {
  percent: number;
  weight: number;
}

async function loadWheelConfig() {
  const res = await pool.query(`SELECT active, segments, coupon_ttl_minutes FROM wheel_config WHERE id = 1`);
  if (res.rows.length === 0) {
    return { active: false, segments: [] as WheelSegment[], couponTtlMinutes: 15 };
  }
  return {
    active: Boolean(res.rows[0].active),
    segments: res.rows[0].segments as WheelSegment[],
    couponTtlMinutes: Math.min(Math.max(Number(res.rows[0].coupon_ttl_minutes) || 15, 1), 10080),
  };
}

/** GET /api/wheel/config — public: segments + weights + prize TTL so the SPA
 * can render the wheel AND tell the customer upfront how long the code lives. */
luckyWheelRouter.get(
  '/config',
  catchAsync(async (_req: Request, res: Response) => {
    const cfg = await loadWheelConfig();
    res.status(200).json({ success: true, data: cfg });
  })
);

/**
 * GET /api/wheel/stats — public, real social proof: how many prize codes have
 * been issued all-time. Rendered on the wheel modal as a live counter.
 */
luckyWheelRouter.get(
  '/stats',
  catchAsync(async (_req: Request, res: Response) => {
    const stats = await pool.query(`SELECT COUNT(*)::int AS total FROM coupons WHERE source = 'wheel'`);
    res.status(200).json({ success: true, data: { totalIssued: Number(stats.rows[0]?.total || 0) } });
  })
);

/**
 * POST /api/wheel/spin — public. Body: { visitorId }.
 * One spin per browser: a visitor who already holds an unused wheel coupon
 * gets the same code back instead of a new draw. The prize is drawn
 * server-side with the admin-tuned weights; the client never influences it.
 */
luckyWheelRouter.post(
  '/spin',
  catchAsync(async (req: Request, res: Response) => {
    const visitorId = String(req.body?.visitorId || '').trim().slice(0, 64);
    if (!visitorId) {
      throw new BadRequestError('visitorId is required.');
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    if (isSpinRateLimited(ip)) {
      res.status(429).json({
        success: false,
        message: 'Too many spins. Please try again later.',
      });
      return;
    }

    const cfg = await loadWheelConfig();
    if (!cfg.active || cfg.segments.length === 0) {
      res.status(200).json({ success: true, data: { available: false } });
      return;
    }

    // Lapsed prizes are worthless — sweep them so they can never block anything
    // and the visitor becomes eligible for a fresh spin (re-engagement loop).
    await pool.query(
      `DELETE FROM coupons
       WHERE source = 'wheel' AND visitor_id = $1 AND used_by_order IS NULL
         AND expires_at IS NOT NULL AND expires_at <= NOW()`,
      [visitorId]
    );

    // Idempotency: one live prize per browser. An unused, unexpired wheel coupon
    // is returned as-is so a refresh never grants a second spin.
    const existing = await pool.query(
      `SELECT code, discount_percent, expires_at FROM coupons
       WHERE source = 'wheel' AND visitor_id = $1 AND active = true AND used_by_order IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [visitorId]
    );
    if (existing.rows.length > 0) {
      res.status(200).json({
        success: true,
        data: {
          available: true,
          alreadySpun: true,
          code: existing.rows[0].code,
          discountPercent: Number(existing.rows[0].discount_percent),
          expiresAt: existing.rows[0].expires_at ? new Date(existing.rows[0].expires_at).toISOString() : null,
        },
      });
      return;
    }

    // Weighted random draw.
    const totalWeight = cfg.segments.reduce((sum, s) => sum + Math.max(0, Number(s.weight)), 0);
    if (totalWeight <= 0) {
      throw new BadRequestError('Wheel is misconfigured (all weights are zero).');
    }
    let roll = Math.random() * totalWeight;
    let prize: WheelSegment = cfg.segments[cfg.segments.length - 1];
    for (const segment of cfg.segments) {
      roll -= Math.max(0, Number(segment.weight));
      if (roll <= 0) {
        prize = segment;
        break;
      }
    }

    // Generate a unique code (LUCKY-XXXXXX).
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      code = `LUCKY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const dup = await pool.query(`SELECT 1 FROM coupons WHERE code = $1`, [code]);
      if (dup.rows.length === 0) break;
    }

    // The prize code is a burning ticket: short, admin-tuned lifetime drives
    // the countdown urgency (and the code really does die at 0).
    const expires = new Date(Date.now() + cfg.couponTtlMinutes * 60 * 1000);
    await pool.query(
      `INSERT INTO coupons (code, discount_percent, active, expires_at, source, visitor_id, max_uses)
       VALUES ($1, $2, true, $3, 'wheel', $4, 1)
       ON CONFLICT (code) DO NOTHING`,
      [code, prize.percent, expires, visitorId]
    );

    res.status(201).json({
      success: true,
      data: {
        available: true,
        alreadySpun: false,
        code,
        discountPercent: Number(prize.percent),
        expiresAt: expires.toISOString(),
      },
    });
  })
);

/** GET /api/wheel/admin/config — admin view of the prize table. */
luckyWheelRouter.get(
  '/admin/config',
  authenticateToken,
  requireAdmin,
  catchAsync(async (_req: Request, res: Response) => {
    const cfg = await loadWheelConfig();
    res.status(200).json({ success: true, data: cfg });
  })
);

/** PUT /api/wheel/admin/config — admin tunes weights / active switch. */
luckyWheelRouter.put(
  '/admin/config',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const active = Boolean(req.body?.active);
    const rawSegments = Array.isArray(req.body?.segments) ? req.body.segments : null;
    if (!rawSegments || rawSegments.length === 0) {
      throw new BadRequestError('segments array is required.');
    }

    // Sanitize: percent 10..90 in steps of 10, weight 0..1000.
    const segments: WheelSegment[] = (rawSegments as any[])
      .map((s: any) => ({ percent: Number(s?.percent), weight: Number(s?.weight) }))
      .filter((s: WheelSegment) => Number.isInteger(s.percent) && s.percent >= 10 && s.percent <= 90 && s.weight >= 0 && s.weight <= 1000)
      .map((s: WheelSegment) => ({ percent: s.percent, weight: s.weight }));
    if (segments.length === 0 || segments.reduce((t, s) => t + s.weight, 0) <= 0) {
      throw new BadRequestError('At least one segment with a positive weight is required.');
    }

    // Prize lifetime in minutes: 5 minutes .. 7 days, default 15.
    const rawTtl = Number(req.body?.couponTtlMinutes);
    const couponTtlMinutes = Number.isFinite(rawTtl) && rawTtl > 0 ? Math.min(Math.max(Math.round(rawTtl), 5), 10080) : 15;

    const result = await pool.query(
      `UPDATE wheel_config SET active = $1, segments = $2::jsonb, coupon_ttl_minutes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1 RETURNING active, segments, coupon_ttl_minutes`,
      [active, JSON.stringify(segments), couponTtlMinutes]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Wheel config row missing.');
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  })
);
