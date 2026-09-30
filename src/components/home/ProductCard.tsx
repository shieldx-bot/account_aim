import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductPlan } from '@/types';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import {
  CheckCircle2,
  Zap,
  ArrowRight,
  ShoppingBag,
  Eye,
  X,
  Cpu,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { trackEvent } from '@/utils/telemetry';

interface ProductCardProps {
  product: ProductPlan;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const { formatPrice, currency, updateConfig } = useApp();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      product,
      duration: {
        months: 1,
        label: '1 Month',
        discountPercent: product.discountPercent,
        monthlyEquivalentVND: product.currentPriceVND,
        monthlyEquivalentUSD: product.currentPriceUSD,
      },
      provisioningType: 'invite_email',
      targetEmail: '',
      quantity: 1,
      unitPriceVND: product.currentPriceVND,
      unitPriceUSD: product.currentPriceUSD,
    });
  };

  const handleInstantBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('select_item', {
      item_id: product.slug,
      item_name: product.name,
      price: product.currentPriceUSD,
      currency: 'USD',
    });

    updateConfig({
      product,
      provisioningType: 'invite_email',
      targetEmail: '',
      duration: {
        months: 1,
        label: '1 Month',
        discountPercent: product.discountPercent,
        monthlyEquivalentVND: product.currentPriceVND,
        monthlyEquivalentUSD: product.currentPriceUSD,
      },
    });

    navigate(`/checkout?plan=${product.slug}`);
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const isOutOfStock = product.stockCount === 0;

  // COMPACT LIST ROW VIEW
  if (compact) {
    return (
      <>
        <div
          onClick={() => navigate(`/product/${product.slug}`)}
          className="group p-4 rounded-2xl bg-surface border border-border-subtle hover:border-primary-blue hover:shadow-card-hover transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
        >
          {/* Brand & Name */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <img
              src={product.brandLogo}
              alt={product.name}
              className="w-10 h-10 rounded-xl object-contain bg-canvas p-1.5 border border-border-subtle shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-text-primary group-hover:text-white transition-colors">
                  {product.name}
                </h4>
                {product.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-cyan/15 text-accent-cyan">
                    {product.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-muted font-sans">
                {product.brand} &bull; {product.platformSubtext}
              </span>
            </div>
          </div>

          {/* Quick Specs Chips */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-text-secondary">
            {product.specs?.models && (
              <span className="px-2 py-0.5 rounded bg-canvas border border-border-subtle text-accent-cyan">
                {product.specs.models.split(',')[0]}
              </span>
            )}
            {product.specs?.contextWindow && (
              <span className="px-2 py-0.5 rounded bg-canvas border border-border-subtle text-text-muted">
                {product.specs.contextWindow}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="text-left md:text-right shrink-0">
            <div className="text-base font-bold font-mono text-text-primary">
              {formatPrice(product.currentPriceVND, product.currentPriceUSD)}
              <span className="text-[10px] text-text-muted font-normal ml-1">/month</span>
            </div>
            <div className="text-[11px] text-status-success font-mono font-semibold">
              Save -{product.discountPercent}%
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-0 border-border-subtle">
            <button
              type="button"
              onClick={handleOpenQuickView}
              className="p-2 rounded-xl bg-canvas hover:bg-canvas-subtle border border-border-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Quick view specs"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="p-2 rounded-xl bg-canvas hover:bg-canvas-subtle border border-border-subtle text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
              title="Add to cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleInstantBuy}
              disabled={isOutOfStock}
              className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-accent-cyan text-accent-cyan" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>

        {/* Quick View Modal */}
        {isQuickViewOpen && (
          <QuickViewModal product={product} onClose={() => setIsQuickViewOpen(false)} />
        )}
      </>
    );
  }

  // STANDARD GRID CARD VIEW
  return (
    <>
      <div
        onClick={() => navigate(`/product/${product.slug}`)}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-surface border border-border-subtle hover:border-primary-blue hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Subtle Top Shimmer Beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-blue/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top Header & Badges */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2 rounded-xl bg-canvas border border-border-subtle flex items-center justify-center group-hover:border-border-focus group-hover:shadow-[0_0_12px_rgba(0,102,255,0.2)] transition-all shrink-0">
                <img
                  src={product.brandLogo}
                  alt={product.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary group-hover:text-white transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{product.platformSubtext}</p>
              </div>
            </div>

            {/* Badge */}
            {product.badge && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 whitespace-nowrap">
                {product.badge}
              </span>
            )}
          </div>

          {/* Pricing Block */}
          <div className="my-5 p-3.5 rounded-xl bg-canvas/60 border border-border-subtle/60 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                {formatPrice(product.currentPriceVND, product.currentPriceUSD)}
                <span className="text-xs font-normal text-text-muted ml-1">/month</span>
              </div>
              <div className="text-xs text-text-muted line-through font-mono mt-0.5">
                {formatPrice(product.originalPriceVND, product.originalPriceUSD)}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-status-success/15 text-status-success border border-status-success/30">
              -{product.discountPercent}%
            </span>
          </div>

          {/* Key Specs Pills */}
          {product.specs && (
            <div className="flex flex-wrap gap-1.5 mb-4 text-[10px] font-mono">
              {product.specs.models && (
                <span className="px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-accent-cyan flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-accent-cyan" />
                  <span>{product.specs.models.split(',')[0]}</span>
                </span>
              )}
              {product.specs.contextWindow && (
                <span className="px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-text-muted">
                  {product.specs.contextWindow}
                </span>
              )}
            </div>
          )}

          {/* Feature Checklist */}
          <ul className="space-y-2.5 my-5 text-xs text-text-secondary">
            {product.quotaFeatures.slice(0, 4).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <span className="leading-tight line-clamp-1">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border-subtle/50 space-y-2.5">
          {isOutOfStock ? (
            <button
              disabled
              className="w-full h-11 rounded-xl bg-surface border border-border-subtle text-text-muted text-xs font-semibold cursor-not-allowed"
            >
              Out of stock - Pre-order
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstantBuy}
                className="flex-1 h-11 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 glow-blue-button active:scale-[0.98] transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-accent-cyan fill-accent-cyan" />
                <span>Buy Now (30s)</span>
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-11 h-11 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-primary-blue text-text-secondary hover:text-accent-cyan flex items-center justify-center transition-all group/cart cursor-pointer"
title="Add to cart"
              >
                <ShoppingBag className="w-4 h-4 group-hover/cart:scale-110 transition-transform" />
              </button>
              <button
                type="button"
                onClick={handleOpenQuickView}
                className="w-11 h-11 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-primary-blue text-text-muted hover:text-text-primary flex items-center justify-center transition-all cursor-pointer"
title="Quick view specs"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-1 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
              {product.stockCount} slots available
            </span>
            <span className="text-primary-blue hover:underline flex items-center gap-0.5 font-medium">
              Customize package <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <QuickViewModal product={product} onClose={() => setIsQuickViewOpen(false)} />
      )}
    </>
  );
};

/**
 * Interactive Quick View Spec Modal
 */
const QuickViewModal: React.FC<{ product: ProductPlan; onClose: () => void }> = ({
  product,
  onClose,
}) => {
  const { formatPrice } = useApp();
  const navigate = useNavigate();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border-subtle rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src={product.brandLogo}
              alt={product.name}
              className="w-12 h-12 rounded-xl object-contain bg-canvas p-2 border border-border-subtle"
            />
            <div>
              <h3 className="font-bold text-lg text-text-primary">{product.name}</h3>
              <p className="text-xs text-text-muted">{product.platformSubtext}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing */}
        <div className="p-3.5 rounded-xl bg-canvas flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono text-text-primary">
              {formatPrice(product.currentPriceVND, product.currentPriceUSD)}
            </span>
            <span className="text-xs text-text-muted ml-1">/month</span>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-status-success/15 text-status-success">
            Save -{product.discountPercent}%
          </span>
        </div>

        {/* Specs Table */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-text-muted uppercase text-[10px] tracking-wider block">
            Technical specifications:
          </span>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 rounded-lg bg-canvas border border-border-subtle">
              <span className="text-text-muted text-[10px] block">Quota:</span>
              <span className="font-bold text-accent-cyan">{product.specs?.fastQuota || 'Standard'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-canvas border border-border-subtle">
              <span className="text-text-muted text-[10px] block">Context window:</span>
              <span className="font-bold text-text-primary">{product.specs?.contextWindow || 'Standard'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-canvas border border-border-subtle col-span-2">
              <span className="text-text-muted text-[10px] block">Mô hình AI:</span>
              <span className="font-bold text-text-primary">{product.specs?.models || 'Toàn bộ'}</span>
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-text-muted uppercase text-[10px] tracking-wider block">
            Đặc quyền gói:
          </span>
          <ul className="space-y-1.5 text-text-secondary">
            {product.quotaFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              navigate(`/product/${product.slug}`);
            }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Đến trang cấu hình gói</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
