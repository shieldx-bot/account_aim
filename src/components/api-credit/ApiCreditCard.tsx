import React, { useState } from 'react';
import { ApiCreditAccount } from '@/types';
import { PROVIDER_META } from '@/data/mockApiCreditAccounts';
import { Zap, Eye, ShoppingBag, CheckCircle2, X } from 'lucide-react';

interface ApiCreditCardProps {
  account: ApiCreditAccount;
  onAddToCart: (account: ApiCreditAccount) => void;
}

/**
 * Thẻ sản phẩm "Tài khoản API kèm số dư Credit $"
 * Hiển thị: nhà cung cấp, mức credit $, giá bán, số lượng tài khoản còn lại.
 */
export const ApiCreditCard: React.FC<ApiCreditCardProps> = ({ account, onAddToCart }) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const meta = PROVIDER_META[account.provider];
  const isOutOfStock = account.stockCount === 0;
  const listPriceVND = Math.round(account.creditAmountUSD * 26000);
  const savedVND = listPriceVND - account.priceVND;

  return (
    <>
      <div
        onClick={() => setIsQuickViewOpen(true)}
        className="group relative flex flex-col p-5 rounded-2xl bg-surface border border-border-subtle hover:border-primary-blue hover:shadow-card-hover transition-all cursor-pointer overflow-hidden"
      >
        {/* Glow accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
        />

        {/* Header: Logo + Provider */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={account.brandLogo}
              alt={account.providerName}
              className="w-11 h-11 rounded-xl object-contain bg-canvas p-1.5 border border-border-subtle shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.visibility = 'hidden';
              }}
            />
            <div>
              <h3 className="text-sm font-bold text-text-primary group-hover:text-white transition-colors leading-tight">
                {account.providerName} API
              </h3>
              <span className="text-[11px] font-mono text-text-muted">{meta.website}</span>
            </div>
          </div>
          {account.badge && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/25 whitespace-nowrap shrink-0">
              {account.badge}
            </span>
          )}
        </div>

        {/* Credit Amount Hero Block */}
        <div className="rounded-xl bg-canvas border border-border-subtle px-4 py-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-0.5">
              Số dư credit có sẵn
            </div>
            <div className="text-2xl font-extrabold font-mono text-accent-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.35)]">
              ${account.creditAmountUSD.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-0.5">
              Giá chỉ còn
            </div>
            <div className="text-lg font-bold font-mono text-text-primary">
              {account.priceVND.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[10px] font-mono text-status-success">
              Tiết kiệm {savedVND.toLocaleString('vi-VN')} ₫ ({account.discountPercent}%)
            </div>
          </div>
        </div>

        {/* Models chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {account.includedModels.slice(0, 4).map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-md bg-elevated border border-border-subtle text-[10px] font-mono text-text-secondary truncate max-w-[150px]"
            >
              {m}
            </span>
          ))}
          {account.includedModels.length > 4 && (
            <span className="px-2 py-0.5 text-[10px] font-mono text-text-muted">
              +{account.includedModels.length - 4} model
            </span>
          )}
        </div>

        {/* Stock & Delivery */}
        <div className="flex items-center justify-between text-[11px] font-mono mb-4 mt-auto">
          <span className={isOutOfStock ? 'text-status-error' : 'text-status-success'}>
            ● {isOutOfStock ? 'Hết hàng' : `Còn ${account.stockCount} tài khoản`}
          </span>
          {account.instantDelivery && !isOutOfStock && (
            <span className="flex items-center gap-1 text-accent-cyan">
              <Zap className="w-3 h-3" />
              <span>Giao tức thì &lt; 30s</span>
            </span>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickViewOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-focus transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chi tiết</span>
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(account);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-elevated text-text-muted border border-border-subtle cursor-not-allowed'
                : 'bg-primary-blue text-white hover:bg-primary-blue/90 shadow-glow-blue'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsQuickViewOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-surface border border-border-subtle p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={account.brandLogo}
                alt={account.providerName}
                className="w-12 h-12 rounded-xl object-contain bg-canvas p-1.5 border border-border-subtle"
              />
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {account.providerName} — Tài khoản API ${account.creditAmountUSD} Credit
                </h3>
                <span className="text-[11px] font-mono text-text-muted">{meta.website}</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-4">{account.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-canvas border border-border-subtle">
                <div className="text-sm font-bold font-mono text-accent-cyan">${account.creditAmountUSD}</div>
                <div className="text-[10px] text-text-muted uppercase">Credit $</div>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-border-subtle">
                <div className="text-sm font-bold font-mono text-text-primary">{account.stockCount}</div>
                <div className="text-[10px] text-text-muted uppercase">SL khả dụng</div>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-border-subtle">
                <div className="text-sm font-bold font-mono text-status-success">{account.validityMonths} tháng</div>
                <div className="text-[10px] text-text-muted uppercase">Hạn dùng</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                Model được truy cập qua API
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {account.includedModels.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-1 rounded-md bg-elevated border border-border-subtle text-[10px] font-mono text-accent-cyan"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                Quyền lợi đi kèm
              </h4>
              <ul className="space-y-1.5">
                {account.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <div>
                <div className="text-[10px] text-text-muted line-through font-mono">
                  {(account.creditAmountUSD * 26000).toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-xl font-extrabold font-mono text-text-primary">
                  {account.priceVND.toLocaleString('vi-VN')} ₫
                </div>
              </div>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(account);
                  setIsQuickViewOpen(false);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-elevated text-text-muted cursor-not-allowed'
                    : 'bg-primary-blue text-white hover:bg-primary-blue/90 shadow-glow-blue'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
