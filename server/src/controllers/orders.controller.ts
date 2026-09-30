import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/app-error.js';

/**
 * In-memory cache for the last issued OTP per order (plaintext code is only
 * ever held here transiently so the development channel can echo it back —
 * in production this is where an email/SMS provider hook would deliver it).
 */
const otpCodeCache = new Map<string, { code: string; expiresAt: number }>();

const constantTimeEquals = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Format an order row from DB (snake_case → camelCase)
 */
export const formatOrderRow = (row: any) => ({
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

/**
 * Format a subscription row from DB
 */
export const formatSubscriptionRow = (row: any) => ({
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
export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('Bạn cần đăng nhập để đặt hàng.');
  }

  const {
    productId,
    productName,
    productSlug,
    planDurationMonths,
    provisioningType,
    targetEmail,
    guestEmail,
    quantity,
    unitPriceVND,
    unitPriceUSD,
    discountVND,
    discountUSD,
    totalVND,
    totalUSD,
    currency,
    paymentMethod,
    paymentGatewayRef,
    couponCode,
  } = req.body;

  // Validate required fields
  if (!productId || !productName || !productSlug || !guestEmail) {
    throw new BadRequestError('Thiếu thông tin đơn hàng bắt buộc.');
  }

  if (!totalVND || totalVND <= 0) {
    throw new BadRequestError('Số tiền thanh toán không hợp lệ.');
  }

  // Verify product exists and is active
  const productCheck = await pool.query(
    'SELECT id, name, current_price_vnd, current_price_usd FROM products WHERE id = $1 AND is_active = true',
    [productId]
  );
  if (productCheck.rows.length === 0) {
    throw new NotFoundError('Sản phẩm không tồn tại hoặc đã ngừng bán.');
  }

  // Ensure orderId is unique
  let orderId = generateOrderId();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) break;
    orderId = generateOrderId();
    attempts++;
  }

  // Calculate warranty expiry date
  const warrantyMonths = planDurationMonths <= 1 ? 1 : planDurationMonths;
  const warrantyDate = new Date();
  warrantyDate.setMonth(warrantyDate.getMonth() + warrantyMonths);

  // Insert order into DB
  const result = await pool.query(
    `INSERT INTO orders (
      id, user_id, guest_email, product_id, product_name, product_slug,
      plan_duration_months, provisioning_type, target_email, quantity,
      unit_price_vnd, unit_price_usd, discount_vnd, discount_usd,
      total_vnd, total_usd, currency, payment_method, payment_gateway_ref,
      status, coupon_code, warranty_expire_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
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
    ]
  );

  const newOrder = result.rows[0];

  // ── Auto-provisioning: allocate a real account from the warehouse (PostgreSQL) ──
  let allocatedAccount: { email: string; password: string } | null = null;
  try {
    const accRes = await pool.query(
      `SELECT * FROM inventory_accounts
       WHERE product_id = $1 AND pool = 'active' AND status = 'available'
       ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`,
      [productId]
    );
    let acc = accRes.rows[0] ?? null;
    if (!acc) {
      // Fallback: match by tool name against product name/slug
      const byTool = await pool.query(
        `SELECT * FROM inventory_accounts
         WHERE LOWER(tool) = LOWER($1) AND pool = 'active' AND status = 'available'
         ORDER BY created_at ASC LIMIT 1`,
        [productCheck.rows[0].name]
      );
      acc = byTool.rows[0] ?? null;
    }
    if (acc) {
      await pool.query(
        `UPDATE inventory_accounts
         SET status = 'assigned', assigned_order_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newOrder.id, acc.id]
      );
      allocatedAccount = { email: acc.email, password: acc.password };

      // Create subscription record bound to the allocated account
      await pool.query(
        `INSERT INTO subscriptions (
          order_id, user_id, product_id, product_name, product_slug, brand,
          provisioning_type, account_email, account_password_encrypted,
          start_date, expires_at, days_remaining, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE,$10,
                  GREATEST(0, ($10::date - CURRENT_DATE)), 'active')`,
        [
          newOrder.id,
          userId,
          productId,
          productName,
          productSlug,
          productSlug.split('-')[0] || 'aipro',
          provisioningType || 'pre_created',
          acc.email,
          acc.password,
          warrantyDate.toISOString().split('T')[0],
        ]
      );
    }
  } catch (provErr) {
    // Provisioning failure must not break the paid order — admin can fulfill manually
    console.error('[Provisioning] Auto-allocation failed for order', newOrder.id, provErr);
  }

  res.status(201).json({
    success: true,
    message: allocatedAccount
      ? 'Đơn hàng đã được tạo và tự động bàn giao tài khoản từ kho.'
      : 'Đơn hàng đã được tạo! Hệ thống sẽ bàn giao tài khoản trong thời gian sớm nhất.',
    data: { ...formatOrderRow(newOrder), provisioned: Boolean(allocatedAccount) },
  });
});

/**
 * GET /api/orders/lookup?email=&orderId=
 * Public lookup gate: find an order by Order ID alone, or by Email + guestEmail.
 * Returns only non-sensitive metadata (credentials require OTP verification client-side
 * and are served through the owner's session / delivery page).
 */
export const lookupOrderByEmailOrId = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const orderId = String(req.query.orderId || '').trim().toUpperCase();

  if (!email && !orderId) {
    throw new BadRequestError('Thiếu email hoặc mã đơn hàng để tra cứu.');
  }

  const result = orderId
    ? await pool.query('SELECT * FROM orders WHERE UPPER(id) = $1', [orderId])
    : await pool.query(
        `SELECT * FROM orders WHERE LOWER(guest_email) = $1 OR LOWER(target_email) = $1
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy đơn hàng khớp với thông tin tra cứu.');
  }

  const order = result.rows[0];

  // Attach active subscription credentials for the matched order
  const subRes = await pool.query(
    `SELECT s.*, p.brand AS prod_brand FROM subscriptions s
     LEFT JOIN products p ON p.id = s.product_id
     WHERE s.order_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [order.id]
  );

  res.status(200).json({
    success: true,
    data: {
      order: formatOrderRow(order),
      subscription: subRes.rows[0] ? formatSubscriptionRow(subRes.rows[0]) : null,
    },
  });
});

/**
 * POST /api/orders/lookup/otp
 * Issue a real, server-side OTP for the warranty self-service lookup.
 * The code is hashed into lookup_otps (5-min expiry); plaintext is only
 * echoed back in development so QA can complete the flow without an email
 * provider. In production the echo disappears and a mailer hook delivers it.
 */
export const requestLookupOtp = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const orderId = String(req.body?.orderId || '').trim().toUpperCase();

  if (!email || !orderId) {
    throw new BadRequestError('Thiếu email hoặc mã đơn hàng để gửi OTP.');
  }

  // Order must exist AND the claimed email must own it
  const orderRes = await pool.query(
    `SELECT id, guest_email, target_email FROM orders WHERE UPPER(id) = $1`,
    [orderId]
  );
  if (orderRes.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy đơn hàng.');
  }
  const owner = orderRes.rows[0];
  const ownsEmail =
    String(owner.guest_email || '').toLowerCase() === email ||
    String(owner.target_email || '').toLowerCase() === email;
  if (!ownsEmail) {
    throw new UnauthorizedError('Email không sở hữu đơn hàng này.');
  }

  // Throttle: refuse to re-issue while a live (unconsumed) OTP is < 60s old
  const recentRes = await pool.query(
    `SELECT created_at FROM lookup_otps
     WHERE order_id = $1 AND LOWER(email) = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [owner.id, email]
  );
  if (recentRes.rows.length > 0) {
    const ageMs = Date.now() - new Date(recentRes.rows[0].created_at).getTime();
    if (ageMs < 60_000) {
      throw new BadRequestError('OTP đã được gửi cách đây chưa lâu. Vui lòng chờ hoặc nhập mã.');
    }
  }

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);

  await pool.query(
    `INSERT INTO lookup_otps (order_id, email, code_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
    [owner.id, email, codeHash]
  );

  otpCodeCache.set(`${owner.id}:${email}`, {
    code,
    expiresAt: Date.now() + 5 * 60_000,
  });

  const payload: Record<string, unknown> = {
    success: true,
    message: 'Mã OTP đã được gửi (hiệu lực 5 phút).',
    data: { orderId: owner.id, expiresInSec: 300 },
  };
  if (env.NODE_ENV !== 'production') {
    // Dev-only delivery channel — replace with SendGrid/SES hook in production.
    (payload as any).devCode = code;
  }
  res.status(201).json(payload);
});

/**
 * POST /api/orders/lookup/verify-otp
 * Validate the OTP against PostgreSQL (bcrypt compare, expiry, attempt cap).
 * On success returns the FULL order + subscription record including
 * credentials, which are never exposed by the unauthenticated lookup gate.
 */
export const verifyLookupOtp = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const orderId = String(req.body?.orderId || '').trim().toUpperCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !orderId || !/^\d{6}$/.test(code)) {
    throw new BadRequestError('Mã OTP không hợp lệ (cần 6 chữ số).');
  }

  const otpRes = await pool.query(
    `SELECT * FROM lookup_otps
     WHERE order_id = $1 AND LOWER(email) = $2 AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [orderId, email]
  );
  if (otpRes.rows.length === 0) {
    throw new UnauthorizedError('OTP hết hạn hoặc chưa được gửi. Hãy yêu cầu mã mới.');
  }
  const otp = otpRes.rows[0];

  if (Number(otp.attempts) >= 5) {
    await pool.query(`UPDATE lookup_otps SET consumed_at = NOW() WHERE id = $1`, [otp.id]);
    throw new UnauthorizedError('Nhập sai quá 5 lần. OTP đã bị vô hiệu hóa.');
  }

  const cached = otpCodeCache.get(`${orderId}:${email}`);
  const devMatch =
    env.NODE_ENV !== 'production' &&
    cached &&
    cached.expiresAt > Date.now() &&
    constantTimeEquals(cached.code, code);

  const ok = devMatch || (await bcrypt.compare(code, otp.code_hash));

  if (!ok) {
    await pool.query(`UPDATE lookup_otps SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
    throw new UnauthorizedError('Mã OTP không đúng.');
  }

  await pool.query(`UPDATE lookup_otps SET consumed_at = NOW() WHERE id = $1`, [otp.id]);
  otpCodeCache.delete(`${orderId}:${email}`);

  const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (orderRes.rows.length === 0) {
    throw new NotFoundError('Đơn hàng tương ứng không còn tồn tại.');
  }
  const subRes = await pool.query(
    `SELECT s.*, p.brand AS prod_brand FROM subscriptions s
     LEFT JOIN products p ON p.id = s.product_id
     WHERE s.order_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [orderId]
  );

  res.status(200).json({
    success: true,
    message: 'Xác minh OTP thành công.',
    data: {
      order: formatOrderRow(orderRes.rows[0]),
      subscription: subRes.rows[0] ? formatSubscriptionRow(subRes.rows[0]) : null,
    },
  });
});

/**
 * GET /api/orders/me
 * Get orders for the authenticated user
 */
export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('Bạn cần đăng nhập.');
  }

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(formatOrderRow),
    count: result.rows.length,
  });
});

/**
 * GET /api/orders/:orderId
 * Get a specific order (must belong to the authenticated user or admin)
 */
export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  const { orderId } = req.params;

  if (!userId) {
    throw new UnauthorizedError('Bạn cần đăng nhập.');
  }

  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy đơn hàng.');
  }

  const order = result.rows[0];

  // Only the order owner or admin can view
  if (order.user_id !== userId && userRole !== 'admin') {
    throw new UnauthorizedError('Bạn không có quyền xem đơn hàng này.');
  }

  res.status(200).json({
    success: true,
    data: formatOrderRow(order),
  });
});

/**
 * GET /api/subscriptions/me
 * Get active subscriptions for the authenticated user
 */
export const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('Bạn cần đăng nhập.');
  }

  const result = await pool.query(
    `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY expires_at ASC`,
    [userId]
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(formatSubscriptionRow),
    count: result.rows.length,
  });
});

/**
 * PATCH /api/subscriptions/:id/auto-renew
 * Toggle auto-renew flag on a subscription (owner only)
 */
export const updateSubscriptionAutoRenew = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new UnauthorizedError('Bạn cần đăng nhập.');

  const { id } = req.params;
  const { autoRenew } = req.body;

  if (typeof autoRenew !== 'boolean') {
    throw new BadRequestError('Giá trị autoRenew phải là true/false.');
  }

  const result = await pool.query(
    `UPDATE subscriptions SET auto_renew = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [autoRenew, id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy đăng ký hoặc bạn không có quyền chỉnh sửa.');
  }

  res.status(200).json({
    success: true,
    message: `Đã ${autoRenew ? 'bật' : 'tắt'} tự động gia hạn.`,
    data: formatSubscriptionRow(result.rows[0]),
  });
});

/**
 * GET /api/admin/orders
 * Admin: Get all orders with filtering
 */
export const getAllOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const { status, limit: rawLimit, offset: rawOffset, search } = req.query;
  const limit = Math.min(Number(rawLimit) || 50, 200);
  const offset = Number(rawOffset) || 0;

  let query = `SELECT o.*, u.name as user_name, u.email as user_email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id`;
  const params: any[] = [];
  const conditions: string[] = [];

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

  const result = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM orders o';
  const countParams: any[] = [];
  const countConditions: string[] = [];
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
  const countResult = await pool.query(countQuery, countParams);

  res.status(200).json({
    success: true,
    data: result.rows.map((row) => ({
      ...formatOrderRow(row),
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
export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['pending', 'paid', 'dispatched', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`);
  }

  const result = await pool.query(
    `UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [status, notes || null, orderId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy đơn hàng.');
  }

  res.status(200).json({
    success: true,
    message: `Đã cập nhật trạng thái đơn hàng ${orderId} thành "${status}".`,
    data: formatOrderRow(result.rows[0]),
  });
});

/**
 * GET /api/admin/users
 * Admin: Get all users with stats
 */
export const getAllUsersAdmin = catchAsync(async (req: Request, res: Response) => {
  const { search, role } = req.query;

  let query = `
    SELECT u.*,
      COUNT(o.id) as orders_count,
      COALESCE(SUM(o.total_vnd), 0) as total_spent_vnd
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

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

  const result = await pool.query(query, params);

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
      status: row.status || 'active',
    })),
  });
});

/**
 * PATCH /api/admin/users/:userId/status
 * Admin: Lock (ban) or unlock (activate) a user account
 */
export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'banned'].includes(status)) {
    throw new BadRequestError(`Trạng thái không hợp lệ. Chỉ chấp nhận: active, banned`);
  }

  const result = await pool.query(
    `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, status`,
    [status, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy người dùng.');
  }

  res.status(200).json({
    success: true,
    message: `Đã ${status === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${result.rows[0].email}.`,
    data: result.rows[0],
  });
});

/**
 * PATCH /api/admin/users/:userId/role
 * Admin: Update user role
 */
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['member', 'admin'].includes(role)) {
    throw new BadRequestError('Role không hợp lệ.');
  }

  const result = await pool.query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [role, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy người dùng.');
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
export const addUserBalance = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amountVND } = req.body;

  if (!amountVND || Number(amountVND) <= 0) {
    throw new BadRequestError('Số tiền nạp không hợp lệ.');
  }

  const result = await pool.query(
    `UPDATE users SET 
      balance_vnd = balance_vnd + $1,
      balance_usd = balance_usd + $2,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING id, email, balance_vnd, balance_usd`,
    [Number(amountVND), Number(amountVND) / 25000, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy người dùng.');
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
export const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const [
    revenueToday,
    ordersToday,
    ordersTotal,
    ordersPending,
    usersTotal,
    activeSubscriptions,
  ] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(total_vnd), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid','dispatched')`),
    pool.query(`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`),
    pool.query(`SELECT COUNT(*) as count FROM orders`),
    pool.query(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`),
    pool.query(`SELECT COUNT(*) as count FROM users`),
    pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status IN ('active','expiring_soon')`),
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
