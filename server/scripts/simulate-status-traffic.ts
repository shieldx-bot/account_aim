#!/usr/bin/env node
/**
 * Status System Traffic Simulator
 * Simulates high-traffic scenarios for the status monitoring system
 * Run with: npx tsx server/scripts/simulate-status-traffic.ts
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'aipro',
  max: 20,
});

interface Component {
  id: string;
  name: string;
  category: string;
  baseUptime: number;
  baseLatency: number;
  baseErrorRate: number;
  baseRps: number;
}

async function getComponents(): Promise<Component[]> {
  const result = await pool.query(`
    SELECT id, name, category, uptime_percent as base_uptime
    FROM status_components
    ORDER BY category, name
  `);
  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    baseUptime: parseFloat(r.base_uptime),
    baseLatency: getBaseLatency(r.category),
    baseErrorRate: getBaseErrorRate(r.category),
    baseRps: getBaseRps(r.category),
  }));
}

function getBaseLatency(category: string): number {
  switch (category) {
    case 'ai_providers': return 150 + Math.random() * 100;
    case 'payment_gateways': return 200 + Math.random() * 150;
    case 'fulfillment_bot': return 50 + Math.random() * 30;
    case 'core_infrastructure': return 5 + Math.random() * 10;
    default: return 100;
  }
}

function getBaseErrorRate(category: string): number {
  switch (category) {
    case 'ai_providers': return 0.001 + Math.random() * 0.002;
    case 'payment_gateways': return 0.0005 + Math.random() * 0.001;
    case 'fulfillment_bot': return 0.0001 + Math.random() * 0.0005;
    case 'core_infrastructure': return 0.00001 + Math.random() * 0.0001;
    default: return 0.001;
  }
}

function getBaseRps(category: string): number {
  switch (category) {
    case 'ai_providers': return 50 + Math.random() * 100;
    case 'payment_gateways': return 20 + Math.random() * 50;
    case 'fulfillment_bot': return 10 + Math.random() * 30;
    case 'core_infrastructure': return 500 + Math.random() * 1000;
    default: return 100;
  }
}

function generateMetrics(comp: Component, timestamp: Date, scenario: 'normal' | 'degraded' | 'outage' | 'recovery' = 'normal') {
  let uptime = comp.baseUptime;
  let latency = comp.baseLatency;
  let errorRate = comp.baseErrorRate;
  let rps = comp.baseRps;

  // Apply scenario modifiers
  switch (scenario) {
    case 'degraded':
      uptime = Math.max(99.0, uptime - (Math.random() * 0.5));
      latency *= 2 + Math.random() * 3;
      errorRate *= 10 + Math.random() * 20;
      rps *= 0.7 + Math.random() * 0.2;
      break;
    case 'outage':
      uptime = Math.max(95.0, uptime - (Math.random() * 3));
      latency *= 10 + Math.random() * 20;
      errorRate *= 100 + Math.random() * 500;
      rps *= 0.1 + Math.random() * 0.2;
      break;
    case 'recovery':
      uptime = Math.min(100, uptime + (Math.random() * 0.3));
      latency *= 1.2 + Math.random() * 0.5;
      errorRate *= 2 + Math.random() * 3;
      rps *= 0.9 + Math.random() * 0.2;
      break;
    default:
      // Normal variation
      uptime += (Math.random() - 0.5) * 0.02;
      latency *= 0.9 + Math.random() * 0.2;
      errorRate *= 0.8 + Math.random() * 0.4;
      rps *= 0.95 + Math.random() * 0.1;
  }

  // Add some noise
  uptime = Math.min(100, Math.max(95, uptime));
  latency = Math.max(1, latency * (0.95 + Math.random() * 0.1));
  errorRate = Math.max(0, errorRate * (0.9 + Math.random() * 0.2));
  rps = Math.max(1, rps * (0.9 + Math.random() * 0.2));

  return {
    component_id: comp.id,
    timestamp,
    uptime: Number(uptime.toFixed(2)),
    latency_ms: Math.round(latency),
    error_rate: Number(errorRate.toFixed(6)),
    requests_per_second: Number(rps.toFixed(2)),
  };
}

async function insertMetrics(metrics: any[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const m of metrics) {
      await client.query(`
        INSERT INTO status_metrics (component_id, timestamp, uptime, latency_ms, error_rate, requests_per_second)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [m.component_id, m.timestamp, m.uptime, m.latency_ms, m.error_rate, m.requests_per_second]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function simulatePageViews() {
  const paths = ['/status', '/status/components', '/status/incidents', '/status/maintenance', '/api/status'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'curl/7.68.0',
    'PostmanRuntime/7.29.0',
  ];

  for (let i = 0; i < 50 + Math.random() * 100; i++) {
    const path = paths[Math.floor(Math.random() * paths.length)];
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
    const ipHash = require('crypto').randomBytes(8).toString('hex');
    const referrer = Math.random() > 0.5 ? 'https://aipro.dev/' : null;

    await pool.query(`
      INSERT INTO status_page_views (path, ip_hash, user_agent, referrer, created_at)
      VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.random() * 3600} seconds')
    `, [path, ipHash, ua, referrer]);
  }
}

async function runSimulation() {
  console.log('🚀 Starting Status System Traffic Simulation...');
  
  const components = await getComponents();
  console.log(`📊 Found ${components.length} components to simulate`);

  // Simulate different scenarios over time
  const scenarios: Array<'normal' | 'degraded' | 'outage' | 'recovery'> = [
    'normal', 'normal', 'normal', 'normal', 'normal',
    'degraded', 'degraded',
    'outage',
    'recovery', 'recovery',
    'normal', 'normal', 'normal',
  ];

  let scenarioIndex = 0;
  const scenarioDuration = 5 * 60 * 1000; // 5 minutes per scenario in simulation (compressed to seconds)
  
  console.log('🎬 Simulating 24 hours of traffic in compressed time...');
  
  // Generate 24 hours of data (1 minute intervals = 1440 data points per component)
  const totalMinutes = 24 * 60;
  const batchSize = 60; // Insert 60 minutes at a time
  
  for (let batchStart = 0; batchStart < totalMinutes; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, totalMinutes);
    const allMetrics: any[] = [];
    
    for (let minute = batchStart; minute < batchEnd; minute++) {
      const timestamp = new Date(Date.now() - (totalMinutes - minute) * 60 * 1000);
      const scenario = scenarios[Math.floor((minute / totalMinutes) * scenarios.length)];
      
      for (const comp of components) {
        const m = generateMetrics(comp, timestamp, scenario);
        allMetrics.push(m);
      }
    }
    
    await insertMetrics(allMetrics);
    console.log(`✅ Inserted metrics for minutes ${batchStart}-${batchEnd} (${allMetrics.length} records)`);
  }

  // Simulate page views
  console.log('👥 Simulating page views...');
  await simulatePageViews();
  console.log('✅ Page views simulated');

  // Update component uptime_percent based on recent metrics
  for (const comp of components) {
    const recent = await pool.query(`
      SELECT AVG(uptime) as avg_uptime 
      FROM status_metrics 
      WHERE component_id = $1 AND timestamp >= NOW() - INTERVAL '90 days'
    `, [comp.id]);
    
    if (recent.rows[0].avg_uptime) {
      await pool.query(`
        UPDATE status_components 
        SET uptime_percent = $1, updated_at = NOW() 
        WHERE id = $2
      `, [parseFloat(recent.rows[0].avg_uptime).toFixed(2), comp.id]);
    }
  }

  console.log('✅ Component uptimes updated');
  
  // Print summary
  const summary = await pool.query(`
    SELECT 
      category,
      COUNT(*) as components,
      ROUND(AVG(uptime_percent)::numeric, 2) as avg_uptime,
      COUNT(*) FILTER (WHERE status != 'operational') as issues
    FROM status_components
    GROUP BY category
    ORDER BY category
  `);
  
  console.log('\n📈 Simulation Summary:');
  console.table(summary.rows);
  
  const metricsCount = await pool.query('SELECT COUNT(*) as count FROM status_metrics');
  const viewsCount = await pool.query('SELECT COUNT(*) as count FROM status_page_views');
  
  console.log(`\n📊 Total metrics records: ${metricsCount.rows[0].count}`);
  console.log(`👁️  Total page views: ${viewsCount.rows[0].count}`);
  
  await pool.end();
  console.log('\n✨ Simulation complete!');
}

runSimulation().catch(async (err) => {
  console.error('❌ Simulation failed:', err);
  await pool.end();
  process.exit(1);
});