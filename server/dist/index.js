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
import { errorMiddleware } from './middleware/error.middleware.js';
import { ensureSeedProducts } from './controllers/product.controller.js';
import { pool } from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = env.PORT;
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
// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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
// Error handling middleware (must be last)
app.use(errorMiddleware);
/**
 * Run DB migrations to ensure all tables exist
 */
const runMigrations = async () => {
    try {
        const sqlPath = path.join(__dirname, 'db', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        await pool.query(sql);
        // Production tables: inventory_accounts & warranty_tickets (migration 002)
        const prodSqlPath = path.join(__dirname, 'db', 'migrations', '002_production_tables.sql');
        if (fs.existsSync(prodSqlPath)) {
            const prodSql = fs.readFileSync(prodSqlPath, 'utf-8');
            await pool.query(prodSql);
        }
        // Server-issued lookup OTPs (migration 003)
        const otpSqlPath = path.join(__dirname, 'db', 'migrations', '003_lookup_otp.sql');
        if (fs.existsSync(otpSqlPath)) {
            const otpSql = fs.readFileSync(otpSqlPath, 'utf-8');
            await pool.query(otpSql);
        }
        // Referral / #InviteToPay system (migration 004)
        const refSqlPath = path.join(__dirname, 'db', 'migrations', '004_referral_system.sql');
        if (fs.existsSync(refSqlPath)) {
            const refSql = fs.readFileSync(refSqlPath, 'utf-8');
            await pool.query(refSql);
        }
        console.log('[DB] Schema migrations applied successfully.');
    }
    catch (err) {
        console.error('[DB] Migration warning (tables may already exist):', err.message);
    }
};
// Start server
app.listen(PORT, async () => {
    console.log(`🚀 [AIPro Backend] Server running on http://localhost:${PORT} (${env.NODE_ENV})`);
    console.log(`📖 [AIPro Backend] Swagger docs at http://localhost:${PORT}/api/docs`);
    // Run DB schema migrations (creates orders, subscriptions tables if not exist)
    await runMigrations();
    // Seed demo accounts only outside production — real signups own the DB in prod
    if (env.NODE_ENV !== 'production') {
        await ensureSeedUsers();
    }
    // Seed initial AI products catalog (idempotent upsert)
    await ensureSeedProducts();
});
