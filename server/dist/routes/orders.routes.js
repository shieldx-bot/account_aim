import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById, lookupOrderByEmailOrId, requestLookupOtp, verifyLookupOtp, getMySubscriptions, updateSubscriptionAutoRenew, getAllOrdersAdmin, updateOrderStatus, getAllUsersAdmin, updateUserRole, updateUserStatus, addUserBalance, getAdminStats, } from '../controllers/orders.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
export const ordersRouter = Router();
export const subscriptionsRouter = Router();
export const adminRouter = Router();
// ─────────── Orders (User) ───────────
/**
 * POST /api/orders
 * Create a new order (requires auth)
 */
ordersRouter.post('/', authenticateToken, createOrder);
/**
 * GET /api/orders/me
 * Get my orders (requires auth)
 */
ordersRouter.get('/me', authenticateToken, getMyOrders);
/**
 * GET /api/orders/lookup?email=&orderId=
 * Public lookup gate for the Warranty Self-Service page (no auth).
 */
ordersRouter.get('/lookup', lookupOrderByEmailOrId);
/**
 * POST /api/orders/lookup/otp
 * Issue a server-side OTP (bcrypt-hashed, 5-min expiry) for the warranty page.
 */
ordersRouter.post('/lookup/otp', requestLookupOtp);
/**
 * POST /api/orders/lookup/verify-otp
 * Validate OTP against PostgreSQL; unlocks full order + credentials on success.
 */
ordersRouter.post('/lookup/verify-otp', verifyLookupOtp);
/**
 * GET /api/orders/:orderId
 * Get specific order by ID (requires auth, must be owner or admin)
 */
ordersRouter.get('/:orderId', authenticateToken, getOrderById);
// ─────────── Subscriptions (User) ───────────
/**
 * GET /api/subscriptions/me
 * Get my active subscriptions (requires auth)
 */
subscriptionsRouter.get('/me', authenticateToken, getMySubscriptions);
/**
 * PATCH /api/subscriptions/:id/auto-renew
 * Toggle auto-renew on own subscription (requires auth)
 */
subscriptionsRouter.patch('/:id/auto-renew', authenticateToken, updateSubscriptionAutoRenew);
// ─────────── Admin ───────────
/**
 * GET /api/admin/stats
 * Dashboard statistics (admin only)
 */
adminRouter.get('/stats', authenticateToken, requireAdmin, getAdminStats);
/**
 * GET /api/admin/orders
 * All orders with filters (admin only)
 */
adminRouter.get('/orders', authenticateToken, requireAdmin, getAllOrdersAdmin);
/**
 * PATCH /api/admin/orders/:orderId/status
 * Update order status (admin only)
 */
adminRouter.patch('/orders/:orderId/status', authenticateToken, requireAdmin, updateOrderStatus);
/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
adminRouter.get('/users', authenticateToken, requireAdmin, getAllUsersAdmin);
/**
 * PATCH /api/admin/users/:userId/role
 * Update user role (admin only)
 */
adminRouter.patch('/users/:userId/role', authenticateToken, requireAdmin, updateUserRole);
/**
 * PATCH /api/admin/users/:userId/status
 * Lock (ban) or unlock a user account (admin only)
 */
adminRouter.patch('/users/:userId/status', authenticateToken, requireAdmin, updateUserStatus);
/**
 * POST /api/admin/users/:userId/balance
 * Add balance to user wallet (admin only)
 */
adminRouter.post('/users/:userId/balance', authenticateToken, requireAdmin, addUserBalance);
