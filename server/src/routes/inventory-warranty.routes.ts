import { Router } from 'express';
import {
  getInventoryAccounts,
  bulkImportInventory,
  moveInventoryPool,
  deleteInventoryAccount,
  getWarrantyTickets,
  createWarrantyTicket,
  resolveWarrantyTicket,
  getWarrantyQuota,
} from '../controllers/inventory-warranty.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

export const inventoryAdminRouter = Router();
export const warrantyAdminRouter = Router();
export const warrantyPublicRouter = Router();

// ─────────── Admin: Inventory (Account Warehouse) ───────────

/**
 * GET /api/admin/inventory?pool=active|buffer&status=available
 * List all warehouse accounts + stock summary per tool (admin only)
 */
inventoryAdminRouter.get('/', authenticateToken, requireAdmin, getInventoryAccounts);

/**
 * POST /api/admin/inventory/bulk
 * Bulk import accounts. Body: { items: [{ tool, email, pass }], pool }
 */
inventoryAdminRouter.post('/bulk', authenticateToken, requireAdmin, bulkImportInventory);

/**
 * PATCH /api/admin/inventory/:id/pool
 * Toggle account between the Sales pool (active) and Buffer pool (buffer)
 */
inventoryAdminRouter.patch('/:id/pool', authenticateToken, requireAdmin, moveInventoryPool);

/**
 * DELETE /api/admin/inventory/:id
 */
inventoryAdminRouter.delete('/:id', authenticateToken, requireAdmin, deleteInventoryAccount);

// ─────────── Admin: Warranty (SLA Warranty Claims) ───────────

/**
 * GET /api/admin/warranty?status=agent_pending
 * List dispute tickets (admin only)
 */
warrantyAdminRouter.get('/', authenticateToken, requireAdmin, getWarrantyTickets);

/**
 * PATCH /api/admin/warranty/:id/resolve
 * Approve override: issue replacement account from buffer pool atomically
 */
warrantyAdminRouter.patch('/:id/resolve', authenticateToken, requireAdmin, resolveWarrantyTicket);

// ─────────── Public/Customer: Warranty ───────────

/**
 * POST /api/warranty
 * Customer files a warranty/dispute ticket against an order
 */
warrantyPublicRouter.post('/', createWarrantyTicket);

/**
 * GET /api/warranty/quota?email=...
 * Daily replacement usage (source of truth = warranty_tickets table)
 */
warrantyPublicRouter.get('/quota', getWarrantyQuota);
