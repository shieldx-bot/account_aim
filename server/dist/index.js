"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_js_1 = require("./config/swagger.js");
const env_js_1 = require("./config/env.js");
const auth_routes_js_1 = require("./routes/auth.routes.js");
const auth_controller_js_1 = require("./controllers/auth.controller.js");
const product_routes_js_1 = require("./routes/product.routes.js");
const status_routes_js_1 = require("./routes/status.routes.js");
const orders_routes_js_1 = require("./routes/orders.routes.js");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const product_controller_js_1 = require("./controllers/product.controller.js");
const db_js_1 = require("./config/db.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
const app = (0, express_1.default)();
const PORT = env_js_1.env.PORT;
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10kb' }));
// Rate Limiting
const apiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many requests, please try again later.' },
});
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many authentication attempts, please try again later.' },
});
// Swagger Documentation
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
// Health Check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'AIPro Backend API',
        timestamp: new Date().toISOString(),
        postgres: 'connected',
    });
});
// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, auth_routes_js_1.authRouter);
app.use('/api/products', product_routes_js_1.productRouter);
app.use('/api/status', status_routes_js_1.statusRouter);
app.use('/api/orders', orders_routes_js_1.ordersRouter);
app.use('/api/subscriptions', orders_routes_js_1.subscriptionsRouter);
app.use('/api/admin', orders_routes_js_1.adminRouter);
// Error handling middleware (must be last)
app.use(error_middleware_js_1.errorMiddleware);
/**
 * Run DB migrations to ensure all tables exist
 */
const runMigrations = async () => {
    try {
        const sqlPath = path_1.default.join(__dirname, 'db', 'init.sql');
        const sql = fs_1.default.readFileSync(sqlPath, 'utf-8');
        await db_js_1.pool.query(sql);
        console.log('[DB] Schema migrations applied successfully.');
    }
    catch (err) {
        console.error('[DB] Migration warning (tables may already exist):', err.message);
    }
};
// Start server
app.listen(PORT, async () => {
    console.log(`🚀 [AIPro Backend] Server running on http://localhost:${PORT}`);
    console.log(`📖 [AIPro Backend] Swagger docs at http://localhost:${PORT}/api/docs`);
    // Run DB schema migrations (creates orders, subscriptions tables if not exist)
    await runMigrations();
    // Seed demo accounts
    await (0, auth_controller_js_1.ensureSeedUsers)();
    // Seed initial AI products catalog
    await (0, product_controller_js_1.ensureSeedProducts)();
});
