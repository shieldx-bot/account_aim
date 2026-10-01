import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { ensureSeedUsers } from './controllers/auth.controller.js';
import { productRouter } from './routes/product.routes.js';
import { statusRouter } from './routes/status.routes.js';
import { ordersRouter, subscriptionsRouter, adminRouter } from './routes/orders.routes.js';
import { inventoryAdminRouter, warrantyAdminRouter, warrantyPublicRouter } from './routes/inventory-warranty.routes.js';
import { referralRouter } from './routes/referral.routes.js';
import { paymentRouter } from './controllers/payment.controller.js';
import { supportChatRouter } from './controllers/support-chat.controller.js';
import { couponRouter } from './controllers/coupon.controller.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { ensureSeedProducts } from './controllers/product.controller.js';
import { pool } from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = env.PORT;
// Behind a reverse proxy (Railway, nginx...): use X-Forwarded-For for correct client IPs
app.set('trust proxy', 1);
// Security Middleware
app.use(helmet());
app.use(cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many authentication attempts, please try again later.' },
});
// Swagger Documentation — dev convenience only, never expose the API surface in production
if (!env.isProd) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
// Health Check endpoint — actually verifies DB connectivity
app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({
            status: 'healthy',
            service: 'AgentLab Backend API',
            timestamp: new Date().toISOString(),
            postgres: 'connected',
        });
    }
    catch {
        res.status(503).json({
            status: 'unhealthy',
            service: 'AgentLab Backend API',
            timestamp: new Date().toISOString(),
            postgres: 'disconnected',
        });
    }
});
// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/products', productRouter);
app.use('/api/status', statusRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/warranty', warrantyPublicRouter);
app.use('/api/referral', referralRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/inventory', inventoryAdminRouter);
app.use('/api/admin/warranty', warrantyAdminRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/coupons', couponRouter);
app.use('/api/support', supportChatRouter);
// Error handling middleware (must be last)
app.use(errorMiddleware);
/**
 * Run DB migrations: init.sql first, then every numbered migration in db/migrations/.
 * In production a failed migration is fatal — booting without the schema would
 * corrupt order/payment state, so the process exits instead of limping on.
 */
const runMigrations = async () => {
    const dbDir = path.join(__dirname, 'db');
    const scripts = [path.join(dbDir, 'init.sql')];
    const migrationsDir = path.join(dbDir, 'migrations');
    if (fs.existsSync(migrationsDir)) {
        for (const f of fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
            scripts.push(path.join(migrationsDir, f));
        }
    }
    for (const scriptPath of scripts) {
        if (!fs.existsSync(scriptPath)) {
            if (env.isProd)
                throw new Error(`Missing required SQL script: ${scriptPath}`);
            console.warn(`[DB] Skipping missing script: ${scriptPath}`);
            continue;
        }
        const sql = fs.readFileSync(scriptPath, 'utf-8');
        await pool.query(sql);
    }
    console.log('[DB] Schema migrations applied successfully.');
};
// Start server
app.listen(PORT, async () => {
    console.log(`🚀 [AgentLab Backend] Server running on http://localhost:${PORT} (${env.NODE_ENV})`);
    if (!env.isProd) {
        console.log(`📖 [AgentLab Backend] Swagger docs at http://localhost:${PORT}/api/docs`);
    }
    // Run DB schema migrations (creates orders, subscriptions tables if not exist)
    try {
        await runMigrations();
    }
    catch (err) {
        console.error('[DB] Migration failed — aborting boot:', err.message);
        process.exit(1);
    }
    // Seed demo accounts only outside production — real signups own the DB in prod
    if (!env.isProd) {
        await ensureSeedUsers();
    }
    // Seed initial AI products catalog (idempotent upsert)
    await ensureSeedProducts();
});
