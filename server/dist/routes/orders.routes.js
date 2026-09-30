"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = exports.subscriptionsRouter = exports.ordersRouter = void 0;
const express_1 = require("express");
const orders_controller_js_1 = require("../controllers/orders.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
exports.ordersRouter = (0, express_1.Router)();
exports.subscriptionsRouter = (0, express_1.Router)();
exports.adminRouter = (0, express_1.Router)();
// ─────────── Orders (User) ───────────
/**
 * POST /api/orders
 * Create a new order (requires auth)
 */
exports.ordersRouter.post('/', auth_middleware_js_1.authenticateToken, orders_controller_js_1.createOrder);
/**
 * GET /api/orders/me
 * Get my orders (requires auth)
 */
exports.ordersRouter.get('/me', auth_middleware_js_1.authenticateToken, orders_controller_js_1.getMyOrders);
/**
 * GET /api/orders/lookup?email=&orderId=
 * Public lookup gate for the Warranty Self-Service page (no auth).
 */
exports.ordersRouter.get('/lookup', orders_controller_js_1.lookupOrderByEmailOrId);
/**
 * POST /api/orders/lookup/otp
 * Issue a server-side OTP (bcrypt-hashed, 5-min expiry) for the warranty page.
 */
exports.ordersRouter.post('/lookup/otp', orders_controller_js_1.requestLookupOtp);
/**
 * POST /api/orders/lookup/verify-otp
 * Validate OTP against PostgreSQL; unlocks full order + credentials on success.
 */
exports.ordersRouter.post('/lookup/verify-otp', orders_controller_js_1.verifyLookupOtp);
/**
 * GET /api/orders/:orderId
 * Get specific order by ID (requires auth, must be owner or admin)
 */
exports.ordersRouter.get('/:orderId', auth_middleware_js_1.authenticateToken, orders_controller_js_1.getOrderById);
// ─────────── Subscriptions (User) ───────────
/**
 * GET /api/subscriptions/me
 * Get my active subscriptions (requires auth)
 */
exports.subscriptionsRouter.get('/me', auth_middleware_js_1.authenticateToken, orders_controller_js_1.getMySubscriptions);
/**
 * PATCH /api/subscriptions/:id/auto-renew
 * Toggle auto-renew on own subscription (requires auth)
 */
exports.subscriptionsRouter.patch('/:id/auto-renew', auth_middleware_js_1.authenticateToken, orders_controller_js_1.updateSubscriptionAutoRenew);
// ─────────── Admin ───────────
/**
 * GET /api/admin/stats
 * Dashboard statistics (admin only)
 */
exports.adminRouter.get('/stats', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.getAdminStats);
/**
 * GET /api/admin/orders
 * All orders with filters (admin only)
 */
exports.adminRouter.get('/orders', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.getAllOrdersAdmin);
/**
 * PATCH /api/admin/orders/:orderId/status
 * Update order status (admin only)
 */
exports.adminRouter.patch('/orders/:orderId/status', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.updateOrderStatus);
/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
exports.adminRouter.get('/users', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.getAllUsersAdmin);
/**
 * PATCH /api/admin/users/:userId/role
 * Update user role (admin only)
 */
exports.adminRouter.patch('/users/:userId/role', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.updateUserRole);
/**
 * PATCH /api/admin/users/:userId/status
 * Lock (ban) or unlock a user account (admin only)
 */
exports.adminRouter.patch('/users/:userId/status', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.updateUserStatus);
/**
 * POST /api/admin/users/:userId/balance
 * Add balance to user wallet (admin only)
 */
exports.adminRouter.post('/users/:userId/balance', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, orders_controller_js_1.addUserBalance);
