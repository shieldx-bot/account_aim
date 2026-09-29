import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    setTimeout(() => setCouponFeedback(null), 3500);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted mx-auto">
          <ShoppingBag className="w-10 h-10 opacity-40" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary">Giỏ hàng của bạn đang trống</h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
          Bạn chưa chọn gói tài khoản AI Pro nào. Hãy duyệt danh mục công cụ để tìm gói phù hợp với công việc!
        </p>
        <div className="pt-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-lg shadow-primary-blue/25"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xem danh mục AI Pro</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
          Giỏ Hàng Của Bạn
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Xem lại cấu hình tài khoản, thời hạn sử dụng và ưu đãi thành viên trước khi thanh toán.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle text-xs text-text-muted">
            <span>Danh sách mặt hàng ({items.length})</span>
            <button
              onClick={clearCart}
              className="text-text-muted hover:text-status-error transition-colors"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-surface border border-border-subtle hover:border-primary-blue/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={item.product.brandLogo}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-contain bg-canvas p-1.5 border border-border-subtle flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{item.product.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-accent-cyan">
                        Gói {item.duration.label}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {item.provisioningType === 'invite_email'
                          ? `Gán email: ${item.targetEmail || 'Email chính chủ'}`
                          : 'Tài khoản cấp sẵn'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-border-subtle">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-canvas rounded-xl p-1 border border-border-subtle">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-xs text-text-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right min-w-[100px]">
                    <span className="font-mono text-sm font-bold text-text-primary block">
                      {formatPrice(
                        item.unitPriceVND * item.quantity,
                        item.unitPriceUSD * item.quantity
                      )}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatPrice(item.unitPriceVND, item.unitPriceUSD)}/gói
                    </span>
                  </div>

                  {/* Trash */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-text-muted hover:text-status-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent-cyan hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Thêm sản phẩm khác vào giỏ</span>
            </Link>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-text-primary pb-3 border-b border-border-subtle">
              Tóm tắt đơn hàng
            </h3>

            {/* Member Tier badge callout */}
            {user && tierDiscountPercent > 0 && (
              <div className="p-3 rounded-xl bg-primary-blue/15 border border-primary-blue/30 text-xs">
                <div className="flex items-center gap-1.5 text-accent-cyan font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ưu đãi thành viên {user.tier}</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Tài khoản của bạn được tự động giảm thêm {tierDiscountPercent}% trên tổng giá trị giỏ hàng.
                </p>
              </div>
            )}

            {/* Voucher input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase">
                Mã giảm giá (Coupon)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="DEVVIP10, AI2025"
                    className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-xl text-xs text-text-primary uppercase font-mono focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-canvas hover:bg-canvas-subtle border border-border-subtle text-xs font-bold text-text-primary hover:text-accent-cyan transition-colors"
                >
                  Áp dụng
                </button>
              </div>

              {couponFeedback && (
                <div
                  className={`text-[11px] font-medium flex items-center gap-1 mt-1 ${
                    couponFeedback.success ? 'text-status-success' : 'text-status-error'
                  }`}
                >
                  {couponFeedback.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>{couponFeedback.message}</span>
                </div>
              )}

              {couponCode && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-status-success/10 border border-status-success/30 text-xs font-mono text-status-success">
                  <span>Mã {couponCode} (-{couponDiscountPercent}%)</span>
                  <button onClick={removeCoupon} className="hover:text-status-error ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>

            {/* Calculations */}
            <div className="space-y-2.5 text-xs font-mono pt-3 border-t border-border-subtle">
              <div className="flex justify-between text-text-secondary">
                <span>Tạm tính ({items.length} gói):</span>
                <span>{formatPrice(subtotalVND, subtotalUSD)}</span>
              </div>

              {(tierDiscountPercent > 0 || couponDiscountPercent > 0) && (
                <div className="flex justify-between text-status-success">
                  <span>Tổng chiết khấu:</span>
                  <span>-{formatPrice(discountVND, discountUSD)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-border-subtle text-text-primary font-bold">
                <span className="font-sans text-sm">Thanh toán:</span>
                <span className="text-xl text-accent-cyan font-mono">
                  {formatPrice(finalTotalVND, finalTotalUSD)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: '/cart' } });
                  return;
                }
                navigate('/checkout');
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40 transition-all hover:scale-[1.01]"
            >
              <span>Tiến hành thanh toán</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
              <span>Bảo mật SSL 256-bit &bull; Bảo hành 1-đổi-1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
