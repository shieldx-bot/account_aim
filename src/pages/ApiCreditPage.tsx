import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiCreditAccount, AiProviderId, ProductPlan, DurationOption } from '@/types';
import { MOCK_API_CREDIT_ACCOUNTS, PROVIDER_META, getTotalStock } from '@/data/mockApiCreditAccounts';
import { ApiCreditCard } from '@/components/api-credit/ApiCreditCard';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/utils/telemetry';
import {
  Zap,
  ShieldCheck,
  Headphones,
  ChevronRight,
  ChevronDown,
  Search,
  RotateCcw,
  KeyRound,
  Boxes,
  ArrowRight,
  HelpCircle,
  Wallet,
  Sparkles,
} from 'lucide-react';

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'credit_desc' | 'stock';

const PROVIDER_FILTERS: { id: AiProviderId | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả nhà cung cấp' },
  { id: 'openai', label: 'OpenAI (ChatGPT)' },
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'google', label: 'Google Gemini' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'xai', label: 'xAI (Grok)' },
  { id: 'mistral', label: 'Mistral AI' },
  { id: 'cohere', label: 'Cohere' },
  { id: 'perplexity', label: 'Perplexity' },
];

/**
 * Trang "Kho Tài Khoản API Credit $" — cung cấp các tài khoản developer
 * có sẵn số dư credit ($) để gọi model API của những nhà cung cấp lớn:
 * OpenAI, Anthropic, Google, DeepSeek, xAI, Mistral, Cohere, Perplexity.
 * Hiển thị rõ: mức credit $, đơn giá, và SỐ LƯỢNG TÀI KHOẢN kèm MỨC GIÁ.
 */
export const ApiCreditPage: React.FC = () => {
  const { addItem, openCart } = useCart();
  const [activeProvider, setActiveProvider] = useState<AiProviderId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Tài Khoản API Credit $ — OpenAI, Claude, Gemini, DeepSeek | AIPro.dev';
  }, []);

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_API_CREDIT_ACCOUNTS.length };
    MOCK_API_CREDIT_ACCOUNTS.forEach((a) => {
      counts[a.provider] = (counts[a.provider] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredAccounts = useMemo(() => {
    const list = MOCK_API_CREDIT_ACCOUNTS.filter((acc) => {
      const matchProvider = activeProvider === 'all' || acc.provider === activeProvider;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        acc.providerName.toLowerCase().includes(q) ||
        acc.description.toLowerCase().includes(q) ||
        acc.includedModels.some((m) => m.toLowerCase().includes(q)) ||
        `$${acc.creditAmountUSD}`.includes(q);
      return matchProvider && matchSearch;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.priceVND - b.priceVND;
        case 'price_desc':
          return b.priceVND - a.priceVND;
        case 'credit_desc':
          return b.creditAmountUSD - a.creditAmountUSD;
        case 'stock':
          return b.stockCount - a.stockCount;
        case 'popular':
        default:
          return 0;
      }
    });
  }, [activeProvider, searchQuery, sortBy]);

  const totalStock = useMemo(() => getTotalStock(), []);
  const totalCreditAvailable = useMemo(
    () =>
      MOCK_API_CREDIT_ACCOUNTS.reduce(
        (sum, a) => sum + a.creditAmountUSD * a.stockCount,
        0
      ),
    []
  );

  const handleAddToCart = (account: ApiCreditAccount) => {
    // Chuyển đổi tài khoản credit thành ProductPlan để tái sử dụng giỏ hàng / checkout hiện có
    const asProduct: ProductPlan = {
      id: account.id,
      slug: account.slug,
      name: `${account.providerName} API — $${account.creditAmountUSD} Credit`,
      brand: account.providerName,
      brandLogo: account.brandLogo,
      category: 'api-credit',
      originalPriceVND: Math.round(account.creditAmountUSD * 26000),
      currentPriceVND: account.priceVND,
      originalPriceUSD: account.creditAmountUSD,
      currentPriceUSD: Number(((account.priceVND / 26000) as number).toFixed(2)),
      discountPercent: account.discountPercent,
      instantDelivery: account.instantDelivery,
      stockCount: account.stockCount,
      badge: account.badge,
      platformSubtext: `API Credit Account • Hạn ${account.validityMonths} tháng`,
      quotaFeatures: account.features,
      specs: {
        fastQuota: `$${account.creditAmountUSD} credit có sẵn`,
        contextWindow: account.includedModels.slice(0, 2).join(', '),
        models: account.includedModels.join(', '),
        multiDevice: 'API Key dùng cho mọi thiết bị / server',
      },
    };

    const duration: DurationOption = {
      months: account.validityMonths,
      label: `${account.validityMonths} Tháng`,
      discountPercent: account.discountPercent,
      monthlyEquivalentVND: Math.round(account.priceVND / account.validityMonths),
      monthlyEquivalentUSD: Number((account.priceVND / 26000 / account.validityMonths).toFixed(2)),
    };

    addItem({
      product: asProduct,
      duration,
      provisioningType: 'pre_created',
      targetEmail: '',
      quantity: 1,
      unitPriceVND: account.priceVND,
      unitPriceUSD: account.priceVND / 26000,
    });

    trackEvent('add_to_cart', {
      item_id: account.slug,
      item_name: asProduct.name,
      price: account.priceVND,
      currency: 'VND',
    });

    openCart();
  };

  const clearFilters = () => {
    setActiveProvider('all');
    setSearchQuery('');
    setSortBy('popular');
  };

  const FAQS = [
    {
      q: 'Tài khoản API credit $ khác gì so với gói subscription (Plus/Pro)?',
      a: 'Gói subscription (ChatGPT Plus, Claude Pro...) dùng cho giao diện chat cá nhân. Còn tài khoản API credit là tài khoản developer trên nền tảng chính thức của nhà cung cấp (platform.openai.com, console.anthropic.com, aistudio.google.com, platform.deepseek.com...), được nạp sẵn số dư $ để bạn gọi model qua API key — tính phí theo token thực tế, phù hợp lập trình ứng dụng, chatbot, RAG, pipeline dữ liệu.',
    },
    {
      q: 'Số lượng tài khoản và mức giá được niêm yết như thế nào?',
      a: 'Mỗi thẻ sản phẩm hiển thị rõ SỐ LƯỢNG tài khoản còn khả dụng (stockCount, cập nhật thời gian thực từ kho) và MỨC GIÁ bán ra theo công thức: Credit $ × tỷ giá tham chiếu 26.000đ/USD × (1 − % giảm giá). Giá càng rẻ hơn face-value khi mua gói credit lớn ($100, $200, $500).',
    },
    {
      q: 'Sau khi thanh toán, tôi nhận được những gì?',
      a: 'Hệ thống bàn giao tức thì (< 30 giây) gồm: email đăng nhập tài khoản platform, API key riêng tư (sk-...), hướng dẫn đổi mật khẩu/khóa 2FA và biên bản đối soát số dư credit ban đầu. Với gói Organization/Enterprise, chúng tôi hỗ trợ onboarding 1-1 qua Telegram.',
    },
    {
      q: 'Có bảo hành không nếu tài khoản bị khóa hoặc credit thiếu?',
      a: 'Có. Mọi tài khoản API credit được bảo hành đối soát số dư trong 7 ngày đầu và bảo hành lỗi key 1-đổi-1 trong 30 ngày. Nếu nhà cung cấp vô hiệu hóa tài khoản do lỗi nguồn gốc (không phải do vi phạm chính sách từ phía bạn), hệ thống tự động hoàn credit hoặc thay tài khoản tương đương.',
    },
  ];

  return (
    <div className="w-full min-h-screen relative overflow-hidden pb-20">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-accent-cyan/10 via-primary-blue/10 to-transparent blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link to="/" className="hover:text-text-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-border-subtle" />
          <Link to="/products" className="hover:text-text-primary transition-colors">
            Kho AI Pro
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-border-subtle" />
          <span className="text-accent-cyan font-semibold">Tài khoản API Credit $</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-accent-cyan/30 text-xs font-mono text-accent-cyan mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <KeyRound className="w-3.5 h-3.5" />
            <span>
              {MOCK_API_CREDIT_ACCOUNTS.length} MỨC CREDIT • {totalStock} TÀI KHOẢN SẴN KHO •{' '}
              ${totalCreditAvailable.toLocaleString()} TỔNG CREDIT
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Tài Khoản API{' '}
            <span className="bg-gradient-to-r from-accent-cyan via-primary-blue to-[#60A5FA] bg-clip-text text-transparent">
              Nạp Sẵn Credit $
            </span>{' '}
            Cho Mọi Nhà Cung Cấp Lớn
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
            Mua tài khoản developer kèm số dư credit ($) để gọi model của OpenAI (ChatGPT), Anthropic
            (Claude), Google (Gemini), DeepSeek, xAI, Mistral, Cohere và Perplexity — giá chỉ từ{' '}
            <span className="text-accent-cyan font-semibold">$0.85/credit</span>, bàn giao API key
            tức thì dưới 30 giây.
          </p>

          {/* Value Props */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-text-secondary">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Zap className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Bàn giao key &lt; 30s</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
              <span>Đối soát credit 7 ngày</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Wallet className="w-3.5 h-3.5 text-[#FFC439]" />
              <span>Tiết kiệm tới 25% so với nạp thẻ</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Headphones className="w-3.5 h-3.5 text-primary-blue" />
              <span>Hỗ trợ tích hợp SDK 24/7</span>
            </div>
          </div>
        </div>

        {/* Provider Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
          {(Object.keys(PROVIDER_META) as AiProviderId[]).map((pid) => {
            const meta = PROVIDER_META[pid];
            const isActive = activeProvider === pid;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => setActiveProvider(isActive ? 'all' : pid)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-blue/15 border-primary-blue shadow-glow-blue'
                    : 'bg-surface/60 border-border-subtle hover:border-border-focus'
                }`}
              >
                <img
                  src={meta.logo}
                  alt={meta.name}
                  className="w-7 h-7 rounded-lg object-contain bg-canvas p-1 border border-border-subtle"
                />
                <span className="text-[10px] font-semibold text-text-secondary truncate w-full text-center">
                  {meta.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter / Search / Sort Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6 pb-4 border-b border-border-subtle/60">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            {PROVIDER_FILTERS.map((pf) => {
              const isActive = activeProvider === pf.id;
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setActiveProvider(pf.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-primary-blue text-white border border-primary-blue shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      : 'bg-surface text-text-secondary border border-border-subtle hover:border-border-focus hover:text-text-primary'
                  }`}
                >
                  <span>{pf.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-canvas text-text-muted'
                    }`}
                  >
                    {providerCounts[pf.id] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 lg:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm gpt-4o, claude, $100..."
                className="w-full pl-9 pr-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-text-secondary focus:outline-none focus:border-border-focus cursor-pointer"
            >
              <option value="popular">Phổ biến</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
              <option value="credit_desc">Credit lớn nhất</option>
              <option value="stock">Còn nhiều hàng</option>
            </select>
          </div>
        </div>

        {/* Counter + Clear filters */}
        <div className="flex items-center justify-between text-xs text-text-muted mb-6">
          <div className="flex items-center gap-2">
            <Boxes className="w-3.5 h-3.5 text-accent-cyan" />
            <span>
              Hiển thị{' '}
              <span className="font-bold text-text-primary font-mono">{filteredAccounts.length}</span>{' '}
              mức giá / trên tổng{' '}
              <span className="font-bold text-text-primary font-mono">
                {MOCK_API_CREDIT_ACCOUNTS.length}
              </span>{' '}
              — còn{' '}
              <span className="font-bold text-status-success font-mono">
                {filteredAccounts.reduce((s, a) => s + a.stockCount, 0)}
              </span>{' '}
              tài khoản khả dụng
            </span>
          </div>
          {(activeProvider !== 'all' || searchQuery || sortBy !== 'popular') && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-accent-cyan hover:text-white transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Cards Grid */}
        {filteredAccounts.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-surface/50 border border-border-subtle max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted mx-auto mb-4">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">
              Không tìm thấy gói credit phù hợp
            </h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Hãy thử từ khóa khác như "openai", "deepseek", "$100" hoặc đặt lại bộ lọc. Cần số
              credit tùy chỉnh? Liên hệ hotline doanh nghiệp của AIPro.dev.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-primary-blue text-white text-xs font-bold hover:bg-primary-blue/90 transition-all inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem tất cả gói credit</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAccounts.map((account) => (
              <ApiCreditCard key={account.id} account={account} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}

        {/* Bulk Price Table (số lượng × mức giá) */}
        <section className="mt-16 pt-10 border-t border-border-subtle/80">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Bảng Giá Sĩ Theo Số Lượng Tài Khoản
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary">
              Mua từ 5 tài khoản credit trở lên — áp dụng thêm chiết khấu sỉ trực tiếp trên hóa đơn.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-elevated text-left">
                  <th className="px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    Gói credit / tài khoản
                  </th>
                  <th className="px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    1 – 4 SL
                  </th>
                  <th className="px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    5 – 9 SL (-5%)
                  </th>
                  <th className="px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    10 – 24 SL (-10%)
                  </th>
                  <th className="px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    25+ SL (-15%)
                  </th>
                  <th className="px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider text-[10px] text-right">
                    Tồn kho
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_API_CREDIT_ACCOUNTS.map((a, idx) => {
                  const unit = a.priceVND;
                  return (
                    <tr
                      key={a.id}
                      className={`border-t border-border-subtle/60 ${
                        idx % 2 === 0 ? 'bg-surface/60' : 'bg-surface/30'
                      } hover:bg-elevated/60 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={a.brandLogo}
                            alt={a.providerName}
                            className="w-5 h-5 rounded object-contain bg-canvas p-0.5 border border-border-subtle"
                          />
                          <span className="font-semibold text-text-primary">
                            {a.providerName} ${a.creditAmountUSD}
                          </span>
                        </div>
                      </td>
                      {[0, 5, 10, 15].map((off) => (
                        <td key={off} className="px-4 py-3 font-mono text-text-secondary">
                          {Math.round(unit * (1 - off / 100)).toLocaleString('vi-VN')} ₫
                        </td>
                      ))}
                      <td className="px-4 py-3 font-mono text-right">
                        <span className={a.stockCount > 0 ? 'text-status-success' : 'text-status-error'}>
                          {a.stockCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 pt-10 border-t border-border-subtle/80 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-cyan mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>HỎI ĐÁP VỀ TÀI KHOẢN API CREDIT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
              Câu Hỏi Thường Gặp
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-surface/60 border border-border-subtle overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-surface/90 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-text-primary">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-accent-cyan' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-text-secondary leading-relaxed border-t border-border-subtle/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border-subtle hover:border-border-focus text-xs font-semibold text-text-primary transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Xem gói Subscription (Plus / Pro)</span>
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-blue text-white text-xs font-bold hover:bg-primary-blue/90 transition-all shadow-glow-blue"
            >
              <span>Hướng dẫn cấu hình API Key</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
