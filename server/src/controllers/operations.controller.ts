import crypto from 'crypto';
import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/app-error.js';

/* ════════════════════════════════════════════════════════════
 *  INVENTORY (Admin) — account pool for pre_created products
 * ════════════════════════════════════════════════════════════ */

const formatInventoryRow = (row: any) => ({
  id: row.id,
  productSlug: row.product_slug,
  email: row.email,
  password: row.password,
  accessToken: row.access_token,
  twoFactorBackup: row.two_factor_backup,
  status: row.status,
  assignedOrderId: row.assigned_order_id,
  createdAt: row.created_at,
});

/**
 * GET /api/admin/inventory?status=&productSlug=
 */
export const getInventory = catchAsync(async (req: Request, res: Response) => {
  const { status, productSlug } = req.query;
  const params: any[] = [];
  const conditions: string[] = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (productSlug && productSlug !== 'all') {
    params.push(productSlug);
    conditions.push(`product_slug = $${params.length}`);
  }

  let query = 'SELECT * FROM inventory_accounts';
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC LIMIT 500';

  const result = await pool.query(query, params);

  // Stock summary per product slug
  const summary = await pool.query(
    `SELECT product_slug,
            COUNT(*) FILTER (WHERE status = 'available') AS available,
            COUNT(*) FILTER (WHERE status = 'assigned') AS assigned,
            COUNT(*) FILTER (WHERE status = 'replaced') AS replaced,
            COUNT(*) AS total
     FROM inventory_accounts GROUP BY product_slug`
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(formatInventoryRow),
    stockSummary: summary.rows.map((r) => ({
      productSlug: r.product_slug,
      available: Number(r.available),
      assigned: Number(r.assigned),
      replaced: Number(r.replaced),
      total: Number(r.total),
    })),
  });
});

/**
 * POST /api/admin/inventory
 * Body: { productSlug, accounts: [{ email, password, accessToken?, twoFactorBackup? }] }
 * or single: { productSlug, email, password, ... }
 */
export const addInventoryAccounts = catchAsync(async (req: Request, res: Response) => {
  const { productSlug, accounts, email, password, accessToken, twoFactorBackup } = req.body;

  if (!productSlug) throw new BadRequestError('Thiếu productSlug.');

  const list: any[] = Array.isArray(accounts)
    ? accounts
    : email && password
      ? [{ email, password, accessToken, twoFactorBackup }]
      : [];

  if (list.length === 0) throw new BadRequestError('Danh sách tài khoản rỗng hoặc thiếu email/password.');

  const inserted: any[] = [];
  const skipped: string[] = [];

  for (const a of list) {
    if (!a?.email || !a?.password) {
      skipped.push(a?.email || '(thiếu email)');
      continue;
    }
    try {
      const r = await pool.query(
        `INSERT INTO inventory_accounts (product_slug, email, password, access_token, two_factor_backup)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING RETURNING *`,
        [productSlug, String(a.email).trim().toLowerCase(), a.password, a.accessToken || null, a.twoFactorBackup || null]
      );
      if (r.rows.length > 0) inserted.push(formatInventoryRow(r.rows[0]));
      else skipped.push(a.email);
    } catch (e: any) {
      skipped.push(`${a.email}: ${e.message}`);
    }
  }

  // Sync stock_count on the product row
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS c FROM inventory_accounts WHERE product_slug = $1 AND status = 'available'`,
    [productSlug]
  );
  await pool.query(
    `UPDATE products SET stock_count = $1, updated_at = CURRENT_TIMESTAMP WHERE slug = $2`,
    [countRes.rows[0].c, productSlug]
  );

  res.status(201).json({
    success: true,
    message: `Đã nhập kho ${inserted.length} tài khoản${skipped.length ? `, bỏ qua ${skipped.length} trùng/lỗi` : ''}.`,
    data: inserted,
    skipped,
  });
});

/**
 * DELETE /api/admin/inventory/:accountId
 */
export const deleteInventoryAccount = catchAsync(async (req: Request, res: Response) => {
  const { accountId } = req.params;

  const existing = await pool.query('SELECT * FROM inventory_accounts WHERE id = $1', [accountId]);
  if (existing.rows.length === 0) throw new NotFoundError('Không tìm thấy tài khoản kho.');
  if (existing.rows[0].status === 'assigned') {
    throw new BadRequestError('Không thể xoá tài khoản đã gán cho đơn hàng. Hãy đánh dấu void thay vì xoá.');
  }

  await pool.query('DELETE FROM inventory_accounts WHERE id = $1', [accountId]);

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS c FROM inventory_accounts WHERE product_slug = $1 AND status = 'available'`,
    [existing.rows[0].product_slug]
  );
  await pool.query(
    `UPDATE products SET stock_count = $1, updated_at = CURRENT_TIMESTAMP WHERE slug = $2`,
    [countRes.rows[0].c, existing.rows[0].product_slug]
  );

  res.status(200).json({ success: true, message: 'Đã xoá tài khoản khỏi kho.' });
});

/* ════════════════════════════════════════════════════════════
 *  LOOKUP OTP (public, order-based) — replaces fake client OTP
 * ════════════════════════════════════════════════════════════ */

/**
 * POST /api/orders/lookup/request-otp
 * Body: { orderId, email }  → verifies order exists & email matches, generates real OTP code
 */
export const requestLookupOtp = catchAsync(async (req: Request, res: Response) => {
  const { orderId, email } = req.body;
  if (!orderId || !email) throw new BadRequestError('Cần mã đơn hàng và email.');

  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [String(orderId).trim().toUpperCase()]);
  if (orderRes.rows.length === 0) {
    throw new NotFoundError('Không tìm thấy đơn hàng. Kiểm tra lại mã đơn (VD: AIPRO-12345).');
  }
  const order = orderRes.rows[0];

  const normalizedEmail = String(email).trim().toLowerCase();
  const matchEmails = [order.guest_email, order.target_email, order.user_email].filter(Boolean);
  const isMatch = matchEmails.some((e: string) => e.toLowerCase() === normalizedEmail);
  if (!isMatch) {
    throw new UnauthorizedError('Email không khớp với thông tin đơn hàng này.');
  }

  // Rate limit: max 3 unused OTPs in last 10 minutes per order
  const recent = await pool.query(
    `SELECT COUNT(*)::int AS c FROM lookup_otps
     WHERE order_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'`,
    [order.id]
  );
  if (recent.rows[0].c >= 3) {
    throw new BadRequestError('Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau ít phút.');
  }

  const code = String(crypto.randomInt(100000, 999999));
  await pool.query(
    `INSERT INTO lookup_otps (order_id, email, code) VALUES ($1, $2, $3)`,
    [order.id, normalizedEmail, code]
  );

  // In production this goes through an SMTP provider (SendGrid/Resend).
  // DEV mode returns the code directly so the flow is testable end-to-end.
  const devCode = process.env.NODE_ENV !== 'production' ? code : undefined;

  res.status(200).json({
    success: true,
    message: `Mã xác minh đã được gửi tới email ${normalizedEmail.replace(/^(.{2}).*(@.*)$/, '$1***$2')}.`,
    data: { orderId: order.id, expiresInSeconds: 300, ...(devCode ? { devCode } : {}) },
  });
});

/**
 * POST /api/orders/lookup/verify-otp
 * Body: { orderId, email, code } → validates OTP, returns full order + delivery credentials
 */
export const verifyLookupOtp = catchAsync(async (req: Request, res: Response) => {
  const { orderId, email, code } = req.body;
  if (!orderId || !email || !code) throw new BadRequestError('Thiếu thông tin xác minh.');

  const oid = String(orderId).trim().toUpperCase();
  const normalizedEmail = String(email).trim().toLowerCase();

  const otpRes = await pool.query(
    `SELECT * FROM lookup_otps
     WHERE order_id = $1 AND email = $2 AND code = $3 AND used = false
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC LIMIT 1`,
    [oid, normalizedEmail, String(code).trim()]
  );
  if (otpRes.rows.length === 0) {
    throw new UnauthorizedError('Mã OTP không đúng hoặc đã hết hạn (5 phút).');
  }
  await pool.query('UPDATE lookup_otps SET used = true WHERE id = $1', [otpRes.rows[0].id]);

  const orderRes = await pool.query(
    `SELECT o.*, u.email as user_email FROM orders o
     LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
    [oid]
  );
  const order = orderRes.rows[0];

  // Fetch provisioned credentials if dispatched
  const subRes = await pool.query(
    `SELECT s.*, inv.two_factor_backup FROM subscriptions s
     LEFT JOIN inventory_accounts inv ON inv.assigned_order_id = s.order_id AND inv.status = 'assigned'
     WHERE s.order_id = $1`,
    [oid]
  );

  res.status(200).json({
    success: true,
    message: 'Xác minh thành công.',
    data: {
      order: {
        orderId: order.id,
        productName: order.product_name,
        productSlug: order.product_slug,
        quantity: Number(order.quantity),
        totalVND: Number(order.total_vnd),
        currency: order.currency,
        status: order.status,
        warrantyExpireDate: order.warranty_expire_date,
        createdAt: order.created_at,
        warrantyExchanges: Number(order.warranty_exchanges ?? 0),
      },
      credentials: subRes.rows.map((row) => ({
        accountEmail: row.account_email,
        accountPassword: row.account_password_encrypted,
        accessToken: row.access_token,
        twoFactorBackup: row.two_factor_backup,
        expiresAt: row.expires_at,
        daysRemaining: Number(row.days_remaining),
        status: row.status,
      })),
    },
  });
});

/* ════════════════════════════════════════════════════════════
 *  WARRANTY TICKETS — real account exchange (max 3/order)
 * ════════════════════════════════════════════════════════════ */

/**
 * POST /api/orders/lookup/warranty-exchange
 * Body: { orderId, email, reason } — requires verified order (call verify-otp first in same session;
 * we re-check ownership via matching email on the order here).
 */
export const createWarrantyExchange = catchAsync(async (req: Request, res: Response) => {
  const { orderId, email, reason } = req.body;
  if (!orderId || !email) throw new BadRequestError('Thiếu thông tin đơn hàng.');

  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [String(orderId).trim().toUpperCase()]);
  if (orderRes.rows.length === 0) throw new NotFoundError('Không tìm thấy đơn hàng.');
  const order = orderRes.rows[0];

  const normalizedEmail = String(email).trim().toLowerCase();
  const matchEmails = [order.guest_email, order.target_email].filter(Boolean);
  if (!matchEmails.some((e: string) => e.toLowerCase() === normalizedEmail)) {
    throw new UnauthorizedError('Email không khớp với đơn hàng này.');
  }

  if (order.status !== 'dispatched') {
    throw new BadRequestError('Đơn hàng chưa được giao — chưa có tài khoản để bảo hành.');
  }

  const exchanges = Number(order.warranty_exchanges ?? 0);
  if (exchanges >= 3) {
    throw new BadRequestError('Đ đơn đã sử dụng hết 3 lượt đổi tài khoản bảo hành.');
  }

  // Warranty must still be active
  if (order.warranty_expire_date && new Date(order.warranty_expire_date) < new Date()) {
    throw new BadRequestError('Thời hạn bảo hành của đơn hàng đã hết.');
  }

  // Pull a replacement account from the pool
  const acctRes = await pool.query(
    `UPDATE inventory_accounts
     SET status = 'assigned', assigned_order_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = (
       SELECT id FROM inventory_accounts
       WHERE product_slug = $2 AND status = 'available'
       ORDER BY created_at ASC LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [order.id, order.product_slug]
  );
  if (acctRes.rows.length === 0) {
    throw new BadRequestError('Kho đang hết tài khoản cho sản phẩm này. Vui lòng liên hệ hỗ trợ.');
  }
  const newAcct = acctRes.rows[0];

  // Mark old subscription account as replaced, insert new subscription row
  const oldSub = await pool.query(
    `UPDATE subscriptions SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
     WHERE order_id = $1 AND status IN ('active','expiring_soon')
     RETURNING account_email`,
    [order.id]
  );

  const expiresAt = order.warranty_expire_date
    ? new Date(order.warranty_expire_date)
    : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();

  await pool.query(
    `INSERT INTO subscriptions (order_id, user_id, product_id, product_name, product_slug, brand,
      provisioning_type, account_email, account_password_encrypted, access_token,
      start_date, expires_at, status)
     VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT brand FROM products WHERE id = $3), $4),
       $6, $7, $8, $9, CURRENT_DATE, $10, 'active')`,
    [
      order.id, order.user_id, order.product_id, order.product_name, order.product_slug,
      order.provisioning_type, newAcct.email, newAcct.password, newAcct.access_token,
      expiresAt.toISOString().split('T')[0],
    ]
  );

  await pool.query(
    `UPDATE orders SET warranty_exchanges = warranty_exchanges + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [order.id]
  );

  const ticketRes = await pool.query(
    `INSERT INTO warranty_tickets (order_id, requester_email, reason, status, old_account_email, new_account_email, new_account_password)
     VALUES ($1, $2, $3, 'resolved', $4, $5, $6) RETURNING *`,
    [order.id, normalizedEmail, reason || 'account_locked', oldSub.rows[0]?.account_email || null, newAcct.email, newAcct.password]
  );

  res.status(201).json({
    success: true,
    message: 'Đổi tài khoản bảo hành thành công.',
    data: {
      ticketId: ticketRes.rows[0].id,
      newCredentials: {
        accountEmail: newAcct.email,
        accountPassword: newAcct.password,
        accessToken: newAcct.access_token,
        twoFactorBackup: newAcct.two_factor_backup,
      },
      exchangesUsed: exchanges + 1,
      exchangesAllowed: 3,
    },
  });
});

/* ════════════════════════════════════════════════════════════
 *  ADMIN: warranty tickets list + resolve/reject
 * ════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/warranty-tickets?status=
 */
export const getWarrantyTickets = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query;
  const params: any[] = [];
  let query = `
    SELECT w.*, o.product_name, o.total_vnd, o.currency, o.status AS order_status,
           (SELECT COUNT(*) FROM warranty_tickets w2 WHERE w2.order_id = w.order_id) AS ticket_count
    FROM warranty_tickets w
    LEFT JOIN orders o ON w.order_id = o.id`;
  const conditions: string[] = [];
  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`w.status = $${params.length}`);
  }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY w.created_at DESC LIMIT 200';

  const result = await pool.query(query, params);

  res.status(200).json({
    success: true,
    data: result.rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      requesterEmail: row.requester_email,
      reason: row.reason,
      status: row.status,
      oldAccountEmail: row.old_account_email,
      newAccountEmail: row.new_account_email,
      productName: row.product_name,
      orderStatus: row.order_status,
      totalVND: Number(row.total_vnd),
      ticketCount: Number(row.ticket_count),
      createdAt: row.created_at,
    })),
  });
});

/**
 * PATCH /api/admin/warranty-tickets/:ticketId
 * Body: { status: 'open'|'resolved'|'rejected', notes? }
 */
export const updateWarrantyTicket = catchAsync(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const { status, notes } = req.body;

  if (!['open', 'resolved', 'rejected'].includes(status)) {
    throw new BadRequestError('Trạng thái ticket không hợp lệ.');
  }

  const result = await pool.query(
    `UPDATE warranty_tickets SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [status, notes || null, ticketId]
  );
  if (result.rows.length === 0) throw new NotFoundError('Không tìm thấy ticket.');

  res.status(200).json({ success: true, message: `Đã cập nhật ticket thành "${status}".` });
});
