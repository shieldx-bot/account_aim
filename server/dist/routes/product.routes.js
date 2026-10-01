import { Router } from 'express';
import { getAllProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, } from '../controllers/product.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
export const productRouter = Router();
// Public catalog routes
productRouter.get('/', getAllProducts);
productRouter.get('/:slug', getProductBySlug);
// Admin-only management routes
productRouter.post('/', authenticateToken, requireAdmin, createProduct);
productRouter.put('/:id', authenticateToken, requireAdmin, updateProduct);
productRouter.delete('/:id', authenticateToken, requireAdmin, deleteProduct);
