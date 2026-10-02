/**
 * Set real-market prices (v1.1 pricing model).
 *
 * Pricing policy: catalog prices == official vendor monthly price (USD).
 * No fake "original price" anchor — the displayed price changes ONLY when a
 * discount coupon (e.g. the Lucky Wheel prize) is applied at checkout.
 *
 * Usage:  node scripts/set-real-market-prices.mjs [path/to/prices.json]
 * JSON:   { "prod_cursor_pro": 20, "prod_claude_pro": 20, ... }   (USD/month)
 *         Products missing from the JSON keep their current price.
 * VND conversion uses USD_VND_RATE (env, default 26300).
 */
import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const RATE = Number(process.env.USD_VND_RATE || 26300);
const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/set-real-market-prices.mjs <prices.json>');
  process.exit(1);
}
const prices = JSON.parse(fs.readFileSync(file, 'utf-8'));

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
await client.connect();

let updated = 0;
const skipped = [];
for (const [id, usd] of Object.entries(prices)) {
  if (typeof usd !== 'number' || usd <= 0) {
    skipped.push(id);
    continue;
  }
  const vnd = Math.round(usd * RATE);
  const res = await client.query(
    `UPDATE products
     SET original_price_usd = $2, current_price_usd = $2,
         original_price_vnd = $3, current_price_vnd = $3,
         discount_percent = 0
     WHERE id = $1`,
    [id, usd, vnd]
  );
  if (res.rowCount > 0) updated++;
  else console.warn(`! unknown product id: ${id}`);
}
console.log(`updated ${updated} products to real market prices (rate ${RATE} VND/USD), skipped ${skipped.length}`);
await client.end();
