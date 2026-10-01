import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { EXPANDED_PRODUCTS } from '../data/catalog-expansion.js';

// Initial 8 seed products matching the frontend portfolio
const INITIAL_PRODUCTS = [
  {
    id: 'prod_cursor_pro',
    slug: 'cursor-pro',
    name: 'Cursor Pro',
    brand: 'Cursor AI',
    brandLogo: '/assets/logos/logo_brand_cursor.svg',
    category: 'coding',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 42,
    badge: '🔥 Recommended for Devs',
    platformSubtext: 'VS Code Fork, Windows / macOS / Linux',
    quotaFeatures: [
      '500 Fast Premium Requests / month',
      'Unlimited Claude Sonnet 5 & GPT-5.6',
      'Options: pre-issued email or upgrade your own',
      'Automatic 1-to-1 warranty within 30-90 days',
    ],
    specs: {
      fastQuota: '500 Fast Requests/mo',
      contextWindow: '200K Tokens',
      models: 'GPT-5.6, Claude Sonnet 5, Composer 2.5',
      multiDevice: 'Sync on 3 devices at once',
    },
  },
  {
    id: 'prod_claude_pro',
    slug: 'claude-pro',
    name: 'Claude Pro',
    brand: 'Anthropic',
    brandLogo: '/assets/logos/logo_brand_anthropic_claude.svg',
    category: 'llm',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 18,
    badge: '⚡ Sonnet 5 Ready',
    platformSubtext: 'Web Interface, Claude Desktop, Artifacts',
    quotaFeatures: [
      'Claude Sonnet 5 with 64K Extended Thinking',
      'Request limit 5x higher than the Free plan',
      'Interactive Claude Projects & Artifacts support',
      'Activate with your own email or a pre-issued one',
    ],
    specs: {
      fastQuota: '5x the Free quota (~45 msgs / 5 hours)',
      contextWindow: '200K Tokens Context Window',
      models: 'Claude Sonnet 5, Opus 5.5 (limited)',
      multiDevice: 'Synced Web & Desktop App',
    },
  },
  {
    id: 'prod_chatgpt_plus',
    slug: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    brand: 'OpenAI',
    brandLogo: '/assets/logos/logo_brand_openai_chatgpt.svg',
    category: 'llm',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 25,
    badge: 'GPT-5.6 & Canvas',
    platformSubtext: 'Web, iOS, Android, macOS & Windows App',
    quotaFeatures: [
      'Access to GPT-5.6, GPT-5.6 models',
      'Canvas feature for coding & in-depth writing',
      'Advanced Voice Mode with natural speech',
      'DALL-E 3 image generation & real-time Web Search',
    ],
    specs: {
      fastQuota: '80 msgs / 3 hours with GPT-5.6',
      contextWindow: '128K Tokens',
      models: 'GPT-5.6, GPT-5.6 Thinking',
      multiDevice: 'Web, Mobile, Desktop',
    },
  },
  {
    id: 'prod_github_copilot',
    slug: 'github-copilot',
    name: 'GitHub Copilot Pro',
    brand: 'GitHub',
    brandLogo: '/assets/logos/logo_brand_github_copilot.svg',
    category: 'coding',
    originalPriceVND: 250000,
    currentPriceVND: 125000,
    originalPriceUSD: 10.0,
    currentPriceUSD: 5.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 36,
    badge: 'Native IDE Plugin',
    platformSubtext: 'VS Code, JetBrains, Visual Studio, Neovim',
    quotaFeatures: [
      'Real-time inline autocomplete code suggestions',
      'In-IDE Copilot Chat to explain & refactor',
      'Model options: GPT-5.6, Claude Sonnet 5',
      'Upgrade directly on your personal GitHub account',
    ],
    specs: {
      fastQuota: 'Unlimited code Autocomplete',
      contextWindow: 'Entire workspace codebase',
      models: 'GPT-5.6, Claude Sonnet 5',
      multiDevice: 'Synced via GitHub account',
    },
  },
  {
    id: 'prod_midjourney_pro',
    slug: 'midjourney-pro',
    name: 'Midjourney Standard',
    brand: 'Midjourney',
    brandLogo: '/assets/logos/logo_brand_midjourney.svg',
    category: 'design',
    originalPriceVND: 750000,
    currentPriceVND: 375000,
    originalPriceUSD: 30.0,
    currentPriceUSD: 15.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 14,
    badge: '15h Fast GPU',
    platformSubtext: 'Discord Bot & Web Gallery Creator',
    quotaFeatures: [
      '15 hours of Fast GPU image generation per month',
      'Unlimited Relax GPU image generation',
      'Full commercial rights to all generated works',
      '100% private pre-issued Discord account',
    ],
    specs: {
      fastQuota: '15 Fast GPU Hours / mo',
      contextWindow: 'Model V8.1 & Niji 6',
      models: 'Midjourney V8.1',
      multiDevice: 'Private Discord Server',
    },
  },
  {
    id: 'prod_jetbrains_ai',
    slug: 'jetbrains-ai',
    name: 'JetBrains AgentLab',
    brand: 'JetBrains',
    brandLogo: '/assets/logos/logo_brand_jetbrains.svg',
    category: 'coding',
    originalPriceVND: 250000,
    currentPriceVND: 125000,
    originalPriceUSD: 10.0,
    currentPriceUSD: 5.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 22,
    badge: 'IntelliJ / WebStorm',
    platformSubtext: 'IntelliJ IDEA, PyCharm, WebStorm, PhpStorm',
    quotaFeatures: [
      'Native integration with the JetBrains IDEs ecosystem',
      'Automatic Unit Test & Documentation writing',
      'Refactoring support and runtime error analysis',
      'Delivered with an activation key for your JetBrains Account',
    ],
    specs: {
      fastQuota: 'Unlimited standard quota',
      contextWindow: 'Full project AST analysis',
      models: 'Mellona AI & OpenAI models',
      multiDevice: 'Activated via JetBrains Hub',
    },
  },
  {
    id: 'prod_gemini_advanced',
    slug: 'gemini-advanced',
    name: 'Google Gemini Advanced',
    brand: 'Google DeepMind',
    brandLogo: '/assets/logos/logo_brand_google_gemini.svg',
    category: 'llm',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 30,
    badge: '1M Context Window',
    platformSubtext: 'Web, Google Workspace (Docs, Gmail)',
    quotaFeatures: [
      'Massive 1,000,000-token context window',
      'Gemini 3.1 Pro analyzes large documents and videos',
      'Built-in integration with Google Docs, Sheets, Gmail',
      'Includes 2TB of secure Google Drive storage',
    ],
    specs: {
      fastQuota: 'Priority speed for the 1.5 Pro model',
      contextWindow: '1.000.000 Tokens (1 Hour Video / 700K Words)',
      models: 'Gemini 3.1 Pro, 3.8 Flash',
      multiDevice: 'All devices on your Google Account',
    },
  },
  {
    id: 'prod_claude_team',
    slug: 'claude-team-seat',
    name: 'Claude Team Workspace',
    brand: 'Anthropic',
    brandLogo: '/assets/logos/logo_brand_anthropic_claude.svg',
    category: 'enterprise',
    originalPriceVND: 625000,
    currentPriceVND: 312500,
    originalPriceUSD: 25.0,
    currentPriceUSD: 12.5,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 8,
    badge: '🏢 Enterprise',
    platformSubtext: 'Dedicated Workspace cho Team Dev / Startup',
    quotaFeatures: [
      'Higher quota than the standard Claude Pro plan',
      'Share internal Custom Prompt Templates with your team',
      'Admin role management, SOC 2 Type II security',
      'Committed to never training AI on your code data',
    ],
    specs: {
      fastQuota: '2x the Pro quota (~90 msgs / 5 hours)',
      contextWindow: '200K Tokens Context Window',
      models: 'Claude Sonnet 5, Opus 5.5',
      multiDevice: 'Centralized management via Team Console',
    },
  },
  {
    id: 'prod_perplexity_pro',
    slug: 'perplexity-pro',
    name: 'Perplexity Pro',
    brand: 'Perplexity AI',
    brandLogo: '/assets/logos/logo_brand_perplexity.svg',
    category: 'search',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 35,
    badge: '🔍 Deep Research 2026',
    platformSubtext: 'Web, iOS, Android, Mac & Chrome Extension',
    quotaFeatures: [
      '300+ Pro Searches / day with Claude Sonnet 5 & GPT-5.6',
      'Deep Research feature that automatically analyzes 100+ sources',
      'Unlimited PDF, Code and Dataset uploads for analysis',
      '$5 in API credits each month for Developers',
    ],
    specs: {
      fastQuota: '300+ Pro Queries/day',
      contextWindow: '128K Tokens',
      models: 'GPT-5.6, Claude Sonnet 5, Gemini 3.1 Pro',
      multiDevice: 'Web, Mobile, Desktop App',
    },
  },
  {
    id: 'prod_v0_dev',
    slug: 'v0-dev-pro',
    name: 'v0.dev Premium',
    brand: 'Vercel',
    brandLogo: '/assets/logos/logo_brand_v0.svg',
    category: 'coding',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 20,
    badge: '⚡ React / Tailwind UI',
    platformSubtext: 'In-Browser Fullstack UI Code Generator',
    quotaFeatures: [
      '5,000 credits to generate React / Next.js / Tailwind components',
      '1-Click export of source code to GitHub or CodeSandbox',
      'Visually edit the UI using natural language',
      'Upgrade directly on your personal Vercel account',
    ],
    specs: {
      fastQuota: '5000 Premium Credits/mo',
      contextWindow: 'Full Next.js / Shadcn Codebases',
      models: 'v0-large, Claude Sonnet 5',
      multiDevice: 'Web browser with integrated Vercel',
    },
  },
  {
    id: 'prod_deepseek_r1',
    slug: 'deepseek-r1-pro',
    name: 'DeepSeek V4 Pro Suite',
    brand: 'DeepSeek AI',
    brandLogo: '/assets/logos/logo_brand_deepseek.svg',
    category: 'llm',
    originalPriceVND: 375000,
    currentPriceVND: 187500,
    originalPriceUSD: 15.0,
    currentPriceUSD: 7.5,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 45,
    badge: '🧠 Open Reasoning #1',
    platformSubtext: 'Web Interface & Dedicated API Access',
    quotaFeatures: [
      'Math & coding reasoning on par with OpenAI GPT-5.6',
      'Ultra-fast token generation at 60+ tokens/second',
      'Unlimited standard messages throughout the day',
      'Secure pre-issued account or Dedicated API Key',
    ],
    specs: {
      fastQuota: 'Unlimited standard usage',
      contextWindow: '64K Tokens Context',
      models: 'DeepSeek V4-Pro, V4.1-Flash',
      multiDevice: 'Web App & API Endpoint',
    },
  },
  {
    id: 'prod_grok_super',
    slug: 'grok-super-pro',
    name: 'SuperGrok (Grok 4.5)',
    brand: 'xAI (Elon Musk)',
    brandLogo: '/assets/logos/logo_brand_grok.svg',
    category: 'llm',
    originalPriceVND: 750000,
    currentPriceVND: 375000,
    originalPriceUSD: 30.0,
    currentPriceUSD: 15.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 16,
    badge: '🚀 Realtime X Data',
    platformSubtext: 'Web, Mobile & X Premium+ Suite',
    quotaFeatures: [
      'Grok 4.5 model on the Colossus supercomputer with 100K H100s',
      'Query real-time breaking news & data from X',
      'Uncensored hyper-realistic image generation via Aurora Image Gen',
      'Includes an X Verified badge for your account',
    ],
    specs: {
      fastQuota: 'Unlimited Grok queries',
      contextWindow: '128K Tokens',
      models: 'Grok 4.5, Grok 4.7',
      multiDevice: 'X Web & Mobile App',
    },
  },
  {
    id: 'prod_elevenlabs_pro',
    slug: 'elevenlabs-creator',
    name: 'ElevenLabs Creator AI',
    brand: 'ElevenLabs',
    brandLogo: '/assets/logos/logo_brand_elevenlabs.svg',
    category: 'design',
    originalPriceVND: 550000,
    currentPriceVND: 275000,
    originalPriceUSD: 22.0,
    currentPriceUSD: 11.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 24,
    badge: '🎙️ Voice Clone #1',
    platformSubtext: 'Studio Web, Voice Lab, API Access',
    quotaFeatures: [
      '100,000 characters of high-quality Studio voiceover per month',
      'Ultra-realistic Instant Voice Cloning',
      'Supports 32+ natural languages including Vietnamese',
      'Full commercial rights to all exported audio files',
    ],
    specs: {
      fastQuota: '100K Characters/mo',
      contextWindow: 'High Fidelity 44.1kHz Audio',
      models: 'Eleven Multilingual v2 & Turbo v2.5',
      multiDevice: 'Web Studio & API',
    },
  },
  {
    id: 'prod_suno_ai',
    slug: 'suno-ai-music',
    name: 'Suno AI Music Pro',
    brand: 'Suno AI',
    brandLogo: '/assets/logos/logo_brand_suno.svg',
    category: 'design',
    originalPriceVND: 250000,
    currentPriceVND: 125000,
    originalPriceUSD: 10.0,
    currentPriceUSD: 5.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 30,
    badge: '🎵 Music Generation v4',
    platformSubtext: 'Web & Mobile App Creator',
    quotaFeatures: [
      '2,500 credits per month (~500 complete songs)',
      'Suno v4 model with studio-grade stereo sound',
      'Own commercial rights to publish to Spotify / YouTube',
      'Upgrade directly on your own email or a pre-issued one',
    ],
    specs: {
      fastQuota: '2500 Credits/mo (500 Songs)',
      contextWindow: 'Full Song (4 Minutes+)',
      models: 'Suno v4.5',
      multiDevice: 'Web & iOS/Android App',
    },
  },
  {
    id: 'prod_lovable_pro',
    slug: 'lovable-dev-pro',
    name: 'Lovable.dev Pro Engineer',
    brand: 'Lovable',
    brandLogo: '/assets/logos/logo_brand_lovable.svg',
    category: 'coding',
    originalPriceVND: 625000,
    currentPriceVND: 312500,
    originalPriceUSD: 25.0,
    currentPriceUSD: 12.5,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 12,
    badge: '⚡ AI Fullstack Builder',
    platformSubtext: 'Web Interface, GitHub Sync, Supabase',
    quotaFeatures: [
      'Build a complete web app from an idea in 60 seconds',
      'Native Supabase database & Authentication integration',
      'Two-way sync with your GitHub Repository',
      'Unlimited deployments to a custom domain',
    ],
    specs: {
      fastQuota: '100+ Fullstack Prompts/day',
      contextWindow: 'Full Project Architecture',
      models: 'Lovable Code Engine + Claude Sonnet 5',
      multiDevice: 'Web Browser',
    },
  },
  {
    id: 'prod_bolt_new',
    slug: 'bolt-new-stackblitz',
    name: 'Bolt.new Developer Pro',
    brand: 'StackBlitz',
    brandLogo: '/assets/logos/logo_brand_bolt.svg',
    category: 'coding',
    originalPriceVND: 500000,
    currentPriceVND: 250000,
    originalPriceUSD: 20.0,
    currentPriceUSD: 10.0,
    discountPercent: 50,
    instantDelivery: true,
    stockCount: 22,
    badge: '💻 WebContainers VM',
    platformSubtext: 'Fullstack Browser Node.js Dev Environment',
    quotaFeatures: [
      '10 million tokens of in-browser fullstack code generation per month',
      'Run Node.js, Vite and Next.js directly in the browser',
      '1-Click Deploy to Netlify / Cloudflare Pages',
      'Delivered as a pre-issued account or upgrade your own email',
    ],
    specs: {
      fastQuota: '10M Tokens/mo',
      contextWindow: '128K Tokens Context',
      models: 'Claude Sonnet 5 & GPT-5.6',
      multiDevice: 'Web Browser',
    },
  },
];


// Helper to convert database snake_case row to frontend camelCase object
export const formatProductRow = (row: any) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  brand: row.brand,
  brandLogo: row.brand_logo,
  category: row.category,
  originalPriceVND: Number(row.original_price_vnd),
  currentPriceVND: Number(row.current_price_vnd),
  originalPriceUSD: Number(row.original_price_usd),
  currentPriceUSD: Number(row.current_price_usd),
  discountPercent: Number(row.discount_percent),
  instantDelivery: Boolean(row.instant_delivery),
  stockCount: Number(row.stock_count),
  badge: row.badge,
  platformSubtext: row.platform_subtext,
  quotaFeatures: typeof row.quota_features === 'string' ? JSON.parse(row.quota_features) : row.quota_features || [],
  specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs || {},
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Ensure database has initial seed products on launch
 */
export const ensureSeedProducts = async (): Promise<void> => {
  try {
    for (const prod of [...INITIAL_PRODUCTS, ...EXPANDED_PRODUCTS]) {
      await pool.query(
        `INSERT INTO products (
          id, slug, name, brand, brand_logo, category,
          original_price_vnd, current_price_vnd, original_price_usd, current_price_usd,
          discount_percent, instant_delivery, stock_count, badge, platform_subtext,
          quota_features, specs, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`,
        [
          prod.id,
          prod.slug,
          prod.name,
          prod.brand,
          prod.brandLogo,
          prod.category,
          prod.originalPriceVND,
          prod.currentPriceVND,
          prod.originalPriceUSD,
          prod.currentPriceUSD,
          prod.discountPercent,
          prod.instantDelivery,
          prod.stockCount,
          prod.badge,
          prod.platformSubtext,
          JSON.stringify(prod.quotaFeatures),
          JSON.stringify(prod.specs),
          true,
        ]
      );
    }
    const countRes = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');
    console.log(`[PostgreSQL] Catalog ready: ${countRes.rows[0].count} active products.`);
  } catch (err) {
    console.error('[PostgreSQL] Error seeding products:', err);
  }
};

/**
 * GET /api/products
 * Fetch all products (active by default, or all if ?all=true)
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const showAll = req.query.all === 'true';
    const query = showAll
      ? 'SELECT * FROM products ORDER BY created_at ASC'
      : 'SELECT * FROM products WHERE is_active = true ORDER BY created_at ASC';

    const result = await pool.query(query);
    const products = result.rows.map(formatProductRow);

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (err) {
    console.error('[ProductController] Error fetching products:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch the product list from the database.',
    });
  }
};

/**
 * GET /api/products/:slug
 * Fetch single product by slug
 */
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: `No product found with the code "${slug}".`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatProductRow(result.rows[0]),
    });
  } catch (err) {
    console.error('[ProductController] Error fetching product by slug:', err);
    res.status(500).json({
      success: false,
      message: 'Error while looking up the product.',
    });
  }
};

/**
 * POST /api/products (Admin only)
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      slug,
      brand,
      brandLogo,
      category,
      originalPriceVND,
      currentPriceVND,
      originalPriceUSD,
      currentPriceUSD,
      discountPercent,
      stockCount,
      badge,
      platformSubtext,
      quotaFeatures,
      specs,
      instantDelivery,
      isActive,
    } = req.body;

    if (!name || !slug || !brand || !category) {
      res.status(400).json({
        success: false,
        message: 'Please provide the product name, slug, brand and category.',
      });
      return;
    }

    // Check slug collision
    const existing = await pool.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: `Slug "${slug}" already exists. Please choose a different slug.`,
      });
      return;
    }

    const id = `prod_${slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const result = await pool.query(
      `INSERT INTO products (
        id, slug, name, brand, brand_logo, category,
        original_price_vnd, current_price_vnd, original_price_usd, current_price_usd,
        discount_percent, instant_delivery, stock_count, badge, platform_subtext,
        quota_features, specs, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        slug,
        name,
        brand,
        brandLogo || '/assets/logos/logo_brand_cursor.svg',
        category,
        Number(originalPriceVND) || 500000,
        Number(currentPriceVND) || 249000,
        Number(originalPriceUSD) || 20.0,
        Number(currentPriceUSD) || 9.99,
        Number(discountPercent) || 0,
        instantDelivery !== undefined ? Boolean(instantDelivery) : true,
        Number(stockCount) || 20,
        badge || '',
        platformSubtext || '',
        JSON.stringify(quotaFeatures || []),
        JSON.stringify(specs || {}),
        isActive !== undefined ? Boolean(isActive) : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'New product added to the database successfully!',
      data: formatProductRow(result.rows[0]),
    });
  } catch (err: any) {
    console.error('[ProductController] Error creating product:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error while creating the product in the database.',
    });
  }
};

/**
 * PUT /api/products/:id (Admin only)
 * Update existing product
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      brand,
      brandLogo,
      category,
      originalPriceVND,
      currentPriceVND,
      originalPriceUSD,
      currentPriceUSD,
      discountPercent,
      stockCount,
      badge,
      platformSubtext,
      quotaFeatures,
      specs,
      instantDelivery,
      isActive,
    } = req.body;

    const check = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product to update not found.',
      });
      return;
    }

    const current = check.rows[0];

    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        brand = COALESCE($3, brand),
        brand_logo = COALESCE($4, brand_logo),
        category = COALESCE($5, category),
        original_price_vnd = COALESCE($6, original_price_vnd),
        current_price_vnd = COALESCE($7, current_price_vnd),
        original_price_usd = COALESCE($8, original_price_usd),
        current_price_usd = COALESCE($9, current_price_usd),
        discount_percent = COALESCE($10, discount_percent),
        stock_count = COALESCE($11, stock_count),
        badge = COALESCE($12, badge),
        platform_subtext = COALESCE($13, platform_subtext),
        quota_features = COALESCE($14, quota_features),
        specs = COALESCE($15, specs),
        instant_delivery = COALESCE($16, instant_delivery),
        is_active = COALESCE($17, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *`,
      [
        name,
        slug,
        brand,
        brandLogo,
        category,
        originalPriceVND !== undefined ? Number(originalPriceVND) : null,
        currentPriceVND !== undefined ? Number(currentPriceVND) : null,
        originalPriceUSD !== undefined ? Number(originalPriceUSD) : null,
        currentPriceUSD !== undefined ? Number(currentPriceUSD) : null,
        discountPercent !== undefined ? Number(discountPercent) : null,
        stockCount !== undefined ? Number(stockCount) : null,
        badge,
        platformSubtext,
        quotaFeatures ? JSON.stringify(quotaFeatures) : null,
        specs ? JSON.stringify(specs) : null,
        instantDelivery !== undefined ? Boolean(instantDelivery) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data: formatProductRow(result.rows[0]),
    });
  } catch (err: any) {
    console.error('[ProductController] Error updating product:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error while updating the product.',
    });
  }
};

/**
 * DELETE /api/products/:id (Admin only)
 * Delete product from database
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id, name', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product to delete not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Product "${result.rows[0].name}" was deleted from the database successfully.`,
    });
  } catch (err: any) {
    console.error('[ProductController] Error deleting product:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error while deleting the product.',
    });
  }
};
