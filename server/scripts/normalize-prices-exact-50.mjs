/** Enforce EXACT 50% off retail on every product in the local PGlite DB. */
import { PGlite } from '@electric-sql/pglite';
const dataDir = process.argv[2] || './data/pglite';
const db = new PGlite(dataDir);
const rows = (await db.query(`SELECT id, original_price_usd FROM products`)).rows;
let n = 0;
for (const r of rows) {
  const orig = Number(r.original_price_usd);
  const half = Math.round((orig / 2) * 100) / 100; // exact half, ROUND_HALF_UP-ish
  const vndOrig = Math.round(orig * 25000);
  const vndHalf = Math.round(half * 25000);
  const res = await db.query(
    `UPDATE products SET current_price_usd = $2, current_price_vnd = $3,
       original_price_vnd = $4, discount_percent = 50 WHERE id = $1`,
    [r.id, half, vndHalf, vndOrig],
  );
  n += res.rowCount ?? 0;
}
console.log(`normalized ${n} products to exact 50%`);
await db.close();
