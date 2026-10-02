/** One-off: seed the 48 supplier-catalog products into any Postgres DB.
 * Usage: node --env-file=.env scripts/seed-supplier-catalog.mjs
 * Reads supplier-catalog.json (same data as src/data/supplier-catalog.ts).
 * Idempotent: ON CONFLICT (id) DO NOTHING — safe to re-run. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'data', 'supplier-catalog.json'), 'utf8')
);

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: /railway|proxy\.rlwy/.test(process.env.DB_HOST || '') ? { rejectUnauthorized: false } : undefined,
  max: 2,
});

let inserted = 0, skipped = 0;
for (const p of products) {
  const r = await pool.query(
    `INSERT INTO products (
      id, slug, name, brand, brand_logo, category,
      original_price_vnd, current_price_vnd, original_price_usd, current_price_usd,
      discount_percent, instant_delivery, stock_count, badge, platform_subtext,
      quota_features, specs, is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT (id) DO NOTHING`,
    [p.id, p.slug, p.name, p.brand, p.brandLogo, p.category,
     p.originalPriceVND, p.currentPriceVND, p.originalPriceUSD, p.currentPriceUSD,
     p.discountPercent, p.instantDelivery, p.stockCount, p.badge, p.platformSubtext,
     JSON.stringify(p.quotaFeatures), JSON.stringify(p.specs), true]
  );
  r.rowCount ? inserted++ : skipped++;
}
const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM products WHERE is_active=true');
console.log(`supplier products inserted=${inserted} skipped(already)=${skipped} | active total=${count}`);
await pool.end();
