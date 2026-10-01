/** Update model references to the Oct-2026 vendor lineups. Idempotent. */
const MODELS_MAP = {
  'prod_cursor_pro':      'GPT-5.6, Claude Sonnet 5, Composer 2.5',
  'prod_windsurf_pro':    'Claude Sonnet 5, GPT-5.6, DeepSeek V4',
  'prod_replit_core':     'Claude Sonnet 5, GPT-5.6',
  'prod_zed_pro':         'Claude Sonnet 5, GPT-5.6, Gemini 3.1 Pro',
  'prod_augment_code':    'Claude Sonnet 5, GPT-5.6',
  'prod_tabnine_dev':     'Tabnine Pro models, GPT-5.6',
  'prod_chatgpt_plus':    'GPT-5.6, GPT-5.6 Thinking',
  'prod_chatgpt_pro':     'GPT-5.6 Pro, GPT-5.6 Thinking',
  'prod_claude_pro':      'Claude Sonnet 5, Opus 5.5 (limited)',
  'prod_claude_max':      'Claude Opus 5.5, Claude Sonnet 5',
  'prod_claude_team':     'Claude Sonnet 5, Opus 5.5',
  'prod_ms_copilot_pro':  'GPT-5.6, DALL·E 3',
  'prod_m365_copilot_business': 'GPT-5.6 enterprise',
  'prod_mistral_pro':     'Mistral Large 3, Medium 3.5',
  'prod_qwen_max':        'Qwen3.8-Max',
  'prod_kimi_pro':        'Kimi K3, K2.6',
  'prod_deepseek_r1':     'DeepSeek V4-Pro, V4.1-Flash',
  'prod_grok_super':      'Grok 4.5, Grok 4.7',
  'prod_perplexity_pro':  'GPT-5.6, Claude Sonnet 5, Gemini 3.1 Pro',
  'prod_perplexity_max':  'GPT-5.6 Pro, Claude Opus 5.5, Gemini 3.1 Pro',
  'prod_youcom_pro':      'GPT-5.6, Claude Sonnet 5, Llama 4',
  'prod_phind_pro':       'GPT-5.6, Claude Sonnet 5',
  'prod_manus_pro':       'Claude Sonnet 5, Qwen3.8-Max',
  'prod_huggingface_pro': 'Llama 4, Qwen3.8, DeepSeek V4, FLUX',
  'prod_notion_business': 'GPT-5.6, Claude in Notion',
  'prod_grammarly_pro':   'Grammarly models, GPT-5.6',
  'prod_gemini_advanced': 'Gemini 3.1 Pro, 3.8 Flash',
  'prod_google_ai_ultra': 'Gemini 3.1 Pro, Veo 3',
  'prod_midjourney_pro':  'Midjourney V8.1',
  'prod_kling_standard':  'Kling 4.0',
  'prod_suno_ai':         'Suno v4.5',
};
const RENAMES = { 'prod_deepseek_r1': 'DeepSeek V4 Pro Suite', 'prod_grok_super': 'SuperGrok (Grok 4.5)' };
const TEXT_REPLACES = [
  ['Claude 3.7 Sonnet', 'Claude Sonnet 5'], ['Claude 3.7', 'Claude Sonnet 5'],
  ['GPT-4.5', 'GPT-5.6'], ['o3-mini', 'GPT-5.6 Thinking'], ['GPT-4o', 'GPT-5.6'],
  ['Claude Opus 4', 'Claude Opus 5.5'], ['Gemini 2.5 Pro', 'Gemini 3.1 Pro'],
  ['Qwen-Max, Qwen2.5-VL', 'Qwen3.8-Max'], ['Kimi K2 (agentic)', 'Kimi K3, K2.6'],
  ['Mistral Medium 3, Large 2', 'Mistral Large 3, Medium 3.5'],
  ['Grok 4 Heavy', 'Grok 4.7'], ['Kling 2.1', 'Kling 4.0'], ['Sonnet 3.7', 'Sonnet 5'],
  ['Gemini 1.5 Pro', 'Gemini 3.1 Pro'],
  ['Gemini 2.0 Flash', 'Gemini 3.8 Flash'],
  ['the 1.5 Pro model', 'the 3.1 Pro model'],
  ['Gemini 1.5', 'Gemini 3.1'],
  ['OpenAI o1', 'OpenAI GPT-5.6'],
  ['OpenAI o3', 'OpenAI GPT-5.6'],
  ['Grok 3 model', 'Grok 4.5 model'],
  ['Grok 3', 'Grok 4.5'],
  ['Claude 3.5 Haiku', 'Claude Sonnet 5'],
  ['GPT-5.6 & GPT-5.6 Thinking', 'GPT-5.6'],
];

export async function updateModels(q) {
  // q: async (sql, params) => result
  for (const [from, to] of TEXT_REPLACES) {
    await q(`UPDATE products SET
       badge = replace(badge, $1, $2),
       quota_features = replace(quota_features::text, $1, $2)::jsonb,
       specs = replace(specs::text, $1, $2)::jsonb
     WHERE badge LIKE '%' || $1 || '%' OR quota_features::text LIKE '%' || $1 || '%' OR specs::text LIKE '%' || $1 || '%'`,
      [from, to]);
  }
  for (const [id, models] of Object.entries(MODELS_MAP)) {
    await q(`UPDATE products SET specs = jsonb_set(specs, '{models}', to_jsonb($2::text)) WHERE id = $1`, [id, models]);
  }
  for (const [id, name] of Object.entries(RENAMES)) {
    await q(`UPDATE products SET name = $2 WHERE id = $1`, [id, name]);
  }
  const { rows } = await q(`SELECT count(*)::int AS c FROM products WHERE specs->>'models' LIKE '%GPT-4%' OR specs->>'models' LIKE '%3.7%'`);
  return rows[0].c;
}
