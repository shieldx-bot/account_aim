import React from 'react';
import { ProductCategory } from '@/types';
import { Search, X, ArrowUpDown, Filter, LayoutGrid, ListFilter, Sparkles } from 'lucide-react';

export type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'discount' | 'stock';

interface FilterPillsBarProps {
  activeCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryCounts: Record<string, number>;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'compact';
  onViewModeChange: (mode: 'grid' | 'compact') => void;
  totalFilteredCount: number;
}

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'coding', label: 'AI Coding' },
  { id: 'llm', label: 'LLMs & Chat' },
  { id: 'search', label: 'AI Search & Research' },
  { id: 'design', label: 'Design & Audio' },
  { id: 'enterprise', label: 'Enterprise' },
];

export const FilterPillsBar: React.FC<FilterPillsBarProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  categoryCounts,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
}) => {
  return (
    <div className="w-full space-y-4 my-8">
      {/* Top Filter Bar: Horizontal Category Pills + View Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border-subtle/60">
        {/* Horizontal Pills Tabs with Counts */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-primary-blue text-white border border-primary-blue shadow-button'
                    : 'bg-surface text-text-secondary border border-border-subtle hover:border-border-focus hover:text-text-primary'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-canvas text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher (Grid vs Compact List) */}
        <div className="hidden sm:flex items-center gap-1 bg-surface p-1 rounded-xl border border-border-subtle shrink-0 self-end lg:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-canvas text-accent-cyan shadow-sm border border-border-subtle font-bold'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="3-column grid view"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[11px] pr-1">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('compact')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-canvas text-accent-cyan shadow-sm border border-border-subtle font-bold'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Compact list view"
          >
            <ListFilter className="w-4 h-4" />
            <span className="text-[11px] pr-1">Compact</span>
          </button>
        </div>
      </div>

      {/* Secondary Controls Bar: Search Input, Quick Counter & Sorting Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface/50 p-3 rounded-2xl border border-border-subtle">
        {/* Quick Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, brand (Cursor, Claude, GPT...)"
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-canvas border border-border-subtle focus:border-border-focus focus:outline-none text-xs text-text-primary placeholder:text-text-muted transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Counter & Sort Selector */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-xs text-text-muted font-mono whitespace-nowrap">
            Showing <span className="font-bold text-accent-cyan">{totalFilteredCount}</span> products
          </span>

          <div className="flex items-center gap-1.5 bg-canvas px-3 py-1.5 rounded-xl border border-border-subtle shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[11px] text-text-muted hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs text-text-primary font-semibold focus:outline-none cursor-pointer"
            >
              <option value="popular" className="bg-white text-[#0A2540]">Recommended / Most popular</option>
              <option value="price_asc" className="bg-white text-[#0A2540]">Price: Low to High</option>
              <option value="price_desc" className="bg-white text-[#0A2540]">Price: High to Low</option>
              <option value="discount" className="bg-white text-[#0A2540]">Biggest discount %</option>
              <option value="stock" className="bg-white text-[#0A2540]">Most in stock</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
