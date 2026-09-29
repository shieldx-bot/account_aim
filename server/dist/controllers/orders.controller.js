"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = exports.addUserBalance = exports.updateUserRole = exports.getAllUsersAdmin = exports.updateOrderStatus = exports.getAllOrdersAdmin = exports.getMySubscriptions = exports.getOrderById = exports.getMyOrders = exports.createOrder = exports.formatSubscriptionRow = exports.formatOrderRow = void 0;
const db_js_1 = require("../config/db.js");
const catch_async_js_1 = require("../utils/catch-async.js");
const app_error_js_1 = require("../utils/app-error.js");
/**
 * Format an order row from DB (snake_case → camelCase)
 */
const formatOrderRow = (row) => ({
    orderId: row.id,
    userId: row.user_id,
    guestEmail: row.guest_email,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    planDurationMonths: Number(row.plan_duration_months),
    provisioningType: row.provisioning_type,
    targetEmail: row.target_email,
    quantity: Number(row.quantity),
    unitPriceVND: Number(row.unit_price_vnd),
    unitPriceUSD: Number(row.unit_price_usd),
    discountVND: Number(row.discount_vnd),
    discountUSD: Number(row.discount_usd),
    totalAmount: Number(row.total_vnd),
    totalVND: Number(row.total_vnd),
    totalUSD: Number(row.total_usd),
    currency: row.currency,
    paymentMethod: row.payment_method,
    paymentGatewayRef: row.payment_gateway_ref,
    status: row.status,
    couponCode: row.coupon_code,
    warrantyExpireDate: row.warranty_expire_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
exports.formatOrderRow = formatOrderRow;
/**
 * Format a subscription row from DB
 */
const formatSubscriptionRow = (row) => ({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    brand: row.brand,
    provisioningType: row.provisioning_type,
    accountEmail: row.account_email,
    accountPassword: row.account_password_encrypted, // Note: should be decrypted in real system
    accessToken: row.access_token,
    startDate: row.start_date,
    expiresAt: row.expires_at,
    daysRemaining: Number(row.days_remaining),
    status: row.status,
    autoRenew: Boolean(row.auto_renew),
    createdAt: row.created_at,
});
exports.formatSubscriptionRow = formatSubscriptionRow;
/**
 * Generate a unique order ID
 */
const generateOrderId = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `AIPRO-${num}`;
};
/**
 * POST /api/orders
 * Create a new order (authenticated users only)
 */
exports.createOrder = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_js_1.UnauthorizedError('Bạn cần đăng nhập để đặt hàng.');
    }
    const { productId, productName, productSlug, planDurationMonths, provisioningType, targetEmail, guestEmail, quantity, unitPriceVND, unitPriceUSD, discountVND, discountUSD, totalVND, totalUSD, currency, paymentMethod, paymentGatewayRef, couponCode, } = req.body;
    // Validate required fields
    if (!productId || !productName || !productSlug || !guestEmail) {
        throw new app_error_js_1.BadRequestError('Thiếu thông tin đơn hàng bắt buộc.');
    }
    if (!totalVND || totalVND <= 0) {
        throw new app_error_js_1.BadRequestError('Số tiền thanh toán không hợp lệ.');
    }
    // Verify product exists and is active
    const productCheck = await db_js_1.pool.query('SELECT id, name, current_price_vnd, current_price_usd FROM products WHERE id = $1 AND is_active = true', [productId]);
    if (productCheck.rows.length === 0) {
        throw new app_error_js_1.NotFoundError('Sản phẩm không tồn tại hoặc đã ngừng bán.');
    }
    // Ensure orderId is unique
    let orderId = generateOrderId();
    let attempts = 0;
    while (attempts < 5) {
        const existing = await db_js_1.pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
        if (existing.rows.length === 0)
            break;
        orderId = generateOrderId();
        attempts++;
    }
    // Calculate warranty expiry date
    const warrantyMonths = planDurationMonths <= 1 ? 1 : planDurationMonths;
    const warrantyDate = new Date();
    warrantyDate.setMonth(warrantyDate.getMonth() + warrantyMonths);
    // Insert order into DB
    const result = await db_js_1.pool.query(`INSERT INTO orders (
      id, user_id, guest_email, product_id, product_name, product_slug,
      plan_duration_months, provisioning_type, target_email, quantity,
      unit_price_vnd, unit_price_usd, discount_vnd, discount_usd,
      total_vnd, total_usd, currency, payment_method, payment_gateway_ref,
      status, coupon_code, warranty_expire_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`, [
        orderId,
        userId,
        guestEmail.trim().toLowerCase(),
        productId,
        productName,
        productSlug,
        Number(planDurationMonths) || 1,
        provisioningType || 'pre_created',
        targetEmail || null,
        Number(quantity) || 1,
        Number(unitPriceVND) || 0,
        Number(unitPriceUSD) || 0,
        Number(discountVND) || 0,
        Number(discountUSD) || 0,
        Number(totalVND),
        Number(totalUSD) || 0,
        currency || 'VND',
        paymentMethod || 'paypal',
        paymentGatewayRef || null,
        'paid', // PayPal confirms payment before we create order
        couponCode || null,
        warrantyDate.toISOString().split('T')[0],
    ]);
    const newOrder = result.rows[0];
    res.status(201).json({
        success: true,
        message: 'Đơn hàng đã được tạo thành công!',
        data: (0, exports.formatOrderRow)(newOrder),
    });
});
/**
 * GET /api/orders/me
 * Get orders for the authenticated user
 */
exports.getMyOrders = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_js_1.UnauthorizedError('Bạn cần đăng nhập.');
    }
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const result = await db_js_1.pool.query(`SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [userId, limit, offset]);
    res.status(200).json({
        success: true,
        data: result.rows.map(exports.formatOrderRow),
        count: result.rows.length,
    });
});
/**
 * GET /api/orders/:orderId
 * Get a specific order (must belong to the authenticated user or admin)
 */
exports.getOrderById = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { orderId } = req.params;
    if (!userId) {
        throw new app_error_js_1.UnauthorizedError('Bạn cần đăng nhập.');
    }
    const result = await db_js_1.pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (result.rows.length === 0) {
        throw new app_error_js_1.NotFoundError('Không tìm thấy đơn hàng.');
    }
    const order = result.rows[0];
    // Only the order owner or admin can view
    if (order.user_id !== userId && userRole !== 'admin') {
        throw new app_error_js_1.UnauthorizedError('Bạn không có quyền xem đơn hàng này.');
    }
    res.status(200).json({
        success: true,
        data: (0, exports.formatOrderRow)(order),
    });
});
/**
 * GET /api/subscriptions/me
 * Get active subscriptions for the authenticated user
 */
exports.getMySubscriptions = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_js_1.UnauthorizedError('Bạn cần đăng nhập.');
    }
    const result = await db_js_1.pool.query(`SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY expires_at ASC`, [userId]);
    res.status(200).json({
        success: true,
        data: result.rows.map(exports.formatSubscriptionRow),
        count: result.rows.length,
    });
});
/**
 * GET /api/admin/orders
 * Admin: Get all orders with filtering
 */
exports.getAllOrdersAdmin = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { status, limit: rawLimit, offset: rawOffset, search } = req.query;
    const limit = Math.min(Number(rawLimit) || 50, 200);
    const offset = Number(rawOffset) || 0;
    let query = `SELECT o.*, u.name as user_name, u.email as user_email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id`;
    const params = [];
    const conditions = [];
    if (status && status !== 'all') {
        params.push(status);
        conditions.push(`o.status = $${params.length}`);
    }
    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(o.id ILIKE $${params.length} OR o.guest_email ILIKE $${params.length} OR o.product_name ILIKE $${params.length})`);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await db_js_1.pool.query(query, params);
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM orders o';
    const countParams = [];
    const countConditions = [];
    if (status && status !== 'all') {
        countParams.push(status);
        countConditions.push(`o.status = $${countParams.length}`);
    }
    if (search) {
        countParams.push(`%${search}%`);
        countConditions.push(`(o.id ILIKE $${countParams.length} OR o.guest_email ILIKE $${countParams.length})`);
    }
    if (countConditions.length > 0) {
        countQuery += ' WHERE ' + countConditions.join(' AND ');
    }
    const countResult = await db_js_1.pool.query(countQuery, countParams);
    res.status(200).json({
        success: true,
        data: result.rows.map((row) => ({
            ...(0, exports.formatOrderRow)(row),
            userName: row.user_name,
            userEmail: row.user_email,
        })),
        total: Number(countResult.rows[0].count),
        count: result.rows.length,
    });
});
/**
 * PATCH /api/admin/orders/:orderId/status
 * Admin: Update order status (e.g., pending → dispatched)
 */
exports.updateOrderStatus = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'paid', 'dispatched', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
        throw new app_error_js_1.BadRequestError(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`);
    }
    const result = await db_js_1.pool.query(`UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`, [status, notes || null, orderId]);
    if (result.rows.length === 0) {
        throw new app_error_js_1.NotFoundError('Không tìm thấy đơn hàng.');
    }
    res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái đơn hàng ${orderId} thành "${status}".`,
        data: (0, exports.formatOrderRow)(result.rows[0]),
    });
});
/**
 * GET /api/admin/users
 * Admin: Get all users with stats
 */
exports.getAllUsersAdmin = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { search, role } = req.query;
    let query = `
    SELECT u.*,
      COUNT(o.id) as orders_count,
      COALESCE(SUM(o.total_vnd), 0) as total_spent_vnd
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
  `;
    const params = [];
    const conditions = [];
    if (role && role !== 'all') {
        params.push(role);
        conditions.push(`u.role = $${params.length}`);
    }
    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' GROUP BY u.id ORDER BY u.created_at DESC';
    const result = await db_js_1.pool.query(query, params);
    res.status(200).json({
        success: true,
        data: result.rows.map((row) => ({
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
            ordersCount: Number(row.orders_count),
            totalSpentVND: Number(row.total_spent_vnd),
            status: 'active', // TODO: add status column to users table
        })),
    });
});
/**
 * PATCH /api/admin/users/:userId/role
 * Admin: Update user role
 */
exports.updateUserRole = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['member', 'admin'].includes(role)) {
        throw new app_error_js_1.BadRequestError('Role không hợp lệ.');
    }
    const result = await db_js_1.pool.query(`UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [role, userId]);
    if (result.rows.length === 0) {
        throw new app_error_js_1.NotFoundError('Không tìm thấy người dùng.');
    }
    res.status(200).json({
        success: true,
        message: `Đã cập nhật role thành "${role}" cho ${result.rows[0].email}.`,
    });
});
/**
 * POST /api/admin/users/:userId/balance
 * Admin: Add balance to user wallet
 */
exports.addUserBalance = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const { amountVND } = req.body;
    if (!amountVND || Number(amountVND) <= 0) {
        throw new app_error_js_1.BadRequestError('Số tiền nạp không hợp lệ.');
    }
    const result = await db_js_1.pool.query(`UPDATE users SET 
      balance_vnd = balance_vnd + $1,
      balance_usd = balance_usd + $2,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING id, email, balance_vnd, balance_usd`, [Number(amountVND), Number(amountVND) / 25000, userId]);
    if (result.rows.length === 0) {
        throw new app_error_js_1.NotFoundError('Không tìm thấy người dùng.');
    }
    res.status(200).json({
        success: true,
        message: `Đã nạp ${Number(amountVND).toLocaleString('vi-VN')} ₫ vào ví người dùng.`,
        data: {
            balanceVND: Number(result.rows[0].balance_vnd),
            balanceUSD: Number(result.rows[0].balance_usd),
        },
    });
});
/**
 * GET /api/admin/stats
 * Admin: Get dashboard statistics
 */
exports.getAdminStats = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const [revenueToday, ordersToday, ordersTotal, ordersPending, usersTotal, activeSubscriptions,] = await Promise.all([
        db_js_1.pool.query(`SELECT COALESCE(SUM(total_vnd), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid','dispatched')`),
        db_js_1.pool.query(`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`),
        db_js_1.pool.query(`SELECT COUNT(*) as count FROM orders`),
        db_js_1.pool.query(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`),
        db_js_1.pool.query(`SELECT COUNT(*) as count FROM users`),
        db_js_1.pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status IN ('active','expiring_soon')`),
    ]);
    res.status(200).json({
        success: true,
        data: {
            revenueToday: Number(revenueToday.rows[0].total),
            ordersToday: Number(ordersToday.rows[0].count),
            ordersTotal: Number(ordersTotal.rows[0].count),
            ordersPending: Number(ordersPending.rows[0].count),
            usersTotal: Number(usersTotal.rows[0].count),
            activeSubscriptions: Number(activeSubscriptions.rows[0].count),
        },
    });
});
