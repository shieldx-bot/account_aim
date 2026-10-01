import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'member' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

// C2 fix: verify with the SAME required secret used to sign tokens in
// auth.controller.ts (env schema). The old hardcoded fallback silently
// desynced sign/verify when dotenv failed to load — and let anyone with
// source access forge admin tokens.
const JWT_SECRET = env.JWT_SECRET;

/**
 * H2 fix: a JWT stays valid until expiry even after an admin bans the user.
 * Re-check `users.status` on authenticated requests so banned accounts lose
 * access immediately (login is additionally blocked in auth.controller).
 */
const assertNotBanned = async (userId: string): Promise<boolean> => {
  try {
    const res = await pool.query('SELECT status FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) return false; // user deleted → token no longer valid
    return String(res.rows[0].status ?? 'active') !== 'banned';
  } catch {
    // Fail closed only on DB outage would break every request during blips;
    // prefer fail-open for transient errors but log loudly.
    console.error('[Auth] Failed to check user status for', userId);
    return true;
  }
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập để truy cập tài nguyên này (Missing Bearer Token).',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    // H2 fix: banned/deleted users must not keep access with a live JWT.
    if (!(await assertNotBanned(decoded.id))) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
    });
  }
};

/**
 * Like authenticateToken but never rejects: attaches req.user when a valid
 * Bearer token is present, otherwise continues anonymously. Used by endpoints
 * that support both guests and logged-in users (e.g. referral code issuing).
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      if (await assertNotBanned(decoded.id)) {
        req.user = decoded;
      }
    } catch {
      // Invalid/expired token on an optional route → treat as anonymous
    }
  }
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền hạn Quản trị viên (Admin privileges required).',
    });
    return;
  }
  next();
};
