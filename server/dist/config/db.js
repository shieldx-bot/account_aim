"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const env_js_1 = require("./env.js");
exports.pool = new pg_1.Pool({
    host: env_js_1.env.DB_HOST,
    port: env_js_1.env.DB_PORT,
    user: env_js_1.env.DB_USER,
    password: env_js_1.env.DB_PASSWORD,
    database: env_js_1.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
// Test connection on launch
exports.pool.on('connect', () => {
    console.log('[PostgreSQL] Connected to database pool successfully.');
});
exports.pool.on('error', (err) => {
    console.error('[PostgreSQL] Unexpected error on idle client:', err);
    process.exit(-1);
});
