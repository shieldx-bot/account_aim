import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
import { syncContent } from './sync-seed-content.mjs';
const c = new pg.Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
await c.connect();
console.log('postgres: synced', await syncContent(async (sql, p) => (await c.query(sql, p))), 'rows');
await c.end();
