"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const validate_middleware_js_1 = require("../middleware/validate.middleware.js");
const auth_schema_js_1 = require("../schemas/auth.schema.js");
exports.authRouter = (0, express_1.Router)();
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
exports.authRouter.post('/register', (0, validate_middleware_js_1.validate)(auth_schema_js_1.registerSchema), auth_controller_js_1.register);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login successful
 */
exports.authRouter.post('/login', (0, validate_middleware_js_1.validate)(auth_schema_js_1.loginSchema), auth_controller_js_1.login);
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
exports.authRouter.get('/me', auth_middleware_js_1.authenticateToken, auth_controller_js_1.getMe);
