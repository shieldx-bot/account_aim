import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'aipro_super_secret_jwt_encryption_key_2025_prod';
export const authenticateToken = (req, res, next) => {
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
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
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
            message: 'Bạn không có quyền hạn Quản trị viên (Admin privileges required).',
        });
        return;
    }
    next();
};
