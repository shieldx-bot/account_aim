"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralRouter = void 0;
const express_1 = require("express");
const referral_controller_js_1 = require("../controllers/referral.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
exports.referralRouter = (0, express_1.Router)();
/**
 * POST /api/referral/code
 * Issue (idempotent) a personal invite code. Auth optional — anonymous users
 * can capture an email pre-registration and claim the code later.
 */
exports.referralRouter.post('/code', auth_middleware_js_1.optionalAuth, referral_controller_js_1.issueReferralCode);
/**
 * GET /api/referral/validate/:code
 * Public validation used by the /r/:code invite landing page.
 */
exports.referralRouter.get('/validate/:code', referral_controller_js_1.validateReferralCode);
/**
 * POST /api/referral/click
 * Record an invite click → 30-day last-click attribution for the visitor session.
 */
exports.referralRouter.post('/click', referral_controller_js_1.recordReferralClick);
/**
 * GET /api/referral/me
 * Referrer stats: clicks, FAB conversions, rewards earned (requires auth).
 */
exports.referralRouter.get('/me', auth_middleware_js_1.authenticateToken, referral_controller_js_1.getMyReferralStats);
