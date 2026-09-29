import { ApiCreditAccount, AiProviderId } from '@/types';

/**
 * KHO TÀI KHOẢN API KẸM SỐ DƯ CREDIT $
 * ---------------------------------------------------------------
 * Các tài khoản developer được "nạp sẵn" credit ($) để gọi API
 * của những nhà cung cấp model LLM lớn: OpenAI (ChatGPT),
 * Anthropic (Claude), Google (Gemini), DeepSeek, xAI (Grok),
 * Mistral, Cohere, Perplexity...
 *
 * Nguyên tắc định giá: Giá bán = Credit $ quy đổi VNĐ x (1 - discount)
 * Tỷ giá tham chiếu: 1 USD = 26.000 VND
 */

export const USD_TO_VND_RATE = 26000;

export const PROVIDER_META: Record<
  AiProviderId,
  { name: string; logo: string; color: string; website: string }
> = {
  openai: {
    name: 'OpenAI',
    logo: '/assets/logos/logo_brand_openai_chatgpt.svg',
    color: '#10B981',
    website: 'platform.openai.com',
  },
  anthropic: {
    name: 'Anthropic',
    logo: '/assets/logos/logo_brand_anthropic_claude.svg',
    color: '#D97757',
    website: 'console.anthropic.com',
  },
  google: {
    name: 'Google Gemini',
    logo: '/assets/logos/logo_brand_google_gemini.svg',
    color: '#4285F4',
    website: 'aistudio.google.com',
  },
  deepseek: {
    name: 'DeepSeek',
    logo: '/assets/logos/logo_brand_deepseek.svg',
    color: '#60A5FA',
    website: 'platform.deepseek.com',
  },
  xai: {
    name: 'xAI (Grok)',
    logo: '/assets/logos/logo_brand_grok.svg',
    color: '#9CA3AF',
    website: 'console.x.ai',
  },
  mistral: {
    name: 'Mistral AI',
    logo: '/assets/logos/logo_brand_mistral.svg',
    color: '#F59E0B',
    website: 'console.mistral.ai',
  },
  cohere: {
    name: 'Cohere',
    logo: '/assets/logos/logo_brand_cohere.svg',
    color: '#39594D',
    website: 'dashboard.cohere.com',
  },
  perplexity: {
    name: 'Perplexity',
    logo: '/assets/logos/logo_brand_perplexity.svg',
    color: '#20B8CD',
    website: 'perplexity.ai/pro-search',
  },
};

export const MOCK_API_CREDIT_ACCOUNTS: ApiCreditAccount[] = [
  // ================= OPENAI (ChatGPT / GPT Models) =================
  {
    id: 'credit_openai_20',
    slug: 'openai-api-credit-20',
    provider: 'openai',
    providerName: 'OpenAI',
    brandLogo: PROVIDER_META.openai.logo,
    discountPercent: 15,
    creditAmountUSD: 20,
    priceVND: 442000,
    stockCount: 38,
    instantDelivery: true,
    badge: '🌐 Popular',
    description:
      'Tài khoản OpenAI Platform nạp sẵn $20 credit, gọi trực tiếp GPT-4o / o3-mini qua API chính thức.',
    includedModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'DALL·E 3', 'Whisper'],
    validityMonths: 12,
    features: [
      'API Key riêng tư, binding IP tùy chọn',
      'Tier 1 — Giới hạn 10.000 RPM / 200K TPM',
      'Hóa đơn trừ dần theo token thực tế của OpenAI',
      'Hướng dẫn tích hợp SDK Python / Node.js',
    ],
  },
  {
    id: 'credit_openai_100',
    slug: 'openai-api-credit-100',
    provider: 'openai',
    providerName: 'OpenAI',
    brandLogo: PROVIDER_META.openai.logo,
    discountPercent: 20,
    creditAmountUSD: 100,
    priceVND: 2080000,
    stockCount: 15,
    instantDelivery: true,
    badge: '⚡ Best Value',
    description:
      'Tài khoản OpenAI Platform số dư $100 — đủ chạy dự án RAG / chatbot production vài tháng.',
    includedModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'GPT-4.5 Preview', 'Embeddings v3'],
    validityMonths: 12,
    features: [
      'Nâng Tier 2 tự động khi đủ điều kiện chi tiêu',
      'Batch API giảm 50% chi phí offline inference',
      'Bảo hành đối soát credit 7 ngày đầu',
      'Tặng template LangChain / LlamaIndex',
    ],
  },
  {
    id: 'credit_openai_500',
    slug: 'openai-api-credit-500',
    provider: 'openai',
    providerName: 'OpenAI',
    brandLogo: PROVIDER_META.openai.logo,
    discountPercent: 25,
    creditAmountUSD: 500,
    priceVND: 9750000,
    stockCount: 6,
    instantDelivery: true,
    badge: '🏢 Team / Startup',
    description:
      'Gói doanh nghiệp nhỏ: $500 credit OpenAI, quản lý tập trung qua Organization & Projects.',
    includedModels: ['gpt-4o', 'o3-mini', 'GPT-4.5 Preview', 'Realtime API', 'Fine-tuning'],
    validityMonths: 12,
    features: [
      'Organization Account — thêm thành viên & rate limit riêng',
      'Hỗ trợ cấu hình Zero Data Retention (ZDR) cho workload enterprise',
      'Báo cáo tiêu dùng hàng tuần qua Email / Webhook',
      'Ưu tiên hỗ trợ kỹ thuật 1-1 qua Telegram',
    ],
  },

  // ================= ANTHROPIC (Claude Models) =================
  {
    id: 'credit_anthropic_25',
    slug: 'anthropic-api-credit-25',
    provider: 'anthropic',
    providerName: 'Anthropic',
    brandLogo: PROVIDER_META.anthropic.logo,
    discountPercent: 15,
    creditAmountUSD: 25,
    priceVND: 552000,
    stockCount: 27,
    instantDelivery: true,
    badge: '🧠 Coding Favorite',
    description:
      'Tài khoản Anthropic Console nạp sẵn $25 credit để gọi Claude 3.7 Sonnet / 3.5 Haiku qua API.',
    includedModels: ['claude-3-7-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
    validityMonths: 12,
    features: [
      'API Key sạch, chưa từng sử dụng (brand-new)',
      'Hỗ trợ Extended Thinking & Vision input',
      'Tích hợp ngay vào Cursor / Cline / Continue.dev',
      'Level 1 → Level 2 auto-upgrade theo spend',
    ],
  },
  {
    id: 'credit_anthropic_100',
    slug: 'anthropic-api-credit-100',
    provider: 'anthropic',
    providerName: 'Anthropic',
    brandLogo: PROVIDER_META.anthropic.logo,
    discountPercent: 22,
    creditAmountUSD: 100,
    priceVND: 2028000,
    stockCount: 12,
    instantDelivery: true,
    badge: '🔥 Hot Stock',
    description:
      '$100 credit Anthropic — thoải mái test Claude Code, Agent SDK và pipeline prompt dài.',
    includedModels: ['claude-3-7-sonnet', 'claude-3.5-sonnet', 'claude-3-5-haiku'],
    validityMonths: 12,
    features: [
      'Prompt Caching giảm tới 90% chi phí context lặp lại',
      'Giới hạn 50K input tokens / request (Level 2+)',
      'Đối soát số dư trực tiếp trên Console',
      'Hướng dẫn bật Usage Policy cho workload production',
    ],
  },

  // ================= GOOGLE (Gemini API) =================
  {
    id: 'credit_google_50',
    slug: 'google-gemini-credit-50',
    provider: 'google',
    providerName: 'Google Cloud Vertex AI',
    brandLogo: PROVIDER_META.google.logo,
    discountPercent: 18,
    creditAmountUSD: 50,
    priceVND: 1066000,
    stockCount: 33,
    instantDelivery: true,
    badge: '💰 Free Tier + Credit',
    description:
      'Tài khoản Google AI Studio / Vertex AI kèm $50 credit — gọi Gemini 2.0 Flash & Pro với context 1M tokens.',
    includedModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'Imagen 3', 'Text Embedding GC0'],
    validityMonths: 12,
    features: [
      'Kèm $300 GCP free credit cho project mới (nếu đủ điều kiện)',
      'Grounding with Google Search tích hợp sẵn',
      'Rate limit cao hơn free tier 10 lần',
      'Xuất billing cảnh báo khi gần hết credit',
    ],
  },
  {
    id: 'credit_google_200',
    slug: 'google-gemini-credit-200',
    provider: 'google',
    providerName: 'Google Cloud Vertex AI',
    brandLogo: PROVIDER_META.google.logo,
    discountPercent: 25,
    creditAmountUSD: 200,
    priceVND: 3900000,
    stockCount: 9,
    instantDelivery: true,
    badge: '🏢 Enterprise Ready',
    description:
      'Gói $200 credit trên project Google Cloud có service account, phù hợp hệ thống production.',
    includedModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'Veo 2 (video)', 'Imagen 3'],
    validityMonths: 12,
    features: [
      'Service Account JSON key cho backend server-to-server',
      'Bật quota tăng tốc (Quota Increase) hỗ trợ thủ tục',
      'Logging & monitoring qua Cloud Console',
      'Cam kết không dùng dữ liệu để train model',
    ],
  },

  // ================= DEEPSEEK =================
  {
    id: 'credit_deepseek_20',
    slug: 'deepseek-api-credit-20',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    brandLogo: PROVIDER_META.deepseek.logo,
    discountPercent: 12,
    creditAmountUSD: 20,
    priceVND: 457000,
    stockCount: 52,
    instantDelivery: true,
    badge: '🚀 R1 Reasoning',
    description:
      'Tài khoản DeepSeek Platform $20 credit — DeepSeek-R1 / V3 giá chỉ bằng ~3-5% so với GPT-4o.',
    includedModels: ['deepseek-reasoner (R1)', 'deepseek-chat (V3)'],
    validityMonths: 12,
    features: [
      'Giá token cực rẻ: $0.27/M input (cache hit)',
      'Throughput 60+ tokens/giây ổn định',
      'Tương thích 100% OpenAI SDK (chỉ đổi baseURL)',
      'Không yêu cầu thẻ quốc tế để giữ tài khoản',
    ],
  },
  {
    id: 'credit_deepseek_100',
    slug: 'deepseek-api-credit-100',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    brandLogo: PROVIDER_META.deepseek.logo,
    discountPercent: 20,
    creditAmountUSD: 100,
    priceVND: 2080000,
    stockCount: 21,
    instantDelivery: true,
    badge: '⚡ Bulk Deal',
    description:
      '$100 credit DeepSeek — chạy khối lượng lớn reasoning R1 cho dataset, eval và fine-tune data.',
    includedModels: ['deepseek-reasoner (R1)', 'deepseek-chat (V3)'],
    validityMonths: 12,
    features: [
      'Đủ dùng ~2 tỷ tokens output (ước tính)',
      'Thích hợp pipeline synthetic data / distillation',
      'Theo dõi chi tiêu real-time trên platform',
      'Hỗ trợ cấu hình ReAct agent với R1',
    ],
  },

  // ================= XAI (GROK) =================
  {
    id: 'credit_xai_50',
    slug: 'xai-grok-api-credit-50',
    provider: 'xai',
    providerName: 'xAI',
    brandLogo: PROVIDER_META.xai.logo,
    discountPercent: 15,
    creditAmountUSD: 50,
    priceVND: 1105000,
    stockCount: 17,
    instantDelivery: true,
    badge: '📡 Realtime X Data',
    description:
      'Tài khoản xAI Console $50 credit truy cập Grok-2 / Grok-3 với live search trên nền tảng X.',
    includedModels: ['grok-3', 'grok-3-mini', 'grok-2-vision'],
    validityMonths: 12,
    features: [
      'Live Search & X Dataset grounding',
      'Function calling & JSON mode chuẩn OpenAI-compatible',
      'Reasoning mode với chain-of-thought mở',
      'Bảo hành key lỗi 1-đổi-1 trong 30 ngày',
    ],
  },

  // ================= MISTRAL =================
  {
    id: 'credit_mistral_30',
    slug: 'mistral-api-credit-30',
    provider: 'mistral',
    providerName: 'Mistral AI',
    brandLogo: PROVIDER_META.mistral.logo,
    discountPercent: 16,
    creditAmountUSD: 30,
    priceVND: 655000,
    stockCount: 24,
    instantDelivery: true,
    badge: '🇪🇺 EU Privacy',
    description:
      'Tài khoản La Plateforme (Mistral) $30 credit — model mã nguồn mở hiệu năng cao, tuân thủ EU AI Act.',
    includedModels: ['mistral-large-2', 'mistral-small', 'codestral-mamba', 'pixtral-12b'],
    validityMonths: 12,
    features: [
      'Dữ liệu lưu tại EU — phù hợp GDPR',
      'Vision input với Pixtral 12B',
      'Codestral tối ưu autocomplete 128K context',
      'La Plateforme API tương thích OpenAI schema',
    ],
  },

  // ================= COHERE =================
  {
    id: 'credit_cohere_25',
    slug: 'cohere-api-credit-25',
    provider: 'cohere',
    providerName: 'Cohere',
    brandLogo: PROVIDER_META.cohere.logo,
    discountPercent: 14,
    creditAmountUSD: 25,
    priceVND: 546000,
    stockCount: 19,
    instantDelivery: true,
    badge: '🔎 RAG Specialist',
    description:
      'Tài khoản Cohere Platform $25 credit — Command R+ & Embed mạnh nhất cho retrieval / RAG doanh nghiệp.',
    includedModels: ['command-r-plus', 'command-r', 'embed-v3.0', 'rerank-v3.5'],
    validityMonths: 12,
    features: [
      'Tool-use / function calling bản địa',
      'Multilingual 10+ ngôn ngữ (có Tiếng Việt)',
      'Rerank model cải thiện độ chính xác RAG',
      'Trial key chuyển sang production billing',
    ],
  },

  // ================= PERPLEXITY =================
  {
    id: 'credit_perplexity_20',
    slug: 'perplexity-sonar-api-credit-20',
    provider: 'perplexity',
    providerName: 'Perplexity',
    brandLogo: PROVIDER_META.perplexity.logo,
    discountPercent: 12,
    creditAmountUSD: 20,
    priceVND: 478000,
    stockCount: 30,
    instantDelivery: true,
    badge: '🌊 Search-Grounded',
    description:
      'Tài khoản Perplexity API $20 credit — mô hình Sonar trả lời kèm trích dẫn nguồn thời gian thực.',
    includedModels: ['sonar', 'sonar-pro', 'sonar-reasoning'],
    validityMonths: 12,
    features: [
      'Citations tự động trong mọi response',
      'Web search realtime giá thấp hơn GPT browsing',
      'Thích hợp build chatbot tra cứu tin tức / giá',
      'SDK mẫu Python nhúng nhanh vào app',
    ],
  },
];

/** Tổng số tài khoản đang có sẵn trong kho (cộng dồn stockCount) */
export const getTotalStock = (list: ApiCreditAccount[] = MOCK_API_CREDIT_ACCOUNTS): number =>
  list.reduce((sum, acc) => sum + acc.stockCount, 0);

/** Quy đổi credit $ sang giá VNĐ niêm yết */
export const usdToVnd = (usd: number): number => Math.round(usd * USD_TO_VND_RATE);

/** Tính giá sau giảm giá: creditUSD * tỷ giá * (1 - discount) */
export const computeListPriceVND = (creditUSD: number, discountPercent: number): number =>
  Math.round(usdToVnd(creditUSD) * (1 - discountPercent / 100));
