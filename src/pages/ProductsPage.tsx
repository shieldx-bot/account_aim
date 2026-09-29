import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ProductCategory } from '@/types';
import { FilterPillsBar, SortOption } from '@/components/home/FilterPillsBar';
import { ProductCard } from '@/components/home/ProductCard';
import { LiveStockBanner } from '@/components/home/LiveStockBanner';
import {
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Headphones,
  RotateCcw,
  Search,
  HelpCircle,
  ChevronDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = (searchParams.get('category') as ProductCategory) || 'all';

  const { products, isLoadingProducts } = useApp();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(categoryParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Kho Tài Khoản AI Pro Bản Quyền Chính Hãng | AIPro.dev';
  }, []);

  // Sync category param with URL if needed
  useEffect(() => {
    if (categoryParam && categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleCategoryChange = (cat: ProductCategory) => {
    setActiveCategory(cat);
    if (cat === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), category: cat });
    }
  };

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    const list = products.filter((prod) => {
      const matchCat = activeCategory === 'all' || prod.category === activeCategory;
      const matchSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.quotaFeatures.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.currentPriceVND - b.currentPriceVND;
        case 'price_desc':
          return b.currentPriceVND - a.currentPriceVND;
        case 'discount':
          return b.discountPercent - a.discountPercent;
        case 'stock':
          return b.stockCount - a.stockCount;
        case 'popular':
        default:
          return 0;
      }
    });
  }, [products, activeCategory, searchQuery, sortBy]);

  const clearFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSortBy('popular');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const FAQS = [
    {
      q: 'Sau khi thanh toán bao lâu tôi sẽ nhận được tài khoản AI?',
      a: 'Hệ thống AIPro.dev kích hoạt hoàn toàn tự động 24/7. Ngay sau khi cổng thanh toán PayPal xác nhận giao dịch thành công (thường < 30 giây), hệ thống sẽ gửi thông tin cấp quyền hoặc lời mời gia nhập Workspace qua Email mà bạn đã cung cấp.',
    },
    {
      q: 'Tài khoản được cấp phát theo phương thức nào?',
      a: 'Tùy thuộc vào gói dịch vụ, chúng tôi hỗ trợ 2 phương thức: (1) Lời mời kích hoạt trực tiếp vào email cá nhân chính chủ của bạn (Invite Email/Workspace), hoặc (2) Tài khoản chuyên dụng tạo sẵn (Dedicated Account) đã được nạp gói bản quyền chính hãng.',
    },
    {
      q: 'Chính sách bảo hành và cam kết dịch vụ (SLA) ra sao?',
      a: 'Mọi gói bản quyền tại AIPro.dev được bảo hành 1-đổi-1 tự động trong suốt thời hạn sử dụng. Nếu phát sinh lỗi gói hoặc hạn ngạch do nhà cung cấp, hệ thống Bot của chúng tôi sẽ cấp lại tài khoản mới hoặc gia hạn bù ngày trong vòng dưới 2 phút.',
    },
    {
      q: 'Tôi có thể thanh toán bằng những phương thức nào?',
      a: 'Chúng tôi hỗ trợ thanh toán quốc tế qua cổng PayPal bảo mật, bao gồm số dư PayPal, thẻ tín dụng/ghi nợ quốc tế Visa, Mastercard, American Express và Discover mà không yêu cầu tài khoản PayPal bắt buộc.',
    },
  ];

  return (
    <div className="w-full min-h-screen relative overflow-hidden pb-20">
      {/* Ambient background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-primary-blue/15 via-accent-cyan/5 to-transparent blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link to="/" className="hover:text-text-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-border-subtle" />
          <span className="text-accent-cyan font-semibold">Danh mục sản phẩm AI Pro</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-accent-cyan/30 text-xs font-mono text-accent-cyan mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>16 GÓI BẢN QUYỀN CHÍNH HÃNG SẴN SÀNG BÀN GIAO</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Kho Tài Khoản AI Pro Chuẩn Cho{' '}
            <span className="bg-gradient-to-r from-accent-cyan via-primary-blue to-[#60A5FA] bg-clip-text text-transparent">
              Lập Trình Viên &amp; Đội Ngũ
            </span>
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
            Kích hoạt trực tiếp vào email chính chủ, tiết kiệm tới 65% chi phí so với mua lẻ. Đảm bảo 100% tài khoản sạch bản quyền, bảo hành tự động 1-đổi-1 24/7.
          </p>

          {/* Value Props Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-text-secondary">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Zap className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Giao tức thì &lt; 30s</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
              <span>Bảo hành 1-đổi-1 tự động</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <CreditCard className="w-3.5 h-3.5 text-[#FFC439]" />
              <span>PayPal &amp; Visa/Mastercard</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Headphones className="w-3.5 h-3.5 text-primary-blue" />
              <span>Hỗ trợ kỹ thuật 24/7</span>
            </div>
          </div>
        </div>

        {/* Dynamic Live Stock Banner */}
        <div className="mb-8">
          <LiveStockBanner />
        </div>

        {/* Filter, Search, Sort & View Controls */}
        <div className="mb-8">
          <FilterPillsBar
            activeCategory={activeCategory}
            onSelectCategory={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryCounts={categoryCounts}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalFilteredCount={filteredProducts.length}
          />
        </div>

        {/* Active Filter Counter & Clear Filter */}
        <div className="flex items-center justify-between text-xs text-text-muted mb-6 pb-3 border-b border-border-subtle/60">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <span className="font-bold text-text-primary font-mono">{filteredProducts.length}</span> trên tổng số{' '}
              <span className="font-bold text-text-primary font-mono">{products.length}</span> sản phẩm
            </span>
            {activeCategory !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-primary-blue/15 text-accent-cyan border border-primary-blue/30 font-mono text-[11px]">
                {activeCategory}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-surface text-text-primary border border-border-subtle font-mono text-[11px]">
                "{searchQuery}"
              </span>
            )}
          </div>

          {(activeCategory !== 'all' || searchQuery || sortBy !== 'popular') && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-accent-cyan hover:text-white transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Product Cards Container */}
        {isLoadingProducts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-primary-blue border-t-accent-cyan rounded-full animate-spin" />
            <span className="text-xs font-mono text-text-muted">Đang tải danh mục từ cơ sở dữ liệu...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-surface/50 border border-border-subtle max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted mx-auto mb-4">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Không có sản phẩm nào khớp với từ khóa "{searchQuery}" hoặc phân loại hiện tại. Hãy thử tìm kiếm với từ khóa khác như "Cursor", "Claude", "ChatGPT" hoặc đặt lại bộ lọc.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-primary-blue text-white text-xs font-bold hover:bg-primary-blue/90 transition-all inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem tất cả sản phẩm</span>
            </button>
          </div>
        ) : viewMode === 'compact' ? (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact={true} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact={false} />
            ))}
          </div>
        )}

        {/* Why Choose AIPro.dev Trust Grid */}
        <section className="mt-20 pt-12 border-t border-border-subtle/80">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Tại Sao Hơn 10,000+ Kỹ Sư &amp; Đội Ngũ Chọn AIPro.dev?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary">
              Giải pháp tối ưu hóa chi phí bản quyền công nghệ cho lập trình viên và doanh nghiệp Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-accent-cyan/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/15 border border-primary-blue/30 flex items-center justify-center text-accent-cyan mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Giao Hàng Tự Động &lt; 30s</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Hệ thống API kết nối trực tiếp nhận đơn và gửi lời mời kích hoạt ngay lập tức sau khi thanh toán thành công.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-status-success/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Bảo Hành 1-Đổi-1 Tự Động</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Cam kết duy trì tính liên tục của công việc. Đổi mới ngay lập tức qua bot tự động nếu tài khoản bị gián đoạn.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-[#FFC439]/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FFC439]/15 border border-[#FFC439]/30 flex items-center justify-center text-[#FFC439] mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Thanh Toán PayPal &amp; Quốc Tế</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Thanh toán toàn cầu an toàn qua PayPal, thẻ Visa/Mastercard với tỷ giá quy đổi ưu đãi và minh bạch.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-primary-blue/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/15 border border-primary-blue/30 flex items-center justify-center text-primary-blue mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Tiết Kiệm Lên Đến 65%</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Hợp tác phân phối sỉ và chương trình tài trợ nhà phát triển giúp bạn tiếp cận công cụ AI với mức giá rẻ nhất.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="mt-16 pt-10 border-t border-border-subtle/80 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-cyan mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>HỎI ĐÁP THƯỜNG GẶP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
              Câu Hỏi Về Dịch Vụ &amp; Bản Quyền
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
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-surface/90 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-text-primary">
                      {faq.q}
                    </span>
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

          <div className="mt-8 text-center">
            <p className="text-xs text-text-muted">
              Cần hỗ trợ thêm về các gói tài khoản hoặc đặt mua cho doanh nghiệp?{' '}
              <Link to="/docs" className="text-accent-cyan hover:underline inline-flex items-center gap-1">
                <span>Xem tài liệu cấu hình</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
