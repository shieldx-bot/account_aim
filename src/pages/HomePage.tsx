import React, { useState, useMemo, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProductCategory } from '@/types';
import { useApp } from '@/context/AppContext';
import { prefersReducedMotion } from '@/hooks/useGsapContext';
import { ScrollProgress, useHeroTimeline, useHeroParallax } from '@/components/home/ScrollFx';

gsap.registerPlugin(ScrollTrigger);
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
import { ReferralEventSection } from '@/components/home/ReferralEventSection';
import { Hero3DShowcase } from '@/components/home/Hero3DShowcase';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { Reveal } from '@/components/home/Reveal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { trackEvent } from '@/utils/telemetry';
import { Zap, Shield, Star, Sparkles, ArrowDown, ChevronRight, Activity } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, isLoadingProducts } = useApp();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // GSAP hero choreography (timeline + parallax), scoped to <section> below.
  const heroRef = useRef<HTMLElement | null>(null);
  useHeroTimeline({ rootRef: heroRef });
  useHeroParallax({ rootRef: heroRef });

  useEffect(() => {
    trackEvent('view_item_list', {
      item_list_name: 'AI Pro Global Catalog',
      items_count: products.length,
    });
  }, [products.length]);

  // Section header reveal: eyebrow badge → title → description cascade.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-section-header]').forEach((header) => {
        gsap.from(header.children, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: header, start: 'top 85%', once: true },
        });
      });
    });
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

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
      {/* GSAP scroll progress indicator (top of viewport) */}
      <ScrollProgress />

      {/* Ambient background: real photo layer + aurora blobs + tech grid */}
      <div className="absolute inset-x-0 top-0 h-[720px] pointer-events-none -z-10 overflow-hidden">
        {/* Real photography backdrop (downloaded from Unsplash, served locally) */}
        <img
          src="/images/hero-code.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="low"
          data-parallax="0.12"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.14] saturate-[0.7]"
        />
        {/* Fade the photo into page background so it never looks pasted-on */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div data-parallax="0.35" className="aurora-blob animate-aurora w-[560px] h-[420px] bg-primary-blue/20 -top-32 left-[8%]" />
        <div data-parallax="0.25" className="aurora-blob animate-aurora w-[480px] h-[380px] bg-accent-cyan/10 -top-20 right-[6%]" style={{ animationDelay: '-9s' }} />
        <div data-parallax="0.45" className="aurora-blob animate-aurora w-[420px] h-[320px] bg-[#8B5CF6]/10 top-[320px] left-[38%]" style={{ animationDelay: '-4s' }} />
        <div className="absolute inset-0 bg-tech-grid animate-gridPan" />
      </div>

      {/* 1. HERO SECTION (Above the Fold) */}
      <section
        ref={heroRef}
        className="relative pt-10 pb-12 sm:pt-16 sm:pb-16 text-center max-w-[1240px] mx-auto px-4 sm:px-6"
      >
        {/* Floating 3D license-card deck behind hero */}
        <Hero3DShowcase />

{/* Announcement Pill with Live Badge */}
        <div data-hero="pill" className="inline-flex items-center gap-2 p-1 pr-4 rounded-full bg-surface border border-accent-cyan/30 text-xs text-text-secondary hover:border-accent-cyan transition-all shadow-[0_0_20px_rgba(0,240,255,0.15)] mb-6 group cursor-default">
          <span className="px-2.5 py-0.5 rounded-full bg-primary-blue text-white font-mono font-bold text-[10px] tracking-wide uppercase">
            NEW
          </span>
          <span className="flex items-center gap-1 font-medium text-text-primary">
            <span>Claude 3.7 Sonnet Hybrid Reasoning & Cursor 0.45 now available</span>
            <ChevronRight className="w-3.5 h-3.5 text-accent-cyan group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Hero Title — each line is a stagger target for the GSAP timeline */}
        <h1 data-hero="headline" className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight max-w-4xl mx-auto leading-[1.12]">
          <span className="hero-line block">Super Programming Power for Tech Engineers.</span>
          <span className="hero-line block bg-gradient-to-r from-accent-cyan via-primary-blue to-[#60A5FA] bg-clip-text text-transparent">
            Activate &lt; 30 Seconds.
          </span>
        </h1>

        {/* Subtitle */}
        <p data-hero="subtitle" className="mt-5 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Official AI Pro account distribution platform (Cursor Pro, Claude 3.7 Sonnet, ChatGPT Plus, GitHub Copilot). Save up to <span className="text-status-success font-semibold">65% cost</span>, assign 100% secure official email, auto 1-exchange warranty via 24/7 Bot.
        </p>

        {/* Hero Action CTA Buttons */}
        <div data-hero="cta" className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a
            href="#catalog"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary-blue/30 hover:shadow-primary-blue/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Explore Pro Plans</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </a>

          <a
            href="#calculator"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-primary-blue/50 text-text-secondary hover:text-text-primary text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4 text-accent-cyan" />
            <span>Calculate ROI</span>
          </a>
        </div>

        {/* Terminal Simulator Showcase */}
        <div data-hero="terminal" className="mt-10">
          <TerminalSimulator />
        </div>

        {/* Live Social Proof Stats */}
        <div data-hero="stats" className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent-cyan text-sm">12,450+</span>
            <span className="text-text-secondary">engineers using</span>
          </div>
          <span className="hidden sm:inline-block text-border-subtle">&bull;</span>
          <div className="flex items-center gap-1.5 text-status-warning font-semibold">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-status-warning" />
              ))}
            </div>
            <span className="text-text-secondary font-mono">4.9/5 Rating</span>
          </div>
          <span className="hidden sm:inline-block text-border-subtle">&bull;</span>
          <div className="flex items-center gap-1 text-status-success font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>SLA 99.9% Uptime Commitment</span>
          </div>
        </div>
      </section>

      {/* 2. PROMO BANNER CAROUSEL (Flash sale / Combo / Referral) */}
      <PromoCarousel />

      {/* 3. REAL-TIME TELEMETRY LIVE FEED */}
      <LiveActivityTicker />

      {/* 4. LOGO CLOUD / TRUSTED BY MARQUEE */}
      <CompanyTrustMarquee />

      {/* 5. BENTO GRID ARCHITECTURE (Enterprise Superiority) */}
      <Reveal>
        <BentoFeaturesSection />
      </Reveal>

      {/* 6. INTERACTIVE ROI CALCULATOR */}
      <div id="calculator" className="scroll-mt-20">
        <Reveal>
          <RoiCalculatorSection />
        </Reveal>
      </div>

      {/* 7. COMPARISON MATRIX (AIPro vs. Chợ Đen) */}
      <Reveal>
        <ComparisonTableSection />
      </Reveal>

      {/* 8. CATALOG & LIVE STOCK SECTION */}
      <section id="catalog" className="max-w-[1240px] mx-auto px-4 sm:px-6 py-14 scroll-mt-20">
        <div data-section-header className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/30 text-accent-cyan text-xs font-mono font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Pro License Catalog</span>
          </div>
          <span>Choose the best AI tool for your workflow</span>
<p className="mt-2 text-xs sm:text-sm text-text-secondary">
              Instant automatic allocation. Full support for 1-month, 3-month, 6-month and 1-year plans.
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
            /* Skeleton shimmer trong lúc sync từ PostgreSQL — tránh "nhảy" layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-surface border border-border-subtle p-5 space-y-4 animate-pulse"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-elevated" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 w-2/3 rounded bg-elevated" />
                      <div className="h-2.5 w-1/3 rounded bg-elevated" />
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded bg-elevated" />
                  <div className="h-2.5 w-5/6 rounded bg-elevated" />
                  <div className="flex justify-between pt-2">
                    <div className="h-6 w-24 rounded-lg bg-elevated" />
                    <div className="h-9 w-28 rounded-xl bg-elevated" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl bg-surface border border-border-subtle">
              <div className="font-mono text-status-error text-sm mb-2">$ Error: 0 matching AI tools found</div>
              <h3 className="text-lg font-bold text-text-primary mb-2">No matching AI packages found</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mb-6">
                Please try searching with different keywords or click reset to restore default category.
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
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'compact' ? (
            <div className="space-y-3 animate-fadeIn">
              {filteredProducts.map((prod, i) => (
                <Reveal key={prod.id} delay={(i % 6) * 0.07} from="left" distance={24}>
                  <ProductCard product={prod} compact={true} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredProducts.map((prod, i) => (
                <Reveal key={prod.id} delay={(i % 3) * 0.08 + Math.floor((i % 6) / 3) * 0.05} from="scale">
                  <ProductCard product={prod} compact={false} />
                </Reveal>
              ))}
            </div>
          )}
        </ErrorBoundary>
      </section>

      {/* 9. DEVELOPER TESTIMONIALS SECTION */}
      <Reveal>
        <TestimonialsSection />

        {/* Sự kiện viral: Mời bạn mua — Nhận ngay tài khoản đã được thanh toán */}
        <ErrorBoundary contextName="ReferralEventSection">
          <ReferralEventSection />
        </ErrorBoundary>
      </Reveal>

      {/* 10. FAQ ACCORDION SECTION */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <Reveal>
          <FaqAccordion />
        </Reveal>
      </div>

      {/* 11. FINAL CONVERSION CTA RIBBON */}
      <Reveal>
        <FinalCtaSection />
      </Reveal>
    </div>
  );
};
