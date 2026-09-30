"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warrantyPublicRouter = exports.warrantyAdminRouter = exports.inventoryAdminRouter = void 0;
const express_1 = require("express");
const inventory_warranty_controller_js_1 = require("../controllers/inventory-warranty.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
exports.inventoryAdminRouter = (0, express_1.Router)();
exports.warrantyAdminRouter = (0, express_1.Router)();
exports.warrantyPublicRouter = (0, express_1.Router)();
// ─────────── Admin: Inventory (Kho tài khoản) ───────────
/**
 * GET /api/admin/inventory?pool=active|buffer&status=available
 * List all warehouse accounts + stock summary per tool (admin only)
 */
exports.inventoryAdminRouter.get('/', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, inventory_warranty_controller_js_1.getInventoryAccounts);
/**
 * POST /api/admin/inventory/bulk
 * Bulk import accounts. Body: { items: [{ tool, email, pass }], pool }
 */
exports.inventoryAdminRouter.post('/bulk', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, inventory_warranty_controller_js_1.bulkImportInventory);
/**
 * PATCH /api/admin/inventory/:id/pool
 * Toggle account between Kho bán (active) and Kho dự phòng (buffer)
 */
exports.inventoryAdminRouter.patch('/:id/pool', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, inventory_warranty_controller_js_1.moveInventoryPool);
/**
 * DELETE /api/admin/inventory/:id
 */
exports.inventoryAdminRouter.delete('/:id', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, inventory_warranty_controller_js_1.deleteInventoryAccount);
// ─────────── Admin: Warranty (Khiếu nại bảo hành SLA) ───────────
/**
 * GET /api/admin/warranty?status=agent_pending
 * List dispute tickets (admin only)
 */
exports.warrantyAdminRouter.get('/', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, inventory_warranty_controller_js_1.getWarrantyTickets);
/**
 * PATCH /api/admin/warranty/:id/resolve
 * Approve override: issue replacement account from buffer pool atomically
 */
exports.warrantyAdminRouter.patch('/:id/resolve', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, inventory_warranty_controller_js_1.resolveWarrantyTicket);
// ─────────── Public/Customer: Warranty ───────────
/**
 * POST /api/warranty
 * Customer files a warranty/dispute ticket against an order
 */
exports.warrantyPublicRouter.post('/', inventory_warranty_controller_js_1.createWarrantyTicket);
/**
 * GET /api/warranty/quota?email=...
 * Daily replacement usage (source of truth = warranty_tickets table)
 */
exports.warrantyPublicRouter.get('/quota', inventory_warranty_controller_js_1.getWarrantyQuota);
