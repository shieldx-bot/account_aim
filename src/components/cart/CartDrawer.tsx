import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    couponCode,
    couponDiscountPercent,
    applyCoupon,
    removeCoupon,
    subtotalVND,
    subtotalUSD,
    discountVND,
    discountUSD,
    finalTotalVND,
    finalTotalUSD,
    tierDiscountPercent,
  } = useCart();

  const { formatPrice } = useApp();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    setTimeout(() => setCouponFeedback(null), 3500);
  };

  const handleProceedCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border-subtle shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-canvas/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-blue/15 text-accent-cyan flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Giỏ hàng của bạn</h3>
                <span className="text-[11px] text-text-muted font-mono">
                  {items.length} mặt hàng được chọn
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-text-muted hover:text-status-error font-medium px-2 py-1 rounded"
                  title="Xóa tất cả"
                >
                  Xóa hết
                </button>
              )}
              <button
                onClick={closeCart}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Member Tier Discount Banner */}
          {user && tierDiscountPercent > 0 ? (
            <div className="px-5 py-2.5 bg-primary-blue/10 border-b border-primary-blue/20 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-accent-cyan font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ưu đãi {user.tier}: Giảm thêm {tierDiscountPercent}%</span>
              </span>
              <span className="font-mono text-status-success font-bold">
                -{formatPrice(discountVND, discountUSD)}
              </span>
            </div>
          ) : (
            <div className="px-5 py-2 bg-canvas/60 border-b border-border-subtle text-[11px] text-text-muted flex items-center justify-between">
              <span>Đăng nhập tài khoản để nhận chiết khấu VIP Dev đến 10%</span>
              <Link
                to="/login"
                onClick={closeCart}
                className="text-accent-cyan hover:underline font-semibold"
              >
                Đăng nhập
              </Link>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-text-muted space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-canvas border border-border-subtle flex items-center justify-center text-text-muted">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">Giỏ hàng của bạn đang trống</h4>
                <p className="text-xs text-text-secondary max-w-[220px]">
                  Chưa có gói tài khoản AI Pro nào được chọn. Hãy khám phá danh mục và thêm vào giỏ!
                </p>
                <a
                  href="/products"
                  onClick={closeCart}
                  className="mt-2 px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-blue/25"
                >
                  Khám phá các gói AI Pro
                </a>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-canvas border border-border-subtle hover:border-primary-blue/30 transition-all space-y-3 font-mono text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={item.product.brandLogo}
                        alt={item.product.name}
                        className="w-8 h-8 rounded-lg object-contain bg-surface p-1 border border-border-subtle flex-shrink-0"
                      />
                      <div className="font-sans">
                        <h4 className="text-xs font-bold text-text-primary leading-snug">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-accent-cyan">
                            {item.duration.label}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {item.provisioningType === 'invite_email' ? 'Email chính chủ' : 'Tài khoản cấp sẵn'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-text-muted hover:text-status-error transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.targetEmail && (
                    <div className="text-[11px] text-text-muted bg-surface px-2 py-1 rounded truncate">
                      Gán quyền: <span className="text-text-primary">{item.targetEmail}</span>
                    </div>
                  )}

                  {/* Quantity & Line Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                    <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-border-subtle">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded hover:bg-canvas text-text-secondary hover:text-text-primary"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-text-primary">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded hover:bg-canvas text-text-secondary hover:text-text-primary"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-text-primary block font-mono">
                        {formatPrice(
                          item.unitPriceVND * item.quantity,
                          item.unitPriceUSD * item.quantity
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-5 border-t border-border-subtle bg-canvas/60 space-y-4">
              {/* Coupon Code Section */}
              <div>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Mã voucher (DEVVIP10, AI2025)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted font-mono uppercase focus:outline-none focus:border-primary-blue"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle text-xs font-semibold text-text-primary hover:text-accent-cyan transition-colors"
                  >
                    Áp dụng
                  </button>
                </form>

                {couponFeedback && (
                  <div
                    className={`mt-1.5 text-[11px] font-medium flex items-center gap-1 ${
                      couponFeedback.success ? 'text-status-success' : 'text-status-error'
                    }`}
                  >
                    {couponFeedback.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>{couponFeedback.message}</span>
                  </div>
                )}

                {couponCode && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-status-success/10 border border-status-success/30 text-[11px] font-mono text-status-success">
                    <span>Mã {couponCode} (-{couponDiscountPercent}%)</span>
                    <button onClick={removeCoupon} className="hover:text-status-error">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-text-secondary">
                  <span>Tạm tính ({items.length} món):</span>
                  <span>{formatPrice(subtotalVND, subtotalUSD)}</span>
                </div>

                {(tierDiscountPercent > 0 || couponDiscountPercent > 0) && (
                  <div className="flex justify-between text-status-success">
                    <span>Chiết khấu ({tierDiscountPercent + couponDiscountPercent}%):</span>
                    <span>-{formatPrice(discountVND, discountUSD)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-border-subtle text-text-primary font-bold">
                  <span className="font-sans text-xs">Tổng thanh toán:</span>
                  <span className="text-base text-accent-cyan font-mono">
                    {formatPrice(finalTotalVND, finalTotalUSD)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleProceedCheckout}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40 transition-all hover:scale-[1.01]"
                >
                  <span>Thanh toán giỏ hàng ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                  <span>Bảo hành 1-1 &bull; Giao tức thì &lt; 30s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
