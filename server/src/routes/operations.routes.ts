import { Router } from 'express';
import {
  getInventory,
  addInventoryAccounts,
  deleteInventoryAccount,
  requestLookupOtp,
  verifyLookupOtp,
  createWarrantyExchange,
  getWarrantyTickets,
  updateWarrantyTicket,
} from '../controllers/operations.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

export const lookupRouter = Router();

// ─────────── Public order lookup (OTP-verified) ───────────

/**
 * POST /api/orders/lookup/request-otp
 * Generate & "send" a real OTP for guest order verification
 */
lookupRouter.post('/request-otp', requestLookupOtp);

/**
 * POST /api/orders/lookup/verify-otp
 * Validate OTP → returns order details + delivery credentials
 */
lookupRouter.post('/verify-otp', verifyLookupOtp);

/**
 * POST /api/orders/lookup/warranty-exchange
 * Exchange a delivered account for a fresh one from inventory (max 3/order)
 */
lookupRouter.post('/warranty-exchange', createWarrantyExchange);

export const adminOperationsRouter = Router();

// ─────────── Inventory (admin only) ───────────

adminOperationsRouter.get('/inventory', authenticateToken, requireAdmin, getInventory);
adminOperationsRouter.post('/inventory', authenticateToken, requireAdmin, addInventoryAccounts);
adminOperationsRouter.delete('/inventory/:accountId', authenticateToken, requireAdmin, deleteInventoryAccount);

// ─────────── Warranty tickets (admin only) ───────────

adminOperationsRouter.get('/warranty-tickets', authenticateToken, requireAdmin, getWarrantyTickets);
adminOperationsRouter.patch('/warranty-tickets/:ticketId', authenticateToken, requireAdmin, updateWarrantyTicket);
