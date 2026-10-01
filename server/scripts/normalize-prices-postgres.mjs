/** Exact-50% normalization against an external PostgreSQL (pg). */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
await client.connect();
const { rows } = await client.query(`SELECT id, original_price_usd FROM products`);
let n = 0;
for (const r of rows) {
  const orig = Number(r.original_price_usd);
  const half = Math.round((orig / 2) * 100) / 100;
  const vndOrig = Math.round(orig * 25000);
  const vndHalf = Math.round(half * 25000);
  const res = await client.query(
    `UPDATE products SET current_price_usd = $2, current_price_vnd = $3,
       original_price_vnd = $4, discount_percent = 50 WHERE id = $1`,
    [r.id, half, vndHalf, vndOrig],
  );
  n += res.rowCount;
}
console.log(`postgres: normalized ${n} products`);
await client.end();
