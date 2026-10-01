import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
import { updateModels } from './update-models-2026.mjs';
const client = new pg.Client({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});
await client.connect();
const q = async (sql, params) => (await client.query(sql, params));
const stale = await updateModels(q);
console.log(`postgres: done, ${stale} products still reference old models`);
await client.end();
