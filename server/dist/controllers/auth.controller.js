"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = exports.ensureSeedUsers = exports.formatUserResponse = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../config/db.js");
const env_js_1 = require("../config/env.js");
const catch_async_js_1 = require("../utils/catch-async.js");
const app_error_js_1 = require("../utils/app-error.js");
// Format user record for API responses (snake_case to camelCase)
const formatUserResponse = (row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    balanceVND: Number(row.balance_vnd),
    balanceUSD: Number(row.balance_usd),
    tier: row.tier,
    phone: row.phone,
    createdAt: row.created_at,
});
exports.formatUserResponse = formatUserResponse;
/**
 * Seed default accounts with valid bcrypt hashes if they don't exist yet
 */
const ensureSeedUsers = async () => {
    try {
        const adminPassHash = await bcryptjs_1.default.hash('admin123', 10);
        const memberPassHash = await bcryptjs_1.default.hash('123456', 10);
        // Upsert Admin
        await db_js_1.pool.query(`INSERT INTO users (email, password_hash, name, role, avatar, balance_vnd, balance_usd, tier, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $2, role = 'admin'`, [
            'admin@aipro.dev',
            adminPassHash,
            'Root Operator',
            'admin',
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            99999999,
            4000.0,
            'Enterprise',
            '0909000999',
        ]);
        // Upsert Member Alex Dev
        await db_js_1.pool.query(`INSERT INTO users (email, password_hash, name, role, avatar, balance_vnd, balance_usd, tier, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $2`, [
            'alex.dev@gmail.com',
            memberPassHash,
            'Alex Nguyễn',
            'member',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            650000,
            25.5,
            'VIP Dev',
            '0987654321',
        ]);
        console.log('[Seed] Default admin@aipro.dev & alex.dev@gmail.com initialized in PostgreSQL.');
    }
    catch (err) {
        console.error('[Seed Error] Failed to ensure seed users:', err);
    }
};
exports.ensureSeedUsers = ensureSeedUsers;
/**
 * POST /api/auth/register
 */
exports.register = (0, catch_async_js_1.catchAsync)(async (req, res, next) => {
    const { name, email, password, role, adminCode, phone } = req.body;
    // Role verification
    let assignedRole = 'member';
    if (role === 'admin') {
        if (adminCode !== env_js_1.env.ADMIN_ROOT_KEY) {
            throw new app_error_js_1.ForbiddenError('Mã ủy quyền Root Key Quản trị viên không chính xác.');
        }
        assignedRole = 'admin';
    }
    const normalizedEmail = email.trim().toLowerCase();
    // Check if email already exists
    const existing = await db_js_1.pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
        throw new app_error_js_1.BadRequestError('Địa chỉ Email này đã được đăng ký. Vui lòng đăng nhập.');
    }
    // Hash password
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash(password, salt);
    // Insert into PostgreSQL
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    const result = await db_js_1.pool.query(`INSERT INTO users (name, email, password_hash, role, avatar, balance_vnd, balance_usd, tier, phone)
     VALUES ($1, $2, $3, $4, $5, 50000, 2.00, 'Standard', $6)
     RETURNING *`, [name.trim(), normalizedEmail, passwordHash, assignedRole, avatar, phone || null]);
    const newUser = result.rows[0];
    // Sign JWT token
    const token = jsonwebtoken_1.default.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, env_js_1.env.JWT_SECRET, { expiresIn: env_js_1.env.JWT_EXPIRES_IN });
    res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công! Tặng bạn 50.000 ₫ vào số dư ví.',
        token,
        user: (0, exports.formatUserResponse)(newUser),
    });
});
/**
 * POST /api/auth/login
 */
exports.login = (0, catch_async_js_1.catchAsync)(async (req, res, next) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    // Query user
    const result = await db_js_1.pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
        throw new app_error_js_1.UnauthorizedError('Email hoặc mật khẩu không chính xác.');
    }
    const user = result.rows[0];
    // Check password
    const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isMatch) {
        throw new app_error_js_1.UnauthorizedError('Email hoặc mật khẩu không chính xác.');
    }
    // Sign JWT token
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_js_1.env.JWT_SECRET, { expiresIn: env_js_1.env.JWT_EXPIRES_IN });
    res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công!',
        token,
        user: (0, exports.formatUserResponse)(user),
    });
});
/**
 * GET /api/auth/me
 */
exports.getMe = (0, catch_async_js_1.catchAsync)(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_js_1.UnauthorizedError('Chưa xác thực.');
    }
    const result = await db_js_1.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new app_error_js_1.NotFoundError('Người dùng không tồn tại.');
    }
    res.status(200).json({
        success: true,
        user: (0, exports.formatUserResponse)(result.rows[0]),
    });
});
