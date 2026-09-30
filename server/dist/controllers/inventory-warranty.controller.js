"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWarrantyTicket = exports.getWarrantyQuota = exports.createWarrantyTicket = exports.getWarrantyTickets = exports.deleteInventoryAccount = exports.moveInventoryPool = exports.bulkImportInventory = exports.getInventoryAccounts = exports.formatWarrantyRow = exports.formatInventoryRow = void 0;
const db_js_1 = require("../config/db.js");
const catch_async_js_1 = require("../utils/catch-async.js");
const app_error_js_1 = require("../utils/app-error.js");
/**
 * Format an inventory account row (snake_case → camelCase)
 */
const formatInventoryRow = (row) => ({
    id: row.id,
    tool: row.tool,
    productId: row.product_id,
    email: row.email,
    pass: row.password,
    pool: row.pool,
    status: row.status,
    assignedOrderId: row.assigned_order_id,
    addedAt: row.created_at,
});
exports.formatInventoryRow = formatInventoryRow;
/**
 * Format a warranty ticket row (snake_case → camelCase)
 */
const formatWarrantyRow = (row) => ({
    id: row.id,
    orderId: row.order_id,
    customerEmail: row.customer_email,
    tool: row.tool,
    reason: row.reason,
    attempts: Number(row.attempts),
    slaLeftMinutes: Number(row.sla_left_minutes),
    status: row.status,
    createdAt: row.created_at,
});
exports.formatWarrantyRow = formatWarrantyRow;
// ───────────────────────── INVENTORY ─────────────────────────
/**
 * GET /api/admin/inventory
 * List all accounts in the warehouse (pool filter optional)
 */
exports.getInventoryAccounts = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { pool: poolFilter, status } = req.query;
    const params = [];
    const conditions = [];
    if (poolFilter && poolFilter !== 'all') {
        params.push(poolFilter);
        conditions.push(`pool = $${params.length}`);
    }
    if (status && status !== 'all') {
        params.push(status);
        conditions.push(`status = $${params.length}`);
    }
    let query = 'SELECT * FROM inventory_accounts';
    if (conditions.length > 0)
        query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    const result = await db_js_1.pool.query(query, params);
    // Stock health summary per tool for dashboard gauges
    const summaryResult = await db_js_1.pool.query(`SELECT tool,
            COUNT(*) FILTER (WHERE pool = 'active' AND status = 'available') as active_available,
            COUNT(*) FILTER (WHERE pool = 'buffer' AND status = 'available') as buffer_available,
            COUNT(*) as total
     FROM inventory_accounts GROUP BY tool ORDER BY tool ASC`);
    res.status(200).json({
        success: true,
        data: result.rows.map(exports.formatInventoryRow),
        stockSummary: summaryResult.rows.map((r) => ({
            tool: r.tool,
            activeAvailable: Number(r.active_available),
            bufferAvailable: Number(r.buffer_available),
            total: Number(r.total),
        })),
        count: result.rows.length,
    });
});
/**
 * POST /api/admin/inventory/bulk
 * Bulk import accounts. Body: { items: [{ tool, email, pass }], pool: 'active'|'buffer' }
 */
exports.bulkImportInventory = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { items, pool: targetPool } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        throw new app_error_js_1.BadRequestError('Danh sách tài khoản nhập kho rỗng hoặc sai định dạng.');
    }
    const target = targetPool === 'buffer' ? 'buffer' : 'active';
    const client = await db_js_1.pool.connect();
    try {
        await client.query('BEGIN');
        const inserted = [];
        for (const item of items) {
            if (!item?.tool || !item?.email || !item?.pass)
                continue;
            // Resolve product id by name (optional FK)
            const prodRes = await client.query('SELECT id FROM products WHERE LOWER(name) = LOWER($1) LIMIT 1', [item.tool]);
            const id = `ACC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const result = await client.query(`INSERT INTO inventory_accounts (id, tool, product_id, email, password, pool, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'available')
         ON CONFLICT (email) DO UPDATE SET pool = EXCLUDED.pool, updated_at = CURRENT_TIMESTAMP
         RETURNING *`, [id, item.tool.trim(), prodRes.rows[0]?.id ?? null, String(item.email).trim().toLowerCase(), item.pass, target]);
            inserted.push((0, exports.formatInventoryRow)(result.rows[0]));
        }
        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: `Đã nhập ${inserted.length} tài khoản vào kho "${target}" trong PostgreSQL.`,
            data: inserted,
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
});
/**
 * PATCH /api/admin/inventory/:id/pool
 * Move an account between Kho bán (active) and Kho dự phòng (buffer)
 */
exports.moveInventoryPool = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const result = await db_js_1.pool.query(`UPDATE inventory_accounts
     SET pool = CASE WHEN pool = 'active' THEN 'buffer' ELSE 'active' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`, [id]);
    if (result.rows.length === 0)
        throw new app_error_js_1.NotFoundError('Không tìm thấy tài khoản trong kho.');
    res.status(200).json({
        success: true,
        message: `Đã chuyển tài khoản ${id} sang kho "${result.rows[0].pool}".`,
        data: (0, exports.formatInventoryRow)(result.rows[0]),
    });
});
/**
 * DELETE /api/admin/inventory/:id
 */
exports.deleteInventoryAccount = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const result = await db_js_1.pool.query('DELETE FROM inventory_accounts WHERE id = $1 RETURNING id, email', [id]);
    if (result.rows.length === 0)
        throw new app_error_js_1.NotFoundError('Không tìm thấy tài khoản để xóa.');
    res.status(200).json({
        success: true,
        message: `Đã xóa tài khoản ${result.rows[0].email} khỏi kho dữ liệu.`,
    });
});
// ───────────────────────── WARRANTY ─────────────────────────
/**
 * GET /api/admin/warranty
 * List dispute tickets
 */
exports.getWarrantyTickets = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { status } = req.query;
    let query = 'SELECT * FROM warranty_tickets';
    const params = [];
    if (status && status !== 'all') {
        params.push(status);
        query += ` WHERE status = $1`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await db_js_1.pool.query(query, params);
    res.status(200).json({
        success: true,
        data: result.rows.map(exports.formatWarrantyRow),
        count: result.rows.length,
    });
});
/**
 * POST /api/warranty (customer-facing, authenticated or guest)
 * Create a new warranty/dispute ticket
 */
const MAX_REPLACEMENTS_PER_DAY = 2;
exports.createWarrantyTicket = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { orderId, customerEmail, tool, reason } = req.body;
    if (!orderId || !customerEmail || !tool || !reason) {
        throw new app_error_js_1.BadRequestError('Vui lòng cung cấp đủ Mã đơn, Email, Công cụ và Mô tả sự cố.');
    }
    const email = String(customerEmail).trim().toLowerCase();
    const orderCheck = await db_js_1.pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (orderCheck.rows.length === 0)
        throw new app_error_js_1.NotFoundError('Không tìm thấy đơn hàng tương ứng.');
    // ── Server-enforced daily replacement quota (source of truth = DB, not localStorage) ──
    const todayCount = await db_js_1.pool.query(`SELECT COUNT(*)::int AS count
     FROM warranty_tickets
     WHERE customer_email = $1
       AND created_at >= DATE_TRUNC('day', NOW())`, [email]);
    const usedToday = todayCount.rows[0]?.count ?? 0;
    if (usedToday >= MAX_REPLACEMENTS_PER_DAY) {
        throw new app_error_js_1.BadRequestError(`Bạn đã sử dụng hết ${MAX_REPLACEMENTS_PER_DAY} lượt đổi tài khoản hôm nay. Vui lòng liên hệ hỗ trợ Telegram.`);
    }
    const id = `DISP-${Date.now()}`;
    const result = await db_js_1.pool.query(`INSERT INTO warranty_tickets (id, order_id, customer_email, tool, reason, attempts, sla_left_minutes, status)
     VALUES ($1, $2, $3, $4, $5, $6, 30, 'agent_pending') RETURNING *`, [id, orderId, email, tool, reason, usedToday + 1]);
    res.status(201).json({
        success: true,
        message: 'Đã ghi nhận khiếu nại bảo hành vào hệ thống. Bot SLA sẽ phản hồi trong 30 phút.',
        data: (0, exports.formatWarrantyRow)(result.rows[0]),
    });
});
/**
 * GET /api/warranty/quota?email=...
 * Customer-facing: daily replacement usage derived from warranty_tickets.
 * This is the source of truth for the LookupPage stepper (replaces localStorage).
 */
exports.getWarrantyQuota = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email)
        throw new app_error_js_1.BadRequestError('Thiếu email để tra cứu hạn mức bảo hành.');
    const result = await db_js_1.pool.query(`SELECT COUNT(*)::int AS used,
            COALESCE(MAX(attempts), 0)::int AS attempts
     FROM warranty_tickets
     WHERE customer_email = $1
       AND created_at >= DATE_TRUNC('day', NOW())`, [email]);
    const usedToday = result.rows[0]?.used ?? 0;
    res.status(200).json({
        success: true,
        data: {
            usedToday,
            maxPerDay: MAX_REPLACEMENTS_PER_DAY,
            remaining: Math.max(0, MAX_REPLACEMENTS_PER_DAY - usedToday),
        },
    });
});
/**
 * PATCH /api/admin/warranty/:id/resolve
 * Admin approves override: issue a new account from buffer pool & close ticket
 */
exports.resolveWarrantyTicket = (0, catch_async_js_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const client = await db_js_1.pool.connect();
    try {
        await client.query('BEGIN');
        const ticketRes = await client.query('SELECT * FROM warranty_tickets WHERE id = $1 FOR UPDATE', [id]);
        if (ticketRes.rows.length === 0)
            throw new app_error_js_1.NotFoundError('Không tìm thấy phiếu khiếu nại.');
        const ticket = ticketRes.rows[0];
        // Take one available account from buffer pool of the same tool
        const accRes = await client.query(`SELECT * FROM inventory_accounts
       WHERE tool = $1 AND pool = 'buffer' AND status = 'available'
       ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`, [ticket.tool]);
        let replacement = null;
        if (accRes.rows.length > 0) {
            const acc = accRes.rows[0];
            const upd = await client.query(`UPDATE inventory_accounts
         SET pool = 'active', status = 'assigned', assigned_order_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`, [ticket.order_id, acc.id]);
            replacement = (0, exports.formatInventoryRow)(upd.rows[0]);
        }
        await client.query(`UPDATE warranty_tickets SET status = 'resolved', sla_left_minutes = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({
            success: true,
            message: replacement
                ? `Đã duyệt đổi mới: cấp tài khoản ${replacement.email} từ Buffer Pool cho khiếu nại ${id}.`
                : `Đã đánh dấu khiếu nại ${id} là resolved (Buffer Pool đang trống cùng công cụ).`,
            data: {
                ticket: { id, status: 'resolved' },
                replacementAccount: replacement,
            },
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
});
