import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getMySubscriptions,
  getAllOrdersAdmin,
  updateOrderStatus,
  getAllUsersAdmin,
  updateUserRole,
  updateUserStatus,
  addUserBalance,
  getAdminStats,
  getRevenueDaily,
  getTopProducts,
} from '../controllers/orders.controller.js';
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
 * POST /api/admin/users/:userId/balance
 * Add balance to user wallet (admin only)
 */
adminRouter.post('/users/:userId/balance', authenticateToken, requireAdmin, addUserBalance);

/**
 * PATCH /api/admin/users/:userId/status
 * Ban / unban user (admin only)
 */
adminRouter.patch('/users/:userId/status', authenticateToken, requireAdmin, updateUserStatus);

/**
 * GET /api/admin/revenue-daily
 * Revenue per day for dashboard chart (admin only)
 */
adminRouter.get('/revenue-daily', authenticateToken, requireAdmin, getRevenueDaily);

/**
 * GET /api/admin/top-products
 * Best sellers by revenue (admin only)
 */
adminRouter.get('/top-products', authenticateToken, requireAdmin, getTopProducts);
