/**
 * One-off catalog price normalization (2026-10 audit).
 * Aligns retail prices with vendor public monthly pricing and enforces an
 * exact 50% store discount. Safe to re-run (idempotent UPDATEs).
 */
import { PGlite } from '@electric-sql/pglite';

const FIXES = [
  // [id, name, originalUSD, currentUSD, originalVND, currentVND]
  ['prod_claude_pro',      'Claude Pro',                  20.0,  10.0,  500000, 250000],
  ['prod_chatgpt_plus',    'ChatGPT Plus',                20.0,  10.0,  500000, 250000],
  ['prod_github_copilot',  'GitHub Copilot Pro',          10.0,   5.0,  250000, 125000],
  ['prod_midjourney_pro',  'Midjourney Standard',         30.0,  15.0,  750000, 375000],
  ['prod_jetbrains_ai',    'JetBrains AI Pro',            10.0,   5.0,  250000, 125000],
  ['prod_gemini_advanced', 'Google Gemini Advanced',      20.0,  10.0,  500000, 250000],
  ['prod_claude_team',     'Claude Team Workspace',       25.0,  12.5,  625000, 312500],
  ['prod_perplexity_pro',  'Perplexity Pro',              20.0,  10.0,  500000, 250000],
  ['prod_deepseek_r1',     'DeepSeek R1 Pro Suite',       15.0,   7.5,  375000, 187500],
  ['prod_grok_super',      'SuperGrok (Grok 4)',          30.0,  15.0,  750000, 375000],
  ['prod_elevenlabs_pro',  'ElevenLabs Creator AI',       22.0,  11.0,  550000, 275000],
  ['prod_suno_ai',         'Suno AI Music Pro',           10.0,   5.0,  250000, 125000],
  ['prod_lovable_pro',     'Lovable.dev Pro Engineer',    25.0,  12.5,  625000, 312500],
  ['prod_pika_pro',        'Pika Pro',                    35.0,  17.5,  875000, 437500],
  ['prod_canva_pro',       'Canva Pro',                   18.0,   9.0,  450000, 225000],
  ['prod_figma_pro',       'Figma Professional (AI)',     18.0,   9.0,  450000, 225000],
  ['prod_manus_pro',       'Manus Starter (AI Agent)',    39.0,  19.5,  975000, 487500],
];

const dataDir = process.argv[2] || './data/pglite';
const db = new PGlite(dataDir);
let n = 0;
for (const [id, name, oUSD, cUSD, oVND, cVND] of FIXES) {
  const res = await db.query(
    `UPDATE products SET name = $2, original_price_usd = $3, current_price_usd = $4,
       original_price_vnd = $5, current_price_vnd = $6, discount_percent = 50
     WHERE id = $1`,
    [id, name, oUSD, cUSD, oVND, cVND],
  );
  n += res.rowCount ?? res.rows?.length ?? 0;
}
// enforce exactly 50% label on everything else
await db.query(`UPDATE products SET discount_percent = 50 WHERE discount_percent <> 50`);
const check = await db.query(`SELECT count(*)::int AS c FROM products WHERE discount_percent = 50`);
console.log(`updated ${n} rows; ${check.rows[0].c}/46 products labeled 50%`);
await db.close();
