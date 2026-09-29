import React, { useState, useMemo, useEffect } from 'react';
import { ProductCategory } from '@/types';
import { useApp } from '@/context/AppContext';
import { TerminalSimulator } from '@/components/home/TerminalSimulator';
import { ProductCard } from '@/components/home/ProductCard';
import { FilterPillsBar, SortOption } from '@/components/home/FilterPillsBar';
import { LiveStockBanner } from '@/components/home/LiveStockBanner';
import { CompanyTrustMarquee } from '@/components/home/CompanyTrustMarquee';
import { LiveActivityTicker } from '@/components/home/LiveActivityTicker';
import { BentoFeaturesSection } from '@/components/home/BentoFeaturesSection';
import { RoiCalculatorSection } from '@/components/home/RoiCalculatorSection';
import { ComparisonTableSection } from '@/components/home/ComparisonTableSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { trackEvent } from '@/utils/telemetry';
import { Zap, Shield, Star, Sparkles, ArrowDown, ChevronRight, Activity, Loader2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, isLoadingProducts } = useApp();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  useEffect(() => {
    trackEvent('view_item_list', {
      item_list_name: 'AI Pro Global Catalog',
      items_count: products.length,
    });
  }, [products.length]);

  const handleCategoryChange = (category: ProductCategory) => {
    setActiveCategory(category);
    trackEvent('filter_category_selected', { category });
  };

  // Compute category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Filter and sort products
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
          return 0; // Natural order
      }
    });
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <div className="w-full relative overflow-hidden">
      {/* Ambient background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-primary-blue/15 via-accent-cyan/5 to-transparent blur-[150px] pointer-events-none -z-10" />

      {/* 1. HERO SECTION (Above the Fold) */}
      <section className="relative pt-10 pb-12 sm:pt-16 sm:pb-16 text-center max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Announcement Pill with Live Badge */}
        <div className="inline-flex items-center gap-2 p-1 pr-4 rounded-full bg-surface border border-accent-cyan/30 text-xs text-text-secondary hover:border-accent-cyan transition-all shadow-[0_0_20px_rgba(0,240,255,0.15)] mb-6 group cursor-default">
          <span className="px-2.5 py-0.5 rounded-full bg-primary-blue text-white font-mono font-bold text-[10px] tracking-wide uppercase">
            Mới cập nhật
          </span>
          <span className="flex items-center gap-1 font-medium text-text-primary">
            <span>Claude 3.7 Sonnet Hybrid Reasoning &amp; Cursor 0.45 đã có sẵn</span>
            <ChevronRight className="w-3.5 h-3.5 text-accent-cyan group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Siêu Năng Lực Lập Trình Cho Kỹ Sư Công Nghệ.{' '}
          <span className="bg-gradient-to-r from-accent-cyan via-primary-blue to-[#60A5FA] bg-clip-text text-transparent">
            Kích Hoạt &lt; 30 Giây.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Nền tảng phân phối tài khoản AI Pro chính hãng (Cursor Pro, Claude 3.7 Sonnet, ChatGPT Plus, GitHub Copilot). Tiết kiệm đến <span className="text-status-success font-semibold">65% chi phí</span>, gán email chính chủ an toàn 100%, bảo hành 1-đổi-1 tự động qua Bot 24/7.
        </p>

        {/* Hero Action CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a
            href="#catalog"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary-blue/30 hover:shadow-primary-blue/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Khám Phá Các Gói Pro</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </a>

          <a
            href="#calculator"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-primary-blue/50 text-text-secondary hover:text-text-primary text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4 text-accent-cyan" />
            <span>Tính Lợi Nhuận ROI</span>
          </a>
        </div>

        {/* Terminal Simulator Showcase */}
        <div className="mt-10">
          <TerminalSimulator />
        </div>

        {/* Live Social Proof Stats */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent-cyan text-sm">12,450+</span>
            <span className="text-text-secondary">kỹ sư tin dùng</span>
          </div>
          <span className="hidden sm:inline-block text-border-subtle">&bull;</span>
          <div className="flex items-center gap-1.5 text-status-warning font-semibold">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-status-warning" />
              ))}
            </div>
            <span className="text-text-secondary font-mono">4.9/5 Đánh giá</span>
          </div>
          <span className="hidden sm:inline-block text-border-subtle">&bull;</span>
          <div className="flex items-center gap-1 text-status-success font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Cam kết SLA 99.9% Uptime</span>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME TELEMETRY LIVE FEED */}
      <LiveActivityTicker />

      {/* 3. LOGO CLOUD / TRUSTED BY MARQUEE */}
      <CompanyTrustMarquee />

      {/* 4. BENTO GRID ARCHITECTURE (Enterprise Superiority) */}
      <BentoFeaturesSection />

      {/* 5. INTERACTIVE ROI CALCULATOR */}
      <div id="calculator" className="scroll-mt-20">
        <RoiCalculatorSection />
      </div>

      {/* 6. COMPARISON MATRIX (AIPro vs. Chợ Đen) */}
      <ComparisonTableSection />

      {/* 7. CATALOG & LIVE STOCK SECTION */}
      <section id="catalog" className="max-w-[1240px] mx-auto px-4 sm:px-6 py-14 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/30 text-accent-cyan text-xs font-mono font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Danh Mục Bản Quyền AI Pro Sẵn Có</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Chọn công cụ AI tốt nhất cho quy trình làm việc của bạn
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary">
            Cấp phát tự động tức thì. Hỗ trợ đầy đủ các gói thời hạn 1 tháng, 3 tháng, 6 tháng và 1 năm.
          </p>
        </div>

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

        {/* Live Stock Indicator Banner */}
        <LiveStockBanner />

        {/* Product Cards Grid with Error Boundary */}
        <ErrorBoundary contextName="HomePage_ProductGrid">
          {isLoadingProducts && products.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl bg-surface border border-border-subtle space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-blue" />
              <p className="text-xs text-text-muted font-mono">Đang đồng bộ kho bản quyền AI từ PostgreSQL...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl bg-surface border border-border-subtle">
              <div className="font-mono text-status-error text-sm mb-2">$ Error: 0 matching AI tools found</div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Không tìm thấy gói AI phù hợp</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mb-6">
                Vui lòng thử tìm kiếm với từ khóa khác hoặc bấm khôi phục lại danh mục mặc định.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                  setSortBy('popular');
                }}
                className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
              >
                Khôi phục bộ lọc
              </button>
            </div>
          ) : viewMode === 'compact' ? (
            <div className="space-y-3 animate-fadeIn">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} compact={true} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} compact={false} />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </section>

      {/* 8. DEVELOPER TESTIMONIALS SECTION */}
      <TestimonialsSection />

      {/* 9. FAQ ACCORDION SECTION */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <FaqAccordion />
      </div>

      {/* 10. FINAL CONVERSION CTA RIBBON */}
      <FinalCtaSection />
    </div>
  );
};
