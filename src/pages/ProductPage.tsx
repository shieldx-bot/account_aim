import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { ProvisioningType, DurationOption, ProductPlan } from '@/types';
import { trackEvent } from '@/utils/telemetry';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Mail,
  Check,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';

const DURATION_OPTIONS: { months: number; label: string; discountPercent: number; isGiftExtraMonth?: boolean }[] = [
  { months: 1, label: '1 Tháng', discountPercent: 0 },
  { months: 3, label: '3 Tháng', discountPercent: 15 },
  { months: 6, label: '6 Tháng', discountPercent: 25 },
  { months: 12, label: '12 Tháng', discountPercent: 35, isGiftExtraMonth: true },
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { formatPrice, currency, updateConfig, products } = useApp();
  const { addItem } = useCart();

  // Product is fetched directly from the PostgreSQL-backed API by slug
  const [dbProduct, setDbProduct] = useState<ProductPlan | null>(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState<boolean>(true);
  const [productFetchError, setProductFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      if (!slug) return;
      // Prefer the already-loaded catalog from AppContext to avoid an extra request
      const fromCatalog = products.find((p) => p.slug === slug);
      if (fromCatalog) {
        if (!cancelled) {
          setDbProduct(fromCatalog);
          setIsFetchingProduct(false);
        }
        return;
      }
      try {
        setIsFetchingProduct(true);
        setProductFetchError(null);
        const data = await productsApi.getBySlug(slug);
        if (!cancelled) setDbProduct(data);
      } catch (err) {
        console.error('[ProductPage] Failed to fetch product from database:', err);
        if (!cancelled) setProductFetchError('Không tìm thấy sản phẩm này trong cơ sở dữ liệu.');
      } finally {
        if (!cancelled) setIsFetchingProduct(false);
      }
    };
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [slug, products]);

  const product = dbProduct;

  const [provisioningType, setProvisioningType] = useState<ProvisioningType>('invite_email');
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    if (!product) return;
    trackEvent('view_item', {
      item_id: product.slug,
      item_name: product.name,
      currency,
    });
  }, [product, currency]);

  // Pricing math
  const durationConfig = DURATION_OPTIONS[selectedDurationIndex];
  const baseMonthlyVND = product?.currentPriceVND ?? 0;
  const baseMonthlyUSD = product?.currentPriceUSD ?? 0;

  const rawTotalVND = baseMonthlyVND * durationConfig.months;
  const rawTotalUSD = baseMonthlyUSD * durationConfig.months;

  const discountMultiplier = 1 - durationConfig.discountPercent / 100;
  const finalTotalVND = Math.round(rawTotalVND * discountMultiplier);
  const finalTotalUSD = Number((rawTotalUSD * discountMultiplier).toFixed(2));

  const isGuestEmailValid = EMAIL_REGEX.test(guestEmail.trim());

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    // Bot trap
    if (honeypot) return;

    if (!product) return;

    if (!isGuestEmailValid) {
      setGuestEmailError('Vui lòng nhập địa chỉ email hợp lệ để nhận thông tin license');
      return;
    }

    if (provisioningType === 'invite_email' && !EMAIL_REGEX.test(targetEmail.trim())) {
      setGuestEmailError('Vui lòng nhập email cá nhân cần nâng cấp');
      return;
    }

    trackEvent('begin_checkout', {
      item_id: product.slug,
      provisioning_type: provisioningType,
      duration_months: durationConfig.months,
      total_amount: currency === 'VND' ? finalTotalVND : finalTotalUSD,
      currency,
    });

    updateConfig({
      product,
      provisioningType,
      targetEmail: provisioningType === 'invite_email' ? targetEmail : '',
      duration: {
        months: durationConfig.months,
        label: durationConfig.label,
        discountPercent: durationConfig.discountPercent,
        monthlyEquivalentVND: Math.round(finalTotalVND / durationConfig.months),
        monthlyEquivalentUSD: Number((finalTotalUSD / durationConfig.months).toFixed(2)),
      },
      guestEmail: guestEmail.trim(),
    });

    navigate(`/checkout?plan=${product.slug}`);
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!product) return;

    if (provisioningType === 'invite_email' && !EMAIL_REGEX.test(targetEmail.trim())) {
      setGuestEmailError('Vui lòng nhập email cá nhân cần nâng cấp');
      return;
    }

    addItem({
      product,
      duration: {
        months: durationConfig.months,
        label: durationConfig.label,
        discountPercent: durationConfig.discountPercent,
        monthlyEquivalentVND: Math.round(finalTotalVND / durationConfig.months),
        monthlyEquivalentUSD: Number((finalTotalUSD / durationConfig.months).toFixed(2)),
      },
      provisioningType,
      targetEmail: provisioningType === 'invite_email' ? targetEmail : '',
      quantity: 1,
      unitPriceVND: finalTotalVND,
      unitPriceUSD: finalTotalUSD,
    });
  };

  // Loading / error states while fetching the product from PostgreSQL
  if (!product) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isFetchingProduct ? (
            <>
              <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
              <p className="text-sm text-text-secondary">Đang tải sản phẩm từ cơ sở dữ liệu...</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-text-secondary">
                {productFetchError || 'Không tìm thấy sản phẩm.'}
              </p>
              <Link
                to="/products"
                className="text-sm text-brand-primary hover:underline"
              >
                ← Quay lại danh sách sản phẩm
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-text-muted mb-8">
        <Link to="/" className="hover:text-text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
        </Link>
        <span>/</span>
        <span className="text-text-secondary capitalize">{product.category}</span>
        <span>/</span>
        <span className="text-text-primary font-medium">{product.name}</span>
      </nav>

      {/* 2-Column Asymmetric Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 7 Columns (Configuration & Specs) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Product Header */}
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface border border-border-subtle">
            <div className="w-16 h-16 p-3 rounded-2xl bg-canvas border border-border-subtle shrink-0 flex items-center justify-center">
              <img src={product.brandLogo} alt={product.name} className="w-10 h-10 object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-text-primary">{product.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                  Verified Partner
                </span>
              </div>
              <p className="text-xs text-text-secondary">{product.platformSubtext}</p>
            </div>
          </div>

          {/* STEP 1: Provisioning Type Selector */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-blue text-white flex items-center justify-center text-xs">1</span>
                Chọn Loại Tài Khoản Bàn Giao
              </h2>
              <span className="text-xs text-text-muted">100% Bảo hành chính hãng</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Nâng trên email cá nhân */}
              <div
                onClick={() => setProvisioningType('invite_email')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  provisioningType === 'invite_email'
                    ? 'bg-elevated border-primary-blue shadow-[0_0_15px_rgba(0,102,255,0.2)]'
                    : 'bg-canvas/50 border-border-subtle hover:border-border-focus'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-primary">Nâng Trên Email Cá Nhân</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    provisioningType === 'invite_email' ? 'border-primary-blue bg-primary-blue' : 'border-border-subtle'
                  }`}>
                    {provisioningType === 'invite_email' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Giữ nguyên dữ liệu cũ, không cần đổi tài khoản, bảo mật riêng tư tuyệt đối.
                </p>
              </div>

              {/* Option B: Tài khoản tạo sẵn */}
              <div
                onClick={() => setProvisioningType('pre_created')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  provisioningType === 'pre_created'
                    ? 'bg-elevated border-primary-blue shadow-[0_0_15px_rgba(0,102,255,0.2)]'
                    : 'bg-canvas/50 border-border-subtle hover:border-border-focus'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-primary">Tài Khoản Cấp Sẵn (10s)</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    provisioningType === 'pre_created' ? 'border-primary-blue bg-primary-blue' : 'border-border-subtle'
                  }`}>
                    {provisioningType === 'pre_created' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Nhận tài khoản độc quyền riêng biệt, xuất ngay thông tin đăng nhập sau 10 giây.
                </p>
              </div>
            </div>

            {/* Conditional Input when Invite Email is selected */}
            {provisioningType === 'invite_email' && (
              <div className="mt-4 pt-4 border-t border-border-subtle/60 animate-fadeIn">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Email cá nhân cần nâng cấp (Nhận thư mời):
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="alex.dev@gmail.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-canvas border border-border-subtle focus:border-border-focus focus:outline-none text-xs text-text-primary"
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1.5">
                  ℹ️ Khuyên dùng Gmail để nhận thư mời kích hoạt từ hệ thống quốc tế nhanh nhất.
                </p>
              </div>
            )}
          </div>

          {/* STEP 2: Duration Grid Selector */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-blue text-white flex items-center justify-center text-xs">2</span>
              Chọn Kỳ Hạn Sử Dụng
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DURATION_OPTIONS.map((opt, idx) => {
                const isSelected = selectedDurationIndex === idx;
                const monthlyPriceVND = Math.round(baseMonthlyVND * (1 - opt.discountPercent / 100));
                const monthlyPriceUSD = Number((baseMonthlyUSD * (1 - opt.discountPercent / 100)).toFixed(2));

                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => {
                      setSelectedDurationIndex(idx);
                      trackEvent('customize_plan_duration', { duration_months: opt.months });
                    }}
                    className={`relative p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-elevated border-primary-blue shadow-[0_0_15px_rgba(0,102,255,0.25)]'
                        : 'bg-canvas/60 border-border-subtle hover:border-border-focus'
                    }`}
                  >
                    {opt.discountPercent > 0 && (
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-status-success text-black">
                        -{opt.discountPercent}%
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-bold text-text-primary">{opt.label}</div>
                      <div className="text-xs font-mono text-accent-cyan mt-1">
                        {formatPrice(monthlyPriceVND, monthlyPriceUSD)}/th
                      </div>
                    </div>

                    {opt.isGiftExtraMonth && (
                      <span className="text-[10px] text-status-warning font-semibold mt-2">
                        🎁 Tặng 1 tháng
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Developer Specs Sheet */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-blue text-white flex items-center justify-center text-xs">3</span>
              Thông Số Kỹ Thuật Dành Cho Developer
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle/60">
                <span className="text-text-muted">Hạn ngạch Fast Quota:</span>
                <p className="font-semibold text-text-primary mt-1">{product.specs.fastQuota}</p>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle/60">
                <span className="text-text-muted">Context Window:</span>
                <p className="font-semibold text-text-primary mt-1">{product.specs.contextWindow}</p>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle/60">
                <span className="text-text-muted">Mô hình AI hỗ trợ:</span>
                <p className="font-semibold text-text-primary mt-1">{product.specs.models}</p>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle/60">
                <span className="text-text-muted">Thiết bị đồng bộ:</span>
                <p className="font-semibold text-text-primary mt-1">{product.specs.multiDevice}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 Columns (Sticky Summary Checkout Box) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <ErrorBoundary contextName="ProductPage_SummaryBox">
            <div className="p-6 rounded-2xl bg-surface border border-border-subtle shadow-card-hover">
              <h3 className="font-bold text-base text-text-primary pb-3 border-b border-border-subtle/60 flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng</span>
                <span className="text-xs font-normal text-text-muted">Giao tức thì &lt; 30s</span>
              </h3>

              {/* Line items */}
              <div className="py-4 space-y-3 text-xs border-b border-border-subtle/60">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Gói tài khoản:</span>
                  <span className="font-semibold text-text-primary">{product.name} ({durationConfig.label})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Loại bàn giao:</span>
                  <span className="font-medium text-text-primary">
                    {provisioningType === 'invite_email' ? 'Nâng chính chủ' : 'Cấp sẵn độc quyền'}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Giá gốc niêm yết:</span>
                  <span className="line-through font-mono">
                    {formatPrice(rawTotalVND, rawTotalUSD)}
                  </span>
                </div>
                <div className="flex justify-between text-status-success">
                  <span>Ưu đãi Developer (-{durationConfig.discountPercent}%):</span>
                  <span className="font-mono font-semibold">
                    -{formatPrice(rawTotalVND - finalTotalVND, rawTotalUSD - finalTotalUSD)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Thuế VAT &amp; Phí giao dịch:</span>
                  <span className="font-mono text-status-success font-semibold">+ 0 ₫ (Miễn phí)</span>
                </div>
              </div>

              {/* Total Amount Box with Odometer Effect */}
              <div className="py-4">
                <span className="text-xs text-text-muted">Tổng số tiền thanh toán trọn gói:</span>
                <div className="text-3xl font-extrabold font-mono text-text-primary mt-1 tracking-tight">
                  {formatPrice(finalTotalVND, finalTotalUSD)}
                </div>
              </div>

              {/* Guest Email Input Form */}
              <form onSubmit={handleCheckout} className="space-y-4">
                {/* Honeypot field */}
                <input
                  type="text"
                  name="company_tax_id"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Email nhận License &amp; Hóa đơn:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setGuestEmailError('');
                      }}
                      placeholder="your.email@company.com"
                      className={`w-full h-11 pl-10 pr-8 rounded-xl bg-canvas border text-xs text-text-primary focus:outline-none transition-all ${
                        guestEmailError
                          ? 'border-status-error focus:border-status-error'
                          : isGuestEmailValid
                          ? 'border-status-success focus:border-status-success'
                          : 'border-border-subtle focus:border-border-focus'
                      }`}
                    />
                    {isGuestEmailValid && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-status-success" />
                    )}
                  </div>
                  {guestEmailError && (
                    <p className="text-[11px] text-status-error mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {guestEmailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 glow-blue-button active:scale-[0.98] transition-all"
                  >
                    <Zap className="w-4 h-4 text-accent-cyan fill-accent-cyan" />
                    <span>⚡ Thanh Toán Ngay (30s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full h-11 rounded-xl bg-canvas hover:bg-canvas-subtle border border-border-subtle hover:border-primary-blue text-text-primary text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 text-accent-cyan" />
                    <span>Thêm Vào Giỏ Hàng</span>
                  </button>
                </div>
              </form>

              {/* Guarantees */}
              <div className="mt-5 pt-4 border-t border-border-subtle/50 space-y-2 text-[11px] text-text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Cam kết hoàn tiền 100% nếu tài khoản lỗi không kích hoạt được</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary-blue shrink-0" />
                  <span>Bảo mật SSL 256-bit &bull; Không lưu mật khẩu cá nhân</span>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA Bar (Thumb Zone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-surface/95 backdrop-blur-md border-t border-border-subtle z-40 flex items-center justify-between gap-3 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
        <div>
          <div className="text-[11px] text-text-muted leading-tight">{product.name} ({durationConfig.label})</div>
          <div className="text-base font-bold font-mono text-text-primary">
            {formatPrice(finalTotalVND, finalTotalUSD)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="h-11 px-3.5 rounded-xl bg-canvas border border-border-subtle text-text-primary text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
            title="Thêm vào giỏ"
          >
            <ShoppingBag className="w-4 h-4 text-accent-cyan" />
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            className="h-11 px-4 rounded-xl bg-primary-blue text-white text-xs font-bold flex items-center gap-1.5 shrink-0 glow-blue-button"
          >
            <Zap className="w-3.5 h-3.5 text-accent-cyan fill-accent-cyan" />
            <span>Thanh toán 30s</span>
          </button>
        </div>
      </div>
    </div>
  );
};
