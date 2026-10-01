/** Sync quota_features + specs from seed sources into a DB. Idempotent. */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const blocks = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'seed-content-sync.json'), 'utf-8'));
export async function syncContent(q) {
  let n = 0;
  for (const [id, { quotaFeatures, specs, name, badge, platformSubtext }] of Object.entries(blocks)) {
    const res = await q(
      `UPDATE products SET quota_features = $2::jsonb, specs = specs || $3::jsonb,
         name = $4, badge = $5, platform_subtext = $6 WHERE id = $1`,
      [id, JSON.stringify(quotaFeatures), JSON.stringify(specs), name, badge, platformSubtext],
    );
    n += res.rowCount ?? 0;
  }
  return n;
}
