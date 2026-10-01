import { pool } from '../config/db.js';
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
        currentPriceVND: 249000,
        originalPriceUSD: 20.0,
        currentPriceUSD: 9.99,
        discountPercent: 50,
        instantDelivery: true,
        stockCount: 42,
        badge: '🔥 Khuyên Dùng Cho Dev',
        platformSubtext: 'VS Code Fork, Windows / macOS / Linux',
        quotaFeatures: [
            '500 Fast Premium Requests / tháng',
            'Claude 3.7 Sonnet & GPT-4o không giới hạn',
            'Tùy chọn: Mail cấp sẵn hoặc Nâng chính chủ',
            'Bảo hành 1-đổi-1 tự động trong 30-90 ngày',
        ],
        specs: {
            fastQuota: '500 Fast Requests/mo',
            contextWindow: '200K Tokens',
            models: 'Claude 3.7 Sonnet, GPT-4.5, o3-mini',
            multiDevice: 'Đồng bộ 3 thiết bị cùng lúc',
        },
    },
    {
        id: 'prod_claude_pro',
        slug: 'claude-pro',
        name: 'Claude Pro',
        brand: 'Anthropic',
        brandLogo: '/assets/logos/logo_brand_anthropic_claude.svg',
        category: 'llm',
        originalPriceVND: 550000,
        currentPriceVND: 289000,
        originalPriceUSD: 22.0,
        currentPriceUSD: 11.5,
        discountPercent: 48,
        instantDelivery: true,
        stockCount: 18,
        badge: '⚡ Sonnet 3.7 Ready',
        platformSubtext: 'Web Interface, Claude Desktop, Artifacts',
        quotaFeatures: [
            'Claude 3.7 Sonnet với Extended Thinking 64K',
            'Giới hạn request cao gấp 5x so với Free',
            'Hỗ trợ Claude Projects & Artifacts tương tác',
            'Kích hoạt email chính chủ hoặc cấp sẵn',
        ],
        specs: {
            fastQuota: 'Gấp 5x mức Free (~45 msg / 5 hours)',
            contextWindow: '200K Tokens Context Window',
            models: 'Claude 3.7 Sonnet, Claude 3.5 Haiku',
            multiDevice: 'Web & Desktop App đồng bộ',
        },
    },
    {
        id: 'prod_chatgpt_plus',
        slug: 'chatgpt-plus',
        name: 'ChatGPT Plus',
        brand: 'OpenAI',
        brandLogo: '/assets/logos/logo_brand_openai_chatgpt.svg',
        category: 'llm',
        originalPriceVND: 520000,
        currentPriceVND: 275000,
        originalPriceUSD: 20.0,
        currentPriceUSD: 10.9,
        discountPercent: 47,
        instantDelivery: true,
        stockCount: 25,
        badge: 'GPT-4.5 & Canvas',
        platformSubtext: 'Web, iOS, Android, macOS & Windows App',
        quotaFeatures: [
            'Truy cập GPT-4o, GPT-4.5 & Mô hình o3-mini',
            'Tính năng Canvas lập trình & viết lách chuyên sâu',
            'Advanced Voice Mode giọng nói tự nhiên',
            'DALL-E 3 tạo ảnh & Web Search thời gian thực',
        ],
        specs: {
            fastQuota: '80 msgs / 3 hours với GPT-4o',
            contextWindow: '128K Tokens',
            models: 'GPT-4.5 Preview, GPT-4o, o3-mini',
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
        originalPriceVND: 260000,
        currentPriceVND: 149000,
        originalPriceUSD: 10.0,
        currentPriceUSD: 5.9,
        discountPercent: 41,
        instantDelivery: true,
        stockCount: 36,
        badge: 'Native IDE Plugin',
        platformSubtext: 'VS Code, JetBrains, Visual Studio, Neovim',
        quotaFeatures: [
            'Gợi ý code thời gian thực inline autocomplete',
            'Copilot Chat trong IDE giải thích & refactor',
            'Tùy chọn model GPT-4o, Claude 3.5 Sonnet',
            'Nâng trực tiếp trên tài khoản GitHub cá nhân',
        ],
        specs: {
            fastQuota: 'Không giới hạn Autocomplete code',
            contextWindow: 'Toàn bộ Workspace codebase',
            models: 'Claude 3.5 Sonnet, GPT-4o',
            multiDevice: 'Đồng bộ qua tài khoản GitHub',
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
        currentPriceVND: 389000,
        originalPriceUSD: 30.0,
        currentPriceUSD: 15.5,
        discountPercent: 48,
        instantDelivery: true,
        stockCount: 14,
        badge: '15h Fast GPU',
        platformSubtext: 'Discord Bot & Web Gallery Creator',
        quotaFeatures: [
            '15 giờ tạo ảnh Fast GPU mỗi tháng',
            'Tạo ảnh Relax GPU không giới hạn',
            'Quyền thương mại toàn bộ tác phẩm tạo ra',
            'Tài khoản Discord cấp sẵn riêng tư 100%',
        ],
        specs: {
            fastQuota: '15 Fast GPU Hours / mo',
            contextWindow: 'Model v6.1 & Niji 6',
            models: 'Midjourney v6.1 High Definition',
            multiDevice: 'Discord Server riêng',
        },
    },
    {
        id: 'prod_jetbrains_ai',
        slug: 'jetbrains-ai',
        name: 'JetBrains AI Assistant',
        brand: 'JetBrains',
        brandLogo: '/assets/logos/logo_brand_jetbrains.svg',
        category: 'coding',
        originalPriceVND: 480000,
        currentPriceVND: 259000,
        originalPriceUSD: 18.0,
        currentPriceUSD: 10.5,
        discountPercent: 46,
        instantDelivery: true,
        stockCount: 22,
        badge: 'IntelliJ / WebStorm',
        platformSubtext: 'IntelliJ IDEA, PyCharm, WebStorm, PhpStorm',
        quotaFeatures: [
            'Tích hợp native vào hệ sinh thái JetBrains IDEs',
            'Tự động viết Unit Test & Documentation',
            'Hỗ trợ Refactoring và phân tích runtime error',
            'Bàn giao key kích hoạt JetBrains Account',
        ],
        specs: {
            fastQuota: 'Không giới hạn hạn ngạch tiêu chuẩn',
            contextWindow: 'Phân tích toàn bộ project AST',
            models: 'Mellona AI & OpenAI models',
            multiDevice: 'Kích hoạt qua JetBrains Hub',
        },
    },
    {
        id: 'prod_gemini_advanced',
        slug: 'gemini-advanced',
        name: 'Google Gemini Advanced',
        brand: 'Google DeepMind',
        brandLogo: '/assets/logos/logo_brand_google_gemini.svg',
        category: 'llm',
        originalPriceVND: 490000,
        currentPriceVND: 239000,
        originalPriceUSD: 20.0,
        currentPriceUSD: 9.5,
        discountPercent: 52,
        instantDelivery: true,
        stockCount: 30,
        badge: '1M Context Window',
        platformSubtext: 'Web, Google Workspace (Docs, Gmail)',
        quotaFeatures: [
            'Cửa sổ ngữ cảnh khổng lồ 1.000.000 tokens',
            'Gemini 1.5 Pro phân tích file tài liệu và video lớn',
            'Tích hợp sẵn vào Google Docs, Sheets, Gmail',
            'Kèm 2TB Google Drive lưu trữ bảo mật',
        ],
        specs: {
            fastQuota: 'Tốc độ ưu tiên mô hình 1.5 Pro',
            contextWindow: '1.000.000 Tokens (1 Hour Video / 700K Words)',
            models: 'Gemini 1.5 Pro & Gemini 2.0 Flash',
            multiDevice: 'Toàn bộ thiết bị Google Account',
        },
    },
    {
        id: 'prod_claude_team',
        slug: 'claude-team-seat',
        name: 'Claude Team Workspace',
        brand: 'Anthropic',
        brandLogo: '/assets/logos/logo_brand_anthropic_claude.svg',
        category: 'enterprise',
        originalPriceVND: 1200000,
        currentPriceVND: 599000,
        originalPriceUSD: 50.0,
        currentPriceUSD: 24.0,
        discountPercent: 50,
        instantDelivery: true,
        stockCount: 8,
        badge: '🏢 Doanh Nghiệp',
        platformSubtext: 'Dedicated Workspace cho Team Dev / Startup',
        quotaFeatures: [
            'Hạn ngạch cao hơn gói Claude Pro thông thường',
            'Chia sẻ Custom Prompt Templates nội bộ team',
            'Quản lý quyền Admin, bảo mật SOC 2 Type II',
            'Cam kết không dùng dữ liệu code để huấn luyện AI',
        ],
        specs: {
            fastQuota: 'Gấp 2x gói Pro (~90 msg / 5 hours)',
            contextWindow: '200K Tokens Context Window',
            models: 'Claude 3.7 Sonnet & Extended Thinking',
            multiDevice: 'Quản lý tập trung qua Team Console',
        },
    },
    {
        id: 'prod_perplexity_pro',
        slug: 'perplexity-pro',
        name: 'Perplexity Pro',
        brand: 'Perplexity AI',
        brandLogo: '/assets/logos/logo_brand_perplexity.svg',
        category: 'search',
        originalPriceVND: 480000,
        currentPriceVND: 199000,
        originalPriceUSD: 20.0,
        currentPriceUSD: 7.99,
        discountPercent: 58,
        instantDelivery: true,
        stockCount: 35,
        badge: '🔍 Deep Research 2026',
        platformSubtext: 'Web, iOS, Android, Mac & Chrome Extension',
        quotaFeatures: [
            '300+ Pro Search / ngày với Claude 3.7 & GPT-4o',
            'Tính năng Deep Research tự động phân tích 100+ nguồn',
            'Upload file PDF, Code, Dataset phân tích không giới hạn',
            'Tặng $5 API credit mỗi tháng dùng cho Developers',
        ],
        specs: {
            fastQuota: '300+ Pro Queries/day',
            contextWindow: '128K Tokens',
            models: 'Sonar Large, Claude 3.7 Sonnet, o3-mini',
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
        originalPriceVND: 490000,
        currentPriceVND: 249000,
        originalPriceUSD: 20.0,
        currentPriceUSD: 9.99,
        discountPercent: 49,
        instantDelivery: true,
        stockCount: 20,
        badge: '⚡ React / Tailwind UI',
        platformSubtext: 'In-Browser Fullstack UI Code Generator',
        quotaFeatures: [
            '5.000 Credits tạo component React / Next.js / Tailwind',
            '1-Click Export mã nguồn sang GitHub hoặc CodeSandbox',
            'Chỉnh sửa UI trực quan bằng ngôn ngữ tự nhiên',
            'Nâng chính chủ vào tài khoản Vercel cá nhân',
        ],
        specs: {
            fastQuota: '5000 Premium Credits/mo',
            contextWindow: 'Full Next.js / Shadcn Codebases',
            models: 'v0-large, Claude 3.7 Sonnet',
            multiDevice: 'Web Browser tích hợp Vercel',
        },
    },
    {
        id: 'prod_deepseek_r1',
        slug: 'deepseek-r1-pro',
        name: 'DeepSeek R1 Pro Suite',
        brand: 'DeepSeek AI',
        brandLogo: '/assets/logos/logo_brand_deepseek.svg',
        category: 'llm',
        originalPriceVND: 350000,
        currentPriceVND: 159000,
        originalPriceUSD: 15.0,
        currentPriceUSD: 6.5,
        discountPercent: 54,
        instantDelivery: true,
        stockCount: 45,
        badge: '🧠 Open Reasoning #1',
        platformSubtext: 'Web Interface & Dedicated API Access',
        quotaFeatures: [
            'Sức mạnh lý luận toán & coding ngang ngửa OpenAI o1',
            'Tốc độ sinh token siêu tốc 60+ tokens/giây',
            'Không giới hạn tin nhắn tiêu chuẩn trong ngày',
            'Tài khoản cấp sẵn bảo mật hoặc API Dedicated Key',
        ],
        specs: {
            fastQuota: 'Không giới hạn tiêu chuẩn',
            contextWindow: '64K Tokens Context',
            models: 'DeepSeek-R1 671B Full Parameter',
            multiDevice: 'Web App & API Endpoint',
        },
    },
    {
        id: 'prod_grok_super',
        slug: 'grok-super-pro',
        name: 'xAI Grok 2 & 3 Heavy',
        brand: 'xAI (Elon Musk)',
        brandLogo: '/assets/logos/logo_brand_grok.svg',
        category: 'llm',
        originalPriceVND: 600000,
        currentPriceVND: 299000,
        originalPriceUSD: 25.0,
        currentPriceUSD: 11.99,
        discountPercent: 50,
        instantDelivery: true,
        stockCount: 16,
        badge: '🚀 Dữ Liệu Realtime X',
        platformSubtext: 'Web, Mobile & X Premium+ Suite',
        quotaFeatures: [
            'Mô hình Grok 3 siêu máy tính Colossus 100K H100',
            'Truy vấn tin tức & dữ liệu nóng thời gian thực trên X',
            'Tạo ảnh siêu thực không kiểm duyệt qua Aurora Image Gen',
            'Kèm huy hiệu xác minh X Verified tài khoản',
        ],
        specs: {
            fastQuota: 'Không giới hạn truy vấn Grok',
            contextWindow: '128K Tokens',
            models: 'Grok 3 Heavy & Grok 2 Vision',
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
        currentPriceVND: 279000,
        originalPriceUSD: 22.0,
        currentPriceUSD: 11.0,
        discountPercent: 49,
        instantDelivery: true,
        stockCount: 24,
        badge: '🎙️ Voice Clone #1',
        platformSubtext: 'Studio Web, Voice Lab, API Access',
        quotaFeatures: [
            '100.000 ký tự lồng tiếng Studio chất lượng cao/tháng',
            'Tạo giọng đọc sao chép (Instant Voice Cloning) cực chân thực',
            'Hỗ trợ 32+ ngôn ngữ tự nhiên bao gồm tiếng Việt',
            'Quyền thương mại toàn bộ file âm thanh xuất ra',
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
        originalPriceVND: 400000,
        currentPriceVND: 189000,
        originalPriceUSD: 16.0,
        currentPriceUSD: 7.5,
        discountPercent: 52,
        instantDelivery: true,
        stockCount: 30,
        badge: '🎵 Tạo Nhạc v4',
        platformSubtext: 'Web & Mobile App Creator',
        quotaFeatures: [
            '2.500 Credits mỗi tháng (~500 bài hát hoàn chỉnh)',
            'Model Suno v4 âm thanh stereo chuẩn studio',
            'Sở hữu quyền thương mại tải lên Spotify / YouTube',
            'Nâng cấp trực tiếp trên email hoặc cấp sẵn',
        ],
        specs: {
            fastQuota: '2500 Credits/mo (500 Songs)',
            contextWindow: 'Full Song (4 Minutes+)',
            models: 'Suno v4 Studio Stereo',
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
        originalPriceVND: 700000,
        currentPriceVND: 349000,
        originalPriceUSD: 30.0,
        currentPriceUSD: 13.99,
        discountPercent: 50,
        instantDelivery: true,
        stockCount: 12,
        badge: '⚡ AI Fullstack Builder',
        platformSubtext: 'Web Interface, GitHub Sync, Supabase',
        quotaFeatures: [
            'Xây dựng Web App hoàn chỉnh từ ý tưởng trong 60 giây',
            'Tích hợp native database Supabase & Authentication',
            'Đồng bộ 2 chiều với GitHub Repository',
            'Không giới hạn deploy lên custom domain',
        ],
        specs: {
            fastQuota: '100+ Fullstack Prompts/day',
            contextWindow: 'Full Project Architecture',
            models: 'Lovable Code Engine + Claude 3.7',
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
        originalPriceVND: 520000,
        currentPriceVND: 259000,
        originalPriceUSD: 20.0,
        currentPriceUSD: 10.5,
        discountPercent: 50,
        instantDelivery: true,
        stockCount: 22,
        badge: '💻 WebContainers VM',
        platformSubtext: 'Fullstack Browser Node.js Dev Environment',
        quotaFeatures: [
            '10 Triệu Tokens tạo code fullstack in-browser mỗi tháng',
            'Chạy trực tiếp Node.js, Vite, Next.js trong trình duyệt',
            '1-Click Deploy lên Netlify / Cloudflare Pages',
            'Bàn giao tài khoản cấp sẵn hoặc nâng email chính chủ',
        ],
        specs: {
            fastQuota: '10M Tokens/mo',
            contextWindow: '128K Tokens Context',
            models: 'Claude 3.7 Sonnet & GPT-4o',
            multiDevice: 'Web Browser',
        },
    },
];
// Helper to convert database snake_case row to frontend camelCase object
export const formatProductRow = (row) => ({
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
export const ensureSeedProducts = async () => {
    try {
        for (const prod of INITIAL_PRODUCTS) {
            await pool.query(`INSERT INTO products (
          id, slug, name, brand, brand_logo, category,
          original_price_vnd, current_price_vnd, original_price_usd, current_price_usd,
          discount_percent, instant_delivery, stock_count, badge, platform_subtext,
          quota_features, specs, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`, [
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
            ]);
        }
        const countRes = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');
        console.log(`[PostgreSQL] Catalog ready: ${countRes.rows[0].count} active products.`);
    }
    catch (err) {
        console.error('[PostgreSQL] Error seeding products:', err);
    }
};
/**
 * GET /api/products
 * Fetch all products (active by default, or all if ?all=true)
 */
export const getAllProducts = async (req, res) => {
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
    }
    catch (err) {
        console.error('[ProductController] Error fetching products:', err);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách sản phẩm từ cơ sở dữ liệu.',
        });
    }
};
/**
 * GET /api/products/:slug
 * Fetch single product by slug
 */
export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE slug = $1', [slug]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: `Không tìm thấy sản phẩm với mã "${slug}".`,
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: formatProductRow(result.rows[0]),
        });
    }
    catch (err) {
        console.error('[ProductController] Error fetching product by slug:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tra cứu sản phẩm.',
        });
    }
};
/**
 * POST /api/products (Admin only)
 * Create a new product
 */
export const createProduct = async (req, res) => {
    try {
        const { name, slug, brand, brandLogo, category, originalPriceVND, currentPriceVND, originalPriceUSD, currentPriceUSD, discountPercent, stockCount, badge, platformSubtext, quotaFeatures, specs, instantDelivery, isActive, } = req.body;
        if (!name || !slug || !brand || !category) {
            res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ tên, slug, thương hiệu và danh mục sản phẩm.',
            });
            return;
        }
        // Check slug collision
        const existing = await pool.query('SELECT id FROM products WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            res.status(400).json({
                success: false,
                message: `Slug "${slug}" đã tồn tại. Vui lòng chọn slug khác.`,
            });
            return;
        }
        const id = `prod_${slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
        const result = await pool.query(`INSERT INTO products (
        id, slug, name, brand, brand_logo, category,
        original_price_vnd, current_price_vnd, original_price_usd, current_price_usd,
        discount_percent, instant_delivery, stock_count, badge, platform_subtext,
        quota_features, specs, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`, [
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
        ]);
        res.status(201).json({
            success: true,
            message: 'Thêm sản phẩm mới vào cơ sở dữ liệu thành công!',
            data: formatProductRow(result.rows[0]),
        });
    }
    catch (err) {
        console.error('[ProductController] Error creating product:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi tạo sản phẩm trong cơ sở dữ liệu.',
        });
    }
};
/**
 * PUT /api/products/:id (Admin only)
 * Update existing product
 */
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, brand, brandLogo, category, originalPriceVND, currentPriceVND, originalPriceUSD, currentPriceUSD, discountPercent, stockCount, badge, platformSubtext, quotaFeatures, specs, instantDelivery, isActive, } = req.body;
        const check = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm cần cập nhật.',
            });
            return;
        }
        const current = check.rows[0];
        const result = await pool.query(`UPDATE products SET
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
      RETURNING *`, [
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
        ]);
        res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công!',
            data: formatProductRow(result.rows[0]),
        });
    }
    catch (err) {
        console.error('[ProductController] Error updating product:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi cập nhật sản phẩm.',
        });
    }
};
/**
 * DELETE /api/products/:id (Admin only)
 * Delete product from database
 */
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id, name', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm để xóa.',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: `Đã xóa thành công sản phẩm "${result.rows[0].name}" khỏi cơ sở dữ liệu.`,
        });
    }
    catch (err) {
        console.error('[ProductController] Error deleting product:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi xóa sản phẩm.',
        });
    }
};
