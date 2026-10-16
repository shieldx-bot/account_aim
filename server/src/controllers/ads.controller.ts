import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError } from '../utils/app-error.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

export const adsRouter = Router();

/**
 * Offerwall S2S postbacks. Mounted BEFORE the global /api rate limiter in
 * index.ts: providers retry up to 10 times with growing delays (up to ~15 min),
 * which would otherwise exhaust the 100-requests/15-min shared budget.
 * Protection here: per-IP in-memory throttle + per-provider signature/HMAC.
 */
export const adsPostbackRouter = Router();

/** Sanity ceiling for a single postback credit (USD) — anything above is bogus. */
const MAX_POSTBACK_REWARD_USD = 50;
/** Max abandoned watch starts per user per day (anti row-spam). */
const MAX_STARTED_PER_DAY = 20;
/** Reuse window for an unfinished 'started' watch (ms) — stale starts never grant instant claims. */
// (start rows are always fresh; claim enforces min_watch_seconds per row instead)

interface AdsConfig {
  active: boolean;
  dailyCap: number;
  perWatchUSD: number;
  minWatchSeconds: number;
  offerwallUrl: string;
}

async function loadAdsConfig(): Promise<AdsConfig | null> {
  const res = await pool.query(
    `SELECT active, daily_cap, per_watch_usd, min_watch_seconds, offerwall_url
       FROM ads_config WHERE id = 1`
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    active: Boolean(row.active),
    dailyCap: Math.min(Math.max(Number(row.daily_cap) || 0, 0), 100),
    perWatchUSD: Math.min(Math.max(Number(row.per_watch_usd) || 0, 0), 10),
    minWatchSeconds: Math.min(Math.max(Number(row.min_watch_seconds) || 0, 0), 3600),
    offerwallUrl: String(row.offerwall_url || ''),
  };
}

/** Count of rewarded (credited) internal watches for a user today. */
async function creditedToday(userId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS c FROM ads_sessions
      WHERE user_id = $1 AND provider = 'internal' AND status = 'credited'
        AND created_at::date = CURRENT_DATE`,
    [userId]
  );
  return Number(res.rows[0]?.c || 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Member-facing endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ads/status — everything the earn page needs in one round-trip:
 * live wallet balance (DB source of truth), today's cap usage, reward settings
 * and the offerwall iframe URL with the {uid} placeholder already substituted.
 */
adsRouter.get(
  '/status',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const cfg = await loadAdsConfig();
    const userRes = await pool.query(`SELECT balance_usd FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      throw new NotFoundError('Account not found.');
    }
    const usedToday = await creditedToday(userId);
    const offerwallUrl = cfg?.offerwallUrl
      ? cfg.offerwallUrl.replace('{uid}', encodeURIComponent(userId))
      : '';

    res.status(200).json({
      success: true,
      data: {
        active: cfg?.active ?? false,
        dailyCap: cfg?.dailyCap ?? 0,
        perWatchUSD: cfg?.perWatchUSD ?? 0,
        minWatchSeconds: cfg?.minWatchSeconds ?? 0,
        usedToday,
        remainingToday: Math.max(0, (cfg?.dailyCap ?? 0) - usedToday),
        balanceUSD: Number(userRes.rows[0].balance_usd || 0),
        offerwallUrl,
      },
    });
  })
);

/**
 * POST /api/ads/watch/start — open a watch session (server-side timer start).
 * Body: none. Returns the session id the claim call must reference.
 */
adsRouter.post(
  '/watch/start',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const cfg = await loadAdsConfig();
    if (!cfg || !cfg.active || cfg.dailyCap <= 0 || cfg.perWatchUSD <= 0) {
      res.status(200).json({ success: false, message: 'Tính năng xem ADS tích tiền tạm thời chưa mở.' });
      return;
    }
    if ((await creditedToday(userId)) >= cfg.dailyCap) {
      res.status(200).json({
        success: false,
        message: 'Bạn đã đạt giới hạn xem ADS hôm nay. Quay lại vào ngày mai nhé!',
      });
      return;
    }
    // Guard against session-row spam (claiming is separately capped & timed).
    const spam = await pool.query(
      `SELECT COUNT(*)::int AS c FROM ads_sessions
        WHERE user_id = $1 AND provider = 'internal' AND status = 'started'
          AND created_at::date = CURRENT_DATE`,
      [userId]
    );
    if (Number(spam.rows[0]?.c || 0) >= MAX_STARTED_PER_DAY) {
      res.status(200).json({
        success: false,
        message: 'Bạn đã mở quá nhiều phiên xem chưa hoàn thành. Hãy hoàn tất phiên hiện tại.',
      });
      return;
    }

    const created = await pool.query(
      `INSERT INTO ads_sessions (user_id, provider, reward_usd, status)
       VALUES ($1, 'internal', 0, 'started') RETURNING id, created_at`,
      [userId]
    );
    res.status(201).json({
      success: true,
      data: {
        sessionId: created.rows[0].id,
        startedAt: new Date(created.rows[0].created_at).toISOString(),
        minWatchSeconds: cfg.minWatchSeconds,
      },
    });
  })
);

/**
 * POST /api/ads/watch/claim — body { sessionId }.
 * Server-enforced rules (the browser can never skip them):
 *   1. the session belongs to the caller and is still 'started';
 *   2. at least min_watch_seconds elapsed since the server-side start;
 *   3. the daily cap still has room (re-checked under the row lock).
 * Credit + state flip happen in ONE transaction with the users row locked,
 * so concurrent claims cannot double-pay or overshoot the cap.
 */
adsRouter.post(
  '/watch/claim',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) {
      throw new BadRequestError('sessionId is required.');
    }
    const cfg = await loadAdsConfig();
    if (!cfg || !cfg.active || cfg.perWatchUSD <= 0) {
      res.status(200).json({ success: false, message: 'Tính năng xem ADS tích tiền tạm thời chưa mở.' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the wallet row first: serializes concurrent claims for this user.
      const userRes = await client.query(
        `SELECT balance_usd FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );
      if (userRes.rows.length === 0) {
        throw new NotFoundError('Account not found.');
      }

      const sessRes = await client.query(
        `SELECT id, status, created_at FROM ads_sessions
          WHERE id = $1 AND user_id = $2 AND provider = 'internal' FOR UPDATE`,
        [sessionId, userId]
      );
      if (sessRes.rows.length === 0) {
        throw new NotFoundError('Watch session not found.');
      }
      const session = sessRes.rows[0];
      if (session.status === 'credited') {
        throw new BadRequestError('Phiên xem này đã được nhận thưởng.');
      }
      if (session.status === 'reversed') {
        throw new BadRequestError('Phiên xem này đã bị hủy.');
      }

      const elapsedMs = Date.now() - new Date(session.created_at).getTime();
      if (elapsedMs < cfg.minWatchSeconds * 1000) {
        throw new BadRequestError(
          `Bạn cần xem đủ ${cfg.minWatchSeconds} giây trước khi nhận thưởng.`
        );
      }

      // Re-check the daily cap under the lock (the earlier check was advisory).
      const used = await client.query(
        `SELECT COUNT(*)::int AS c FROM ads_sessions
          WHERE user_id = $1 AND provider = 'internal' AND status = 'credited'
            AND created_at::date = CURRENT_DATE`,
        [userId]
      );
      if (Number(used.rows[0].c) >= cfg.dailyCap) {
        throw new BadRequestError('Bạn đã đạt giới hạn xem ADS hôm nay. Quay lại vào ngày mai nhé!');
      }

      await client.query(
        `UPDATE users SET balance_usd = balance_usd + $1,
           balance_vnd = balance_vnd + ROUND($1 * 25000),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [cfg.perWatchUSD, userId]
      );
      await client.query(
        `UPDATE ads_sessions SET status = 'credited', reward_usd = $1 WHERE id = $2`,
        [cfg.perWatchUSD, sessionId]
      );

      await client.query('COMMIT');
      res.status(201).json({
        success: true,
        data: {
          rewardUSD: cfg.perWatchUSD,
          balanceUSD: Number(userRes.rows[0].balance_usd) + cfg.perWatchUSD,
          remainingToday: Math.max(0, cfg.dailyCap - (Number(used.rows[0].c) + 1)),
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/** GET /api/ads/history — latest 50 ledger rows for the member earn page. */
adsRouter.get(
  '/history',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const result = await pool.query(
      `SELECT id, provider, tx_id, reward_usd, status, created_at
        FROM ads_sessions WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );
    res.status(200).json({
      success: true,
      data: result.rows.map((r: any) => ({
        id: r.id,
        provider: r.provider,
        txId: r.tx_id ?? null,
        rewardUSD: Number(r.reward_usd),
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Admin config (mirrors the Lucky Wheel admin tuning surface)
// ─────────────────────────────────────────────────────────────────────────────

adsRouter.get(
  '/admin/config',
  authenticateToken,
  requireAdmin,
  catchAsync(async (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: await loadAdsConfig() });
  })
);

adsRouter.put(
  '/admin/config',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const active = Boolean(req.body?.active);
    const dailyCap = Math.min(Math.max(Number(req.body?.dailyCap) || 0, 0), 100);
    const perWatchUSD = Math.min(Math.max(Number(req.body?.perWatchUSD) || 0, 0), 10);
    const minWatchSeconds = Math.min(Math.max(Number(req.body?.minWatchSeconds) || 0, 0), 3600);
    const offerwallUrl = String(req.body?.offerwallUrl || '').trim().slice(0, 500);

    const updated = await pool.query(
      `UPDATE ads_config SET active = $1, daily_cap = $2, per_watch_usd = $3,
         min_watch_seconds = $4, offerwall_url = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING active, daily_cap, per_watch_usd, min_watch_seconds, offerwall_url`,
      [active, dailyCap, perWatchUSD, minWatchSeconds, offerwallUrl]
    );
    if (updated.rows.length === 0) {
      throw new NotFoundError('Ads config row missing.');
    }
    res.status(200).json({ success: true, data: await loadAdsConfig() });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Offerwall S2S postbacks — the ONLY place external rewards are credited.
// The browser never calls this; credit decisions are made here with a verified
// signature + idempotent ledger write, so retries and replays are harmless.
// ─────────────────────────────────────────────────────────────────────────────

/** In-memory per-IP postback throttle: 200 requests / 10 minutes. */
const POSTBACK_RATE_LIMIT = 200;
const POSTBACK_WINDOW_MS = 10 * 60 * 1000;
const postbackHits = new Map<string, number[]>();

function isPostbackRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (postbackHits.get(ip) || []).filter((t) => now - t < POSTBACK_WINDOW_MS);
  list.push(now);
  postbackHits.set(ip, list);
  return list.length > POSTBACK_RATE_LIMIT;
}

/** Providers with documented reversal status codes (must match each doc). */
const REVERSAL_STATUS: Record<string, string[]> = {
  bitlabs: [],                                            // reward callbacks are always completions
  torox: ['2', 'reversed'],                               // 1 = credited, 2 = reversed
  offertoro: ['2', 'reversed'],
  adgate: ['0', 'reversed'],                              // 1 = new conversion, 0 = reversed
  lootably: ['0', 'reversed'],
  cpxresearch: ['2', 'canceled'],                         // 1 = completed, 2 = canceled
  adgem: ['0', 'reversed', 'canceled'],
};

function pick(query: Record<string, any>, keys: string[]): string {
  for (const k of keys) {
    const v = query?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Verify the request is genuinely from the provider:
 * - bitlabs: HMAC-SHA1 (app secret) over the full callback URL WITHOUT the
 *   trailing &hash=… param, hex-compared with the sent hash (their documented
 *   scheme — the URL must be used exactly as received, never re-encoded).
 * - everyone else: shared `secret` query param (ADS_POSTBACK_SECRET). In
 *   production an unconfigured secret is a hard reject (no silent trust).
 */
function verifyPostback(req: Request, provider: string): boolean {
  if (provider === 'bitlabs') {
    const secret = env.ADS_BITLABS_APP_SECRET;
    if (!secret) return !env.isProd; // dev convenience only
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const parts = fullUrl.split('&hash=');
    const provided = pick(req.query, ['hash']);
    if (!provided) return false;
    const expected = crypto.createHmac('sha1', secret).update(parts[0]).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  const secret = env.ADS_POSTBACK_SECRET;
  if (!secret) return !env.isProd;
  const provided = pick(req.query, ['secret', 'hash', 'secure_hash']);
  if (!provided) return false;
  const a = Buffer.from(String(secret), 'utf8');
  const b = Buffer.from(provided, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * GET /api/ads/postback/:provider
 * Normalized params accepted (providers name them differently):
 *   user   → uid | user_id | s1 | userId
 *   tx     → tx | transactionID | conversion_id | trans_id
 *   reward → raw | payout | amount_usd | revenue   (USD; falls back to app-currency value)
 *   status → status | type | state                 (reversal codes per provider table)
 * Retries are safe: UNIQUE(provider, tx_id) absorbs duplicates with a 200 so
 * the provider stops retrying. Reversals flip an already-credited row and clamp
 * the wallet back down (never below zero).
 */
adsPostbackRouter.get(
  '/:provider',
  catchAsync(async (req: Request, res: Response) => {
    const provider = String(req.params.provider || '').toLowerCase().slice(0, 30);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    if (isPostbackRateLimited(ip)) {
      res.status(429).json({ success: false, message: 'Too many postbacks.' });
      return;
    }
    if (!REVERSAL_STATUS[provider]) {
      res.status(404).json({ success: false, message: 'Unknown ads provider.' });
      return;
    }
    if (!verifyPostback(req, provider)) {
      console.warn(`[AdsPostback] rejected unsigned/invalid callback from ${provider} ip=${ip}`);
      res.status(403).json({ success: false, message: 'Invalid postback signature.' });
      return;
    }

    const userId = pick(req.query, ['uid', 'user_id', 's1', 'userId', 'user']);
    if (!userId || !/^[0-9a-fA-F-]{36}$/.test(userId)) {
      // Not our user yet (or bad id): return non-200 so the provider retries later.
      res.status(404).json({ success: false, message: 'Unknown user.' });
      return;
    }

    const rewardUSD = Math.min(
      Math.max(Number(pick(req.query, ['raw', 'payout', 'amount_usd', 'revenue', 'value_usd']) || 0), 0),
      MAX_POSTBACK_REWARD_USD
    );
    const statusRaw = pick(req.query, ['status', 'type', 'state']).toLowerCase();
    const isReversal = REVERSAL_STATUS[provider].includes(statusRaw);

    // Idempotency key: provider tx id, or a deterministic digest of the exact
    // query when a provider does not send one (identical retries collapse).
    const rawQuery = req.originalUrl.split('?')[1] || '';
    const txId =
      pick(req.query, ['tx', 'transactionID', 'conversion_id', 'trans_id', 'txid']) ||
      `q_${crypto.createHash('sha1').update(rawQuery).digest('hex')}`;

    const userRes = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Unknown user.' });
      return;
    }

    if (isReversal) {
      // Flip a previously-credited transaction exactly once and clamp the wallet.
      const flipped = await pool.query(
        `UPDATE ads_sessions SET status = 'reversed'
          WHERE provider = $1 AND tx_id = $2 AND status = 'credited'
          RETURNING user_id, reward_usd`,
        [provider, txId]
      );
      if (flipped.rows.length > 0) {
        await pool.query(
          `UPDATE users SET balance_usd = GREATEST(balance_usd - $1, 0),
             balance_vnd = GREATEST(balance_vnd - ROUND($1 * 25000), 0),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [Number(flipped.rows[0].reward_usd), flipped.rows[0].user_id]
        );
      }
      res.status(200).json({ success: true, message: 'Reversal processed.' });
      return;
    }

    if (rewardUSD <= 0) {
      res.status(400).json({ success: false, message: 'Missing reward amount.' });
      return;
    }

    // Credit path: one transaction, ledger-first with ON CONFLICT DO NOTHING so
    // a provider retry (same provider + tx) can never pay twice.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO ads_sessions (user_id, provider, tx_id, reward_usd, status)
         VALUES ($1, $2, $3, $4, 'credited')
         ON CONFLICT (provider, tx_id) DO NOTHING
         RETURNING id`,
        [userId, provider, txId, rewardUSD]
      );
      if (inserted.rows.length === 0) {
        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Duplicate postback ignored.' });
        return;
      }
      await client.query(
        `UPDATE users SET balance_usd = balance_usd + $1,
           balance_vnd = balance_vnd + ROUND($1 * 25000),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [rewardUSD, userId]
      );
      await client.query('COMMIT');
      res.status(200).json({ success: true, message: 'Reward credited.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);
