#!/usr/bin/env node
/**
 * Real-time Status Metrics Updater
 * Continuously generates realistic metric variations for live status display
 * Run with: npx tsx server/scripts/realtime-status-updater.ts
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
  max: 10,
});

interface Component {
  id: string;
  name: string;
  category: string;
  baseLatency: number;
  baseRps: number;
  baseErrorRate: number;
}

async function getComponents(): Promise<Component[]> {
  const result = await pool.query('SELECT id, name, category FROM status_components');
  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    baseLatency: getBaseLatency(r.category),
    baseRps: getBaseRps(r.category),
    baseErrorRate: getBaseErrorRate(r.category),
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

function getBaseRps(category: string): number {
  switch (category) {
    case 'ai_providers': return 50 + Math.random() * 100;
    case 'payment_gateways': return 20 + Math.random() * 50;
    case 'fulfillment_bot': return 10 + Math.random() * 30;
    case 'core_infrastructure': return 500 + Math.random() * 1000;
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

function generateMetric(comp: Component, timestamp: Date) {
  const latency = comp.baseLatency * (0.9 + Math.random() * 0.2);
  const rps = comp.baseRps * (0.9 + Math.random() * 0.2);
  const errorRate = comp.baseErrorRate * (0.8 + Math.random() * 0.4);
  const uptime = errorRate < 0.01 ? 99.9 + Math.random() * 0.1 : 99.0 + Math.random() * 0.9;

  return {
    component_id: comp.id,
    timestamp,
    uptime: Math.min(100, Math.max(95, uptime)),
    latency_ms: Math.round(latency),
    error_rate: errorRate,
    requests_per_second: rps,
  };
}

async function updateMetrics() {
  const components = await getComponents();
  const timestamp = new Date();
  
  const values = components.map(c => generateMetric(c, timestamp));
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const v of values) {
      await client.query(`
        INSERT INTO status_metrics (component_id, timestamp, uptime, latency_ms, error_rate, requests_per_second)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [v.component_id, v.timestamp, v.uptime, v.latency_ms, v.error_rate, v.requests_per_second]);
    }
    await client.query('COMMIT');
    console.log(`[${timestamp.toISOString()}] Updated ${values.length} metrics`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to update metrics:', err);
  } finally {
    client.release();
  }
}

async function run() {
  console.log('🚀 Starting Real-time Status Metrics Updater...');
  console.log('Press Ctrl+C to stop\n');
  
  // Initial update
  await updateMetrics();
  
  // Update every 10 seconds to simulate high traffic
  const interval = setInterval(async () => {
    await updateMetrics();
  }, 10000);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping updater...');
    clearInterval(interval);
    await pool.end();
    console.log('✅ Updater stopped');
    process.exit(0);
  });
}

run().catch(async (err) => {
  console.error('❌ Updater failed:', err);
  await pool.end();
  process.exit(1);
});