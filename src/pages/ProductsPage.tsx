import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ProductCategory, ProductPlan } from '@/types';
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
  ChevronLeft,
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

  // Server-side pagination: only the current page is fetched from the API
  const PAGE_SIZE = 24;
  const [page, setPage] = useState(1);
  const [serverProducts, setServerProducts] = useState<ProductPlan[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    document.title = 'Official AgentLab License Accounts | AgentLab';
  }, []);

  // Debounce search input so we do not hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, debouncedSearch, sortBy]);

  // Fetch the current page from the API (category + search + sort are server-side)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsPageLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          category: activeCategory,
          sort: sortBy,
        });
        if (debouncedSearch) qs.set('search', debouncedSearch);
        const res = await fetch(`${import.meta.env.VITE_API_BASE || '/api'}/products?${qs}`);
        const body = await res.json();
        if (!cancelled && body.success) {
          setServerProducts(body.data || []);
          setTotalCount(body.count || 0);
          setTotalPages(body.totalPages || 1);
        }
      } catch {
        if (!cancelled) setServerProducts([]);
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, activeCategory, debouncedSearch, sortBy]);

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

  // Products for the current page come from the API (paginated + server-filtered).
  // Client-side safety net: older backends return the full list, so filter locally too.
  const filteredProducts = useMemo(
    () =>
      serverProducts.filter((prod) => {
        const matchCat = activeCategory === 'all' || prod.category === activeCategory;
        const q = debouncedSearch.toLowerCase();
        const matchSearch =
          !q ||
          prod.name.toLowerCase().includes(q) ||
          prod.brand.toLowerCase().includes(q) ||
          prod.slug.toLowerCase().includes(q);
        return matchCat && matchSearch;
      }),
    [serverProducts, activeCategory, debouncedSearch]
  );
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSortBy('popular');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const FAQS = [
    {
      q: 'How long will I receive my AI account after payment?',
      a: 'AgentLab system activates completely automatically 24/7. Immediately after the PayPal payment gateway confirms the transaction (typically < 30 seconds), the system will send account access or Workspace invitation details to the email you provided.',
    },
    {
      q: 'What provisioning methods are available for accounts?',
      a: 'Depending on the service package, we support 2 methods: (1) Direct activation invite sent to your personal email (Invite Email/Workspace), or (2) Pre-created Dedicated Account with official license already loaded.',
    },
    {
      q: 'What is the warranty and SLA commitment policy?',
      a: 'All AgentLab license packages include automatic 1-exchange warranty throughout the service period. If any package or quota issues arise from the provider, our Bot system will automatically issue a new account or extend service days within 2 minutes.',
    },
    {
      q: 'What payment methods are available?',
      a: 'We support secure international payments via PayPal — pay with your PayPal balance or linked international cards (Visa, Mastercard, American Express, Discover). Payment is approved on PayPal\'s hosted page; we never see your card details.',
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
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-border-subtle" />
          <span className="text-accent-cyan font-semibold">AgentLab Product Catalog</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-accent-cyan/30 text-xs font-mono text-accent-cyan mb-4 shadow-[0_0_15px_rgba(0,212,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>16 OFFICIAL LICENSES READY FOR DELIVERY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Premium AgentLab Account Vault for{' '}
            <span className="bg-gradient-to-r from-accent-cyan via-primary-blue to-[#60A5FA] bg-clip-text text-transparent">
              Developers &amp; Teams
            </span>
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
            Direct activation on official email at transparent official vendor pricing. 100% clean license, auto 1-exchange warranty 24/7.
          </p>

          {/* Value Props Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-text-secondary">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Zap className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Instant Delivery &lt; 30s</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
              <span>Auto 1-Exchange Warranty</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <CreditCard className="w-3.5 h-3.5 text-[#FFC439]" />
              <span>PayPal &amp; Visa/Mastercard</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 border border-border-subtle">
              <Headphones className="w-3.5 h-3.5 text-primary-blue" />
              <span>Technical Support 24/7</span>
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
              Showing <span className="font-bold text-text-primary font-mono">{rangeStart}–{rangeEnd}</span> of{' '}
              <span className="font-bold text-text-primary font-mono">{totalCount}</span> products
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
              className="flex items-center gap-1 text-accent-cyan hover:text-primary-blue transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Product Cards Container */}
        {isLoadingProducts || isPageLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-primary-blue border-t-accent-cyan rounded-full animate-spin" />
            <span className="text-xs font-mono text-text-muted">Loading catalog from database...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-surface/50 border border-border-subtle max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted mx-auto mb-4">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">No matching products found</h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              No products match the keyword "{searchQuery}" or the current category. Try searching with other keywords such as "Cursor", "Claude", "ChatGPT" or reset the filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-primary-blue text-white text-xs font-bold hover:bg-primary-blue/90 transition-all inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>View all products</span>
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

        {/* Pagination */}
        {!isPageLoading && totalCount > 0 && (
          <nav className="mt-10 flex items-center justify-center gap-1.5 flex-wrap" aria-label="Catalog pagination">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg border border-border-subtle bg-surface text-xs font-mono text-text-secondary hover:border-accent-cyan/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .map((n, idx, arr) => (
                <React.Fragment key={n}>
                  {idx > 0 && arr[idx - 1] !== n - 1 && (
                    <span className="px-1 text-text-muted font-mono text-xs">…</span>
                  )}
                  <button
                    onClick={() => goToPage(n)}
                    className={`w-9 h-9 rounded-lg text-xs font-mono transition-all ${
                      n === page
                        ? 'bg-primary-blue text-white font-bold shadow-[0_0_12px_rgba(99,91,255,0.35)]'
                        : 'border border-border-subtle bg-surface text-text-secondary hover:border-accent-cyan/40'
                    }`}
                  >
                    {n}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg border border-border-subtle bg-surface text-xs font-mono text-text-secondary hover:border-accent-cyan/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        )}

        {/* Why Choose AgentLab Trust Grid */}
        <section className="mt-20 pt-12 border-t border-border-subtle/80">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Why 10,000+ Developers &amp; Teams Choose AgentLab?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary">
              Cost-optimized technology license solutions for developers and businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-accent-cyan/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/15 border border-primary-blue/30 flex items-center justify-center text-accent-cyan mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Auto Delivery &lt; 30s</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                API system directly receives orders and sends activation invite immediately after payment confirmation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-status-success/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Auto 1-Exchange Warranty</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Guarantee to maintain work continuity. Auto-bot replacement if account is interrupted.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-[#FFC439]/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FFC439]/15 border border-[#FFC439]/30 flex items-center justify-center text-[#FFC439] mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">PayPal &amp; International Payments</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Secure global payment via PayPal, Visa/Mastercard with preferred transparent exchange rate.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/70 border border-border-subtle hover:border-primary-blue/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/15 border border-primary-blue/30 flex items-center justify-center text-primary-blue mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">Official Vendor Pricing</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every plan is listed at the vendor's official monthly price — no inflated anchors, and discounts apply only via coupon codes at checkout.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="mt-16 pt-10 border-t border-border-subtle/80 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-cyan mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQ</span>
            </div>
<h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Questions About Service & Licensing
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
              Need additional support for account packages or enterprise purchases?{' '}
              <Link to="/docs" className="text-accent-cyan hover:underline inline-flex items-center gap-1">
                <span>View Setup Guides</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
