import crypto from 'crypto';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError } from '../utils/app-error.js';
/**
 * ============================================================
 * Referral / #InviteToPay backend controller
 * - POST /api/referral/code      → issue (or fetch) personal invite code
 * - GET  /api/referral/validate/:code → check a code exists (landing /r/:code)
 * - POST /api/referral/click     → record an invite click (30-day last-click attribution)
 * - GET  /api/referral/me        → referrer stats (clicks, FABs, rewards)
 * ============================================================
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
const generateRefCode = () => {
    let out = '';
    for (let i = 0; i < 5; i++)
        out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    return `APX-${out}`;
};
const isValidVisitorId = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);
const normalizeCode = (c) => String(c || '').trim().toUpperCase().slice(0, 20);
/**
 * POST /api/referral/code
 * Body: { email?: string }
 * Idempotent per authenticated user; anonymous sessions get one code per email.
 */
export const issueReferralCode = catchAsync(async (req, res) => {
    const userId = req.user?.id ?? null;
    const email = String(req.body?.email || '')
        .trim()
        .toLowerCase()
        .slice(0, 255) || null;
    if (!userId && !email) {
        throw new BadRequestError('Please log in or provide an email to generate an invite code.');
    }
    // Idempotency: reuse existing code for this user (or this email)
    const existing = userId
        ? await pool.query('SELECT code FROM referral_codes WHERE user_id = $1 LIMIT 1', [userId])
        : await pool.query('SELECT code FROM referral_codes WHERE user_id IS NULL AND email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
    if (existing.rows.length > 0) {
        res.status(200).json({ success: true, data: { code: existing.rows[0].code, reused: true } });
        return;
    }
    // Collision-safe insert
    let code = generateRefCode();
    let inserted = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const r = await pool.query(`INSERT INTO referral_codes (code, user_id, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING
         RETURNING code`, [code, userId, email]);
            if (r.rows.length > 0) {
                inserted = r.rows[0];
                break;
            }
            code = generateRefCode();
        }
        catch (err) {
            // Unique violation on (user_id/email) partial uniqueness isn't enforced at DB level,
            // so only code PK collisions matter — retry above handles them.
            if (err?.code !== '23505')
                throw err;
            code = generateRefCode();
        }
    }
    if (!inserted) {
        throw new BadRequestError('Could not create an invite code, please try again.');
    }
    res.status(201).json({ success: true, data: { code: inserted.code, reused: false } });
});
/**
 * GET /api/referral/validate/:code
 * Public — used by the /r/:code landing route to verify the invite exists.
 */
export const validateReferralCode = catchAsync(async (req, res) => {
    const code = normalizeCode(req.params.code);
    const result = await pool.query('SELECT code, created_at FROM referral_codes WHERE code = $1', [code]);
    if (result.rows.length === 0) {
        throw new NotFoundError('This invite code does not exist or has expired.');
    }
    res.json({ success: true, data: { valid: true, code } });
});
/**
 * POST /api/referral/click
 * Body: { code: string, visitorId: string }
 * Records an invite click and refreshes last-click attribution (30 days).
 */
export const recordReferralClick = catchAsync(async (req, res) => {
    const code = normalizeCode(req.body?.code);
    const visitorId = String(req.body?.visitorId || '');
    if (!code || !isValidVisitorId(visitorId)) {
        throw new BadRequestError('Invalid click information.');
    }
    const codeRow = await pool.query('SELECT code FROM referral_codes WHERE code = $1', [code]);
    if (codeRow.rows.length === 0) {
        throw new NotFoundError('This invite code does not exist.');
    }
    await pool.query(`UPDATE referral_codes SET click_count = click_count + 1, last_click_at = NOW() WHERE code = $1`, [code]);
    // Last-click wins: expire older attributions for this visitor, then upsert fresh 30-day window
    await pool.query(`UPDATE referral_attributions SET expires_at = NOW()
     WHERE visitor_id = $1 AND expires_at > NOW() AND code <> $2`, [visitorId, code]);
    await pool.query(`INSERT INTO referral_attributions (code, visitor_id, clicked_at, expires_at)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '30 days')
     ON CONFLICT (code, visitor_id)
     DO UPDATE SET clicked_at = NOW(), expires_at = NOW() + INTERVAL '30 days', order_id = NULL, converted_at = NULL`, [code, visitorId]);
    res.status(201).json({ success: true, message: 'Attribution recorded successfully (last-click, 30 days).' });
});
/**
 * Attach referral attribution + grant reward inside order creation.
 * Called by createOrder when the payload carries a server-validated referralCode.
 * Anti-abuse rules (FAB validation):
 *  - code must exist in DB (never trust client-generated codes)
 *  - self-referral blocked (referrer email == buyer email)
 *  - exactly 1 reward per paid order (order_id UNIQUE in referral_rewards)
 *  - reward auto-granted to referrer wallet balance_vnd
 */
export const processOrderReferral = async (params) => {
    const { referralCode, orderId, buyerUserId, buyerEmail, orderTotalVND } = params;
    const code = normalizeCode(referralCode);
    const codeRes = await pool.query('SELECT code, user_id, email FROM referral_codes WHERE code = $1', [code]);
    if (codeRes.rows.length === 0) {
        return { attributed: false, rewardGranted: false, reason: 'invalid_code' };
    }
    const refCodeRow = codeRes.rows[0];
    // Resolve referrer: bound user, or claim by captured pre-registration email
    let referrerId = refCodeRow.user_id;
    if (!referrerId && refCodeRow.email) {
        const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [String(refCodeRow.email).toLowerCase()]);
        referrerId = u.rows[0]?.id ?? null;
        if (referrerId) {
            await pool.query('UPDATE referral_codes SET user_id = $1 WHERE code = $2', [referrerId, code]);
        }
    }
    // Self-referral block
    if (referrerId && referrerId === buyerUserId) {
        return { attributed: false, rewardGranted: false, reason: 'self_referral' };
    }
    // Record attribution on the order itself
    await pool.query('UPDATE orders SET referral_code = $1 WHERE id = $2', [code, orderId]);
    // Mark visitor attribution converted if we can identify the buyer's session
    try {
        await pool.query(`UPDATE referral_attributions SET order_id = $2, converted_at = NOW()
       WHERE code = $1 AND expires_at > NOW() AND converted_at IS NULL`, [code, orderId]);
    }
    catch {
        /* attribution table optional — never block a paid order */
    }
    if (!referrerId) {
        // Valid code but referrer not registered yet — keep pending reward for claim later
        await pool.query(`INSERT INTO referral_rewards (code, referrer_id, order_id, amount_vnd, status)
       VALUES ($1, NULL, $2, $3, 'pending')
       ON CONFLICT (order_id) DO NOTHING`, [code, orderId, Math.round(orderTotalVND * 0.1)]);
        return { attributed: true, rewardGranted: false, reason: 'referrer_not_registered' };
    }
    // Get order details to know which product was purchased
    const orderRes = await pool.query(`SELECT o.product_id, o.product_name, o.product_slug, p.brand 
     FROM orders o
     LEFT JOIN products p ON p.id = o.product_id
     WHERE o.id = $1`, [orderId]);
    if (orderRes.rows.length === 0) {
        return { attributed: true, rewardGranted: false, reason: 'order_not_found' };
    }
    const order = orderRes.rows[0];
    // Grant reward: Create a 1-month subscription of the same product for the referrer
    // Check if reward already granted for this order (UNIQUE order_id constraint)
    const rewardRes = await pool.query(`INSERT INTO referral_rewards (code, referrer_id, order_id, product_id, amount_vnd, reward_type, status, granted_at)
     VALUES ($1, $2, $3, $4, 0, 'subscription_1month', 'granted', NOW())
     ON CONFLICT (order_id) DO NOTHING
     RETURNING id`, [code, referrerId, orderId, order.product_id]);
    if (rewardRes.rows.length === 0) {
        return { attributed: true, rewardGranted: false, reason: 'duplicate_reward' };
    }
    // Create a 1-month subscription for the referrer
    const startDate = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    const daysRemaining = Math.ceil((expiresAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    await pool.query(`INSERT INTO subscriptions (
      order_id, user_id, product_id, product_name, product_slug, brand,
      provisioning_type, start_date, expires_at, days_remaining, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'referral_reward', CURRENT_DATE, $7, $8, 'active')`, [
        orderId,
        referrerId,
        order.product_id,
        order.product_name,
        order.product_slug,
        order.brand || order.product_slug.split('-')[0] || 'aipro',
        expiresAt.toISOString().split('T')[0],
        daysRemaining,
    ]);
    return { attributed: true, rewardGranted: true };
};
/**
 * GET /api/referral/me (authenticated)
 * Referrer dashboard stats: invites sent (clicks), valid FABs, rewards earned.
 */
export const getMyReferralStats = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const codes = await pool.query('SELECT code, click_count, created_at FROM referral_codes WHERE user_id = $1', [userId]);
    const codeList = codes.rows.map((r) => r.code);
    let stats = { totalClicks: 0, totalRewards: 0, pendingRewards: 0, conversions: [] };
    if (codeList.length > 0) {
        const agg = await pool.query(`SELECT
         COALESCE(SUM(click_count), 0)::int AS total_clicks
       FROM referral_codes WHERE user_id = $1`, [userId]);
        const rewards = await pool.query(`SELECT rr.order_id, rr.amount_vnd, rr.reward_type, rr.product_id, rr.status, rr.created_at, 
              o.product_name, p.name as product_name_full, p.brand
       FROM referral_rewards rr
       LEFT JOIN orders o ON o.id = rr.order_id
       LEFT JOIN products p ON p.id = rr.product_id
       WHERE rr.referrer_id = $1 OR rr.code = ANY($2::text[])
       ORDER BY rr.created_at DESC`, [userId, codeList]);
        stats = {
            totalClicks: agg.rows[0].total_clicks,
            totalRewards: rewards.rows.filter((r) => r.status === 'granted').length, // Count of accounts received
            pendingRewards: rewards.rows.filter((r) => r.status === 'pending').length,
            conversions: rewards.rows,
        };
    }
    res.json({
        success: true,
        data: {
            codes: codeList,
            ...stats,
        },
    });
});
