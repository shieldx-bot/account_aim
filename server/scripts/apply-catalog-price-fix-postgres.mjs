/** Vendor-retail alignment + rename for legacy rows (external PostgreSQL). */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const FIXES = [
  ['prod_claude_pro',      'Claude Pro',                  20.0,  500000],
  ['prod_chatgpt_plus',    'ChatGPT Plus',                20.0,  500000],
  ['prod_github_copilot',  'GitHub Copilot Pro',          10.0,  250000],
  ['prod_midjourney_pro',  'Midjourney Standard',         30.0,  750000],
  ['prod_jetbrains_ai',    'JetBrains AI Pro',            10.0,  250000],
  ['prod_gemini_advanced', 'Google Gemini Advanced',      20.0,  500000],
  ['prod_claude_team',     'Claude Team Workspace',       25.0,  625000],
  ['prod_perplexity_pro',  'Perplexity Pro',              20.0,  500000],
  ['prod_deepseek_r1',     'DeepSeek R1 Pro Suite',       15.0,  375000],
  ['prod_grok_super',      'SuperGrok (Grok 4)',          30.0,  750000],
  ['prod_elevenlabs_pro',  'ElevenLabs Creator AI',       22.0,  550000],
  ['prod_suno_ai',         'Suno AI Music Pro',           10.0,  250000],
  ['prod_lovable_pro',     'Lovable.dev Pro Engineer',    25.0,  625000],
  ['prod_pika_pro',        'Pika Pro',                    35.0,  875000],
  ['prod_canva_pro',       'Canva Pro',                   18.0,  450000],
  ['prod_figma_pro',       'Figma Professional (AI)',     18.0,  450000],
  ['prod_manus_pro',       'Manus Starter (AI Agent)',    39.0,  975000],
];

const client = new pg.Client({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
await client.connect();
let n = 0;
for (const [id, name, oUSD, oVND] of FIXES) {
  const half = Math.round((oUSD / 2) * 100) / 100;
  const res = await client.query(
    `UPDATE products SET name = $2, original_price_usd = $3, original_price_vnd = $4,
       current_price_usd = $5, current_price_vnd = $6, discount_percent = 50
     WHERE id = $1`,
    [id, name, oUSD, oVND, half, Math.round(half * 25000)],
  );
  n += res.rowCount;
}
console.log(`postgres: ${n} rows aligned to vendor retail + 50%`);
await client.end();
