"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = require("express");
const product_controller_js_1 = require("../controllers/product.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
exports.productRouter = (0, express_1.Router)();
// Public catalog routes
exports.productRouter.get('/', product_controller_js_1.getAllProducts);
exports.productRouter.get('/:slug', product_controller_js_1.getProductBySlug);
// Admin-only management routes
exports.productRouter.post('/', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, product_controller_js_1.createProduct);
exports.productRouter.put('/:id', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, product_controller_js_1.updateProduct);
exports.productRouter.delete('/:id', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, product_controller_js_1.deleteProduct);
