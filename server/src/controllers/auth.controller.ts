import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/app-error.js';

// Format user record for API responses (snake_case to camelCase)
export const formatUserResponse = (row: any) => ({
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

/**
 * Seed default accounts with valid bcrypt hashes if they don't exist yet
 */
export const ensureSeedUsers = async () => {
  try {
    const adminPassHash = await bcrypt.hash(env.ADMIN_PASSWORD || 'admin123', 10);
    const memberPassHash = await bcrypt.hash(env.MEMBER_PASSWORD || '123456', 10);

    // Upsert Admin
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, avatar, balance_vnd, balance_usd, tier, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $2, role = 'admin'`,
      [
        env.ADMIN_EMAIL || 'admin@agentlab.dev',
        adminPassHash,
        'Root Operator',
        'admin',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        99999999,
        4000.0,
        'Enterprise',
        '0909000999',
      ]
    );

    // Upsert Member Alex Dev
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, avatar, balance_vnd, balance_usd, tier, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $2`,
      [
        'alex.dev@gmail.com',
        memberPassHash,
        'Alex Nguyen',
        'member',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        650000,
        25.5,
        'VIP Dev',
        '0987654321',
      ]
    );

    console.log('[Seed] Default admin@agentlab.dev & alex.dev@gmail.com initialized in PostgreSQL.');
  } catch (err) {
    console.error('[Seed Error] Failed to ensure seed users:', err);
  }
};

/**
 * POST /api/auth/register
 */
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, phone } = req.body;

  // Public registration always creates a member. Admin accounts are seeded
  // from ADMIN_EMAIL/ADMIN_PASSWORD in the server environment only.
  const assignedRole: 'member' | 'admin' = 'member';

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new BadRequestError('This email address is already registered. Please log in.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert into PostgreSQL
  const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, avatar, balance_vnd, balance_usd, tier, phone)
     VALUES ($1, $2, $3, $4, $5, 50000, 2.00, 'Standard', $6)
     RETURNING *`,
    [name.trim(), normalizedEmail, passwordHash, assignedRole, avatar, phone || null]
  );

  const newUser = result.rows[0];

  // Sign JWT token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  res.status(201).json({
    success: true,
    message: 'Account registered successfully! $2.00 has been added to your wallet balance.',
    token,
    user: formatUserResponse(newUser),
  });
});

/**
 * POST /api/auth/login
 */
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  // Query user
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  if (result.rows.length === 0) {
    throw new UnauthorizedError('Email or password is incorrect.');
  }

  const user = result.rows[0];

  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Email or password is incorrect.');
  }

  // Sign JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  res.status(200).json({
    success: true,
    message: 'Logged in successfully!',
    token,
    user: formatUserResponse(user),
  });
});

/**
 * GET /api/auth/me
 */
export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('Not authenticated.');
  }

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  res.status(200).json({
    success: true,
    user: formatUserResponse(result.rows[0]),
  });
});
