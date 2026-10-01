import { Pool } from 'pg';
import { env } from './env.js';
export const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
// Test connection on launch
pool.on('connect', () => {
    console.log('[PostgreSQL] Connected to database pool successfully.');
});
pool.on('error', (err) => {
    console.error('[PostgreSQL] Unexpected error on idle client:', err);
    process.exit(-1);
});
