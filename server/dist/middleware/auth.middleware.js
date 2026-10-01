import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
// zod-validated env — the process refuses to boot without JWT_SECRET, no fallback
const JWT_SECRET = env.JWT_SECRET;
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'You must be logged in to access this resource (Missing Bearer Token).',
        });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({
            success: false,
            message: 'Your session has expired or is invalid.',
        });
    }
};
/**
 * Like authenticateToken but never rejects: attaches req.user when a valid
 * Bearer token is present, otherwise continues anonymously. Used by endpoints
 * that support both guests and logged-in users (e.g. referral code issuing).
 */
export const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        }
        catch {
            // Invalid/expired token on an optional route → treat as anonymous
        }
    }
    next();
};
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin privileges required.',
        });
        return;
    }
    next();
};
