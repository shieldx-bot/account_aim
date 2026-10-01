import { Router } from 'express';
import { issueReferralCode, validateReferralCode, recordReferralClick, getMyReferralStats, } from '../controllers/referral.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
export const referralRouter = Router();
/**
 * POST /api/referral/code
 * Issue (idempotent) a personal invite code. Auth optional — anonymous users
 * can capture an email pre-registration and claim the code later.
 */
referralRouter.post('/code', optionalAuth, issueReferralCode);
/**
 * GET /api/referral/validate/:code
 * Public validation used by the /r/:code invite landing page.
 */
referralRouter.get('/validate/:code', validateReferralCode);
/**
 * POST /api/referral/click
 * Record an invite click → 30-day last-click attribution for the visitor session.
 */
referralRouter.post('/click', recordReferralClick);
/**
 * GET /api/referral/me
 * Referrer stats: clicks, FAB conversions, rewards earned (requires auth).
 */
referralRouter.get('/me', authenticateToken, getMyReferralStats);
