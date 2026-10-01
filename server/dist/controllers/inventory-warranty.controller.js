import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, NotFoundError } from '../utils/app-error.js';
import { encryptSecret, decryptSecret } from '../services/crypto.service.js';
/**
 * Format an inventory account row (snake_case → camelCase)
 */
export const formatInventoryRow = (row) => ({
    id: row.id,
    tool: row.tool,
    productId: row.product_id,
    email: row.email,
    pass: decryptSecret(row.password),
    pool: row.pool,
    status: row.status,
    assignedOrderId: row.assigned_order_id,
    addedAt: row.created_at,
});
/**
 * Format a warranty ticket row (snake_case → camelCase)
 */
export const formatWarrantyRow = (row) => ({
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
// ───────────────────────── INVENTORY ─────────────────────────
/**
 * GET /api/admin/inventory
 * List all accounts in the warehouse (pool filter optional)
 */
export const getInventoryAccounts = catchAsync(async (req, res) => {
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
    const result = await pool.query(query, params);
    // Stock health summary per tool for dashboard gauges
    const summaryResult = await pool.query(`SELECT tool,
            COUNT(*) FILTER (WHERE pool = 'active' AND status = 'available') as active_available,
            COUNT(*) FILTER (WHERE pool = 'buffer' AND status = 'available') as buffer_available,
            COUNT(*) as total
     FROM inventory_accounts GROUP BY tool ORDER BY tool ASC`);
    res.status(200).json({
        success: true,
        data: result.rows.map(formatInventoryRow),
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
export const bulkImportInventory = catchAsync(async (req, res) => {
    const { items, pool: targetPool } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('The account import list is empty or malformed.');
    }
    const target = targetPool === 'buffer' ? 'buffer' : 'active';
    const client = await pool.connect();
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
         RETURNING *`, [id, item.tool.trim(), prodRes.rows[0]?.id ?? null, String(item.email).trim().toLowerCase(), encryptSecret(item.pass), target]);
            inserted.push(formatInventoryRow(result.rows[0]));
        }
        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: `Imported ${inserted.length} accounts into the "${target}" pool in PostgreSQL.`,
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
 * Move an account between the Sales pool (active) and Buffer pool (buffer)
 */
export const moveInventoryPool = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(`UPDATE inventory_accounts
     SET pool = CASE WHEN pool = 'active' THEN 'buffer' ELSE 'active' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`, [id]);
    if (result.rows.length === 0)
        throw new NotFoundError('Account not found in inventory.');
    res.status(200).json({
        success: true,
        message: `Moved account ${id} to the "${result.rows[0].pool}" pool.`,
        data: formatInventoryRow(result.rows[0]),
    });
});
/**
 * DELETE /api/admin/inventory/:id
 */
export const deleteInventoryAccount = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inventory_accounts WHERE id = $1 RETURNING id, email', [id]);
    if (result.rows.length === 0)
        throw new NotFoundError('Account not found for deletion.');
    res.status(200).json({
        success: true,
        message: `Deleted account ${result.rows[0].email} from the inventory.`,
    });
});
// ───────────────────────── WARRANTY ─────────────────────────
/**
 * GET /api/admin/warranty
 * List dispute tickets
 */
export const getWarrantyTickets = catchAsync(async (req, res) => {
    const { status } = req.query;
    let query = 'SELECT * FROM warranty_tickets';
    const params = [];
    if (status && status !== 'all') {
        params.push(status);
        query += ` WHERE status = $1`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.status(200).json({
        success: true,
        data: result.rows.map(formatWarrantyRow),
        count: result.rows.length,
    });
});
/**
 * POST /api/warranty (customer-facing, authenticated or guest)
 * Create a new warranty/dispute ticket
 */
const MAX_REPLACEMENTS_PER_DAY = 2;
export const createWarrantyTicket = catchAsync(async (req, res) => {
    const { orderId, customerEmail, tool, reason } = req.body;
    if (!orderId || !customerEmail || !tool || !reason) {
        throw new BadRequestError('Please provide Order ID, Email, Tool and Issue Description.');
    }
    const email = String(customerEmail).trim().toLowerCase();
    const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (orderCheck.rows.length === 0)
        throw new NotFoundError('Matching order not found.');
    // ── Server-enforced daily replacement quota (source of truth = DB, not localStorage) ──
    const todayCount = await pool.query(`SELECT COUNT(*)::int AS count
     FROM warranty_tickets
     WHERE customer_email = $1
       AND created_at >= DATE_TRUNC('day', NOW())`, [email]);
    const usedToday = todayCount.rows[0]?.count ?? 0;
    if (usedToday >= MAX_REPLACEMENTS_PER_DAY) {
        throw new BadRequestError(`You have used all ${MAX_REPLACEMENTS_PER_DAY} account replacements for today. Please contact Telegram support.`);
    }
    const id = `DISP-${Date.now()}`;
    const result = await pool.query(`INSERT INTO warranty_tickets (id, order_id, customer_email, tool, reason, attempts, sla_left_minutes, status)
     VALUES ($1, $2, $3, $4, $5, $6, 30, 'agent_pending') RETURNING *`, [id, orderId, email, tool, reason, usedToday + 1]);
    res.status(201).json({
        success: true,
        message: 'Warranty claim has been recorded in the system. The SLA bot will respond within 30 minutes.',
        data: formatWarrantyRow(result.rows[0]),
    });
});
/**
 * GET /api/warranty/quota?email=...
 * Customer-facing: daily replacement usage derived from warranty_tickets.
 * This is the source of truth for the LookupPage stepper (replaces localStorage).
 */
export const getWarrantyQuota = catchAsync(async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email)
        throw new BadRequestError('Email is required to look up warranty quota.');
    const result = await pool.query(`SELECT COUNT(*)::int AS used,
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
export const resolveWarrantyTicket = catchAsync(async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const ticketRes = await client.query('SELECT * FROM warranty_tickets WHERE id = $1 FOR UPDATE', [id]);
        if (ticketRes.rows.length === 0)
            throw new NotFoundError('Warranty ticket not found.');
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
            replacement = formatInventoryRow(upd.rows[0]);
        }
        await client.query(`UPDATE warranty_tickets SET status = 'resolved', sla_left_minutes = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({
            success: true,
            message: replacement
                ? `Replacement approved: issued account ${replacement.email} from the Buffer Pool for claim ${id}.`
                : `Claim ${id} marked as resolved (the Buffer Pool has no accounts for this tool).`,
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
