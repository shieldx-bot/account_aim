import { Router } from 'express';
import { getStatusPage, getComponentMetrics, getIncidents, getMaintenance } from '../controllers/status.controller.js';
export const statusRouter = Router();
/**
 * @openapi
 * /api/status:
 *   get:
 *     summary: Get complete status page data
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Status page data
 */
statusRouter.get('/', getStatusPage);
/**
 * @openapi
 * /api/status/components:
 *   get:
 *     summary: Get all status components
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: List of components with current status
 */
statusRouter.get('/components', async (req, res, next) => {
    try {
        const { pool } = await import('../config/db.js');
        const result = await pool.query(`
      SELECT id, name, category, status, uptime_percent, description, metadata, updated_at
      FROM status_components
      ORDER BY category, name
    `);
        res.json({ success: true, data: result.rows });
    }
    catch (err) {
        next(err);
    }
});
/**
 * @openapi
 * /api/status/components/{id}/metrics:
 *   get:
 *     summary: Get metrics for a component
 *     tags: [Status]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: hours
 *         in: query
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: Component metrics
 */
statusRouter.get('/components/:id/metrics', getComponentMetrics);
/**
 * @openapi
 * /api/status/incidents:
 *   get:
 *     summary: Get incidents
 *     tags: [Status]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of incidents
 */
statusRouter.get('/incidents', getIncidents);
/**
 * @openapi
 * /api/status/maintenance:
 *   get:
 *     summary: Get scheduled maintenance
 *     tags: [Status]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of maintenance windows
 */
statusRouter.get('/maintenance', getMaintenance);
/**
 * @openapi
 * /api/status/subscribe:
 *   get:
 *     summary: Server-Sent Events for real-time status updates
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: SSE stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
statusRouter.get('/subscribe', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    // Send initial connection event
    sendEvent({ type: 'connected', timestamp: new Date().toISOString() });
    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
        sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
    }, 30000);
    // Track connected clients (in production use Redis pub/sub)
    req.on('close', () => {
        clearInterval(heartbeat);
    });
});
/**
 * @openapi
 * /api/status/view:
 *   post:
 *     summary: Track page view for analytics
 *     tags: [Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               path:
 *                 type: string
 *     responses:
 *       201:
 *         description: View recorded
 */
statusRouter.post('/view', async (req, res, next) => {
    try {
        const { pool } = await import('../config/db.js');
        const { path } = req.body;
        const ipHash = req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null;
        const userAgent = req.get('user-agent') || null;
        const referrer = req.get('referer') || null;
        await pool.query(`
      INSERT INTO status_page_views (path, ip_hash, user_agent, referrer)
      VALUES ($1, $2, $3, $4)
    `, [path, ipHash, userAgent, referrer]);
        res.status(201).json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
/**
 * @openapi
 * /api/status/analytics:
 *   get:
 *     summary: Get status page analytics
 *     tags: [Status]
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Analytics data
 */
statusRouter.get('/analytics', async (req, res, next) => {
    try {
        const { pool } = await import('../config/db.js');
        const days = parseInt(req.query.days) || 30;
        const [views, uniqueVisitors, topPaths] = await Promise.all([
            pool.query(`
        SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as views
        FROM status_page_views
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day
      `),
            pool.query(`
        SELECT DATE_TRUNC('day', created_at) as day, COUNT(DISTINCT ip_hash) as visitors
        FROM status_page_views
        WHERE created_at >= NOW() - INTERVAL '${days} days' AND ip_hash IS NOT NULL
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day
      `),
            pool.query(`
        SELECT path, COUNT(*) as views
        FROM status_page_views
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY path
        ORDER BY views DESC
        LIMIT 10
      `),
        ]);
        res.json({
            success: true,
            data: {
                dailyViews: views.rows,
                dailyUniqueVisitors: uniqueVisitors.rows,
                topPaths: topPaths.rows,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
