import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catch-async.js';
import { NotFoundError } from '../utils/app-error.js';

export const getStatusPage = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Get all components with latest metrics
  const componentsResult = await pool.query(`
    SELECT 
      c.id, c.name, c.category, c.status, 
      c.uptime_percent::numeric as uptime_percent, 
      c.description, c.metadata,
      c.updated_at,
      m.latency_ms, 
      m.error_rate::numeric as error_rate, 
      m.requests_per_second::numeric as requests_per_second, 
      m.timestamp as metric_timestamp
    FROM status_components c
    LEFT JOIN LATERAL (
      SELECT latency_ms, error_rate, requests_per_second, timestamp
      FROM status_metrics
      WHERE component_id = c.id
      ORDER BY timestamp DESC
      LIMIT 1
    ) m ON true
    ORDER BY c.category, c.name
  `);

  // Normalize component rows for frontend typing
  const components = componentsResult.rows.map((row) => ({
    ...row,
    uptime_percent: Number(row.uptime_percent),
    error_rate: row.error_rate !== null ? Number(row.error_rate) : null,
    requests_per_second: row.requests_per_second !== null ? Number(row.requests_per_second) : null,
    latency_ms: row.latency_ms !== null ? Number(row.latency_ms) : null,
  }));

  // Get recent incidents (last 90 days)
  const incidentsResult = await pool.query(`
    SELECT 
      i.id, i.title, i.description, i.status, i.impact, i.started_at, i.resolved_at,
      json_agg(
        json_build_object(
          'id', iu.id,
          'status', iu.status,
          'message', iu.message,
          'created_at', iu.created_at
        ) ORDER BY iu.created_at
      ) FILTER (WHERE iu.id IS NOT NULL) as updates,
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'category', c.category
        ) ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL) as affected_components
    FROM status_incidents i
    LEFT JOIN status_incident_updates iu ON iu.incident_id = i.id
    LEFT JOIN status_incident_components ic ON ic.incident_id = i.id
    LEFT JOIN status_components c ON c.id = ic.component_id
    WHERE i.started_at >= NOW() - INTERVAL '90 days'
    GROUP BY i.id
    ORDER BY i.started_at DESC
  `);

  // Get scheduled maintenance
  const maintenanceResult = await pool.query(`
    SELECT 
      m.id, m.title, m.description, m.status, m.scheduled_for, m.scheduled_until,
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'category', c.category
        ) ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL) as affected_components
    FROM status_maintenance m
    LEFT JOIN status_maintenance_components mc ON mc.maintenance_id = m.id
    LEFT JOIN status_components c ON c.id = mc.component_id
    GROUP BY m.id
    ORDER BY m.scheduled_for
  `);

  // Calculate overall status
  const statuses = components.map(c => c.status);
  let overallStatus = 'operational';
  if (statuses.includes('major_outage')) overallStatus = 'major_outage';
  else if (statuses.includes('partial_outage')) overallStatus = 'partial_outage';
  else if (statuses.includes('degraded_performance')) overallStatus = 'degraded_performance';

  // Calculate overall uptime
  const avgUptime = components.reduce((sum, c) => sum + Number(c.uptime_percent), 0) / components.length;

  // Group components by category
  const groupedComponents = components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, typeof components>);

  res.json({
    success: true,
    data: {
      overall: {
        status: overallStatus,
        uptimePercent: Math.round(avgUptime * 100) / 100,
        lastUpdated: new Date().toISOString(),
      },
      components: groupedComponents,
      incidents: incidentsResult.rows,
      maintenance: maintenanceResult.rows,
    },
  });
});

export const getComponentMetrics = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const hours = parseInt(req.query.hours as string) || 24;

  const componentResult = await pool.query('SELECT id, name FROM status_components WHERE id = $1', [id]);
  if (componentResult.rows.length === 0) {
    throw new NotFoundError('Component not found');
  }

  const metricsResult = await pool.query(`
    SELECT timestamp, uptime, latency_ms, error_rate, requests_per_second
    FROM status_metrics
    WHERE component_id = $1 AND timestamp >= NOW() - INTERVAL '${hours} hours'
    ORDER BY timestamp ASC
  `, [id]);

  // Generate hourly aggregates for charting
  const hourlyResult = await pool.query(`
    SELECT 
      DATE_TRUNC('hour', timestamp) as hour,
      AVG(uptime) as avg_uptime,
      AVG(latency_ms) as avg_latency,
      AVG(error_rate) as avg_error_rate,
      AVG(requests_per_second) as avg_rps
    FROM status_metrics
    WHERE component_id = $1 AND timestamp >= NOW() - INTERVAL '${hours} hours'
    GROUP BY DATE_TRUNC('hour', timestamp)
    ORDER BY hour ASC
  `, [id]);

  res.json({
    success: true,
    data: {
      component: componentResult.rows[0],
      rawMetrics: metricsResult.rows,
      hourlyAggregates: hourlyResult.rows,
    },
  });
});

export const getIncidents = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const status = req.query.status as string;
  const limit = parseInt(req.query.limit as string) || 50;

  let whereClause = `WHERE i.started_at >= NOW() - INTERVAL '90 days'`;
  const params: any[] = [];
  if (status) {
    whereClause += ` AND i.status = $${params.length + 1}`;
    params.push(status);
  }

  const result = await pool.query(`
    SELECT 
      i.id, i.title, i.description, i.status, i.impact, i.started_at, i.resolved_at,
      json_agg(
        json_build_object(
          'id', iu.id,
          'status', iu.status,
          'message', iu.message,
          'created_at', iu.created_at
        ) ORDER BY iu.created_at
      ) FILTER (WHERE iu.id IS NOT NULL) as updates,
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'category', c.category
        ) ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL) as affected_components
    FROM status_incidents i
    LEFT JOIN status_incident_updates iu ON iu.incident_id = i.id
    LEFT JOIN status_incident_components ic ON ic.incident_id = i.id
    LEFT JOIN status_components c ON c.id = ic.component_id
    ${whereClause}
    GROUP BY i.id
    ORDER BY i.started_at DESC
    LIMIT $${params.length + 1}
  `, [...params, limit]);

  res.json({ success: true, data: result.rows });
});

export const getMaintenance = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const status = req.query.status as string;

  let whereClause = '';
  const params: any[] = [];
  if (status) {
    whereClause = `WHERE m.status = $1`;
    params.push(status);
  }

  const result = await pool.query(`
    SELECT 
      m.id, m.title, m.description, m.status, m.scheduled_for, m.scheduled_until,
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'category', c.category
        ) ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL) as affected_components
    FROM status_maintenance m
    LEFT JOIN status_maintenance_components mc ON mc.maintenance_id = m.id
    LEFT JOIN status_components c ON c.id = mc.component_id
    ${whereClause}
    GROUP BY m.id
    ORDER BY m.scheduled_for
  `, params);

  res.json({ success: true, data: result.rows });
});