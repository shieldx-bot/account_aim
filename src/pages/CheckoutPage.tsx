import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/utils/telemetry';
import { openTelegramSupport } from '@/utils/diagnostics';
import { ordersApi } from '@/services/api';
import { peekPendingReferral, consumePendingReferral, captureRefFromUrl } from '@/utils/referral';
import { playSuccessChime } from '@/utils/sound';
import { VietQRContainer } from '@/components/checkout/VietQRContainer';
import type { PaymentMethod, VietQRData } from '@/types';
import {
  Check,
  Clock,
  ShieldCheck,
  CreditCard,
  Loader2,
  Lock,
  ArrowRight,
  Shield,
  Sparkles,
  RefreshCw,
  Copy,
  Bitcoin,
} from 'lucide-react';

const ORDER_DURATION_SECONDS = 600; // 10 minutes (AIPRO-109)
const TAB_STORAGE_KEY = 'aipro_checkout_tab';
const USD_VND_RATE = 25500; // Tỷ giá USDT/VND cố định trong phiên (Spec Trang 3, Tab 3)

// Stable test/demo banking info (SePay-style dynamic QR target account).
const VIETQR_BANK = {
  bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
  accountNumber: '0711000255888',
  accountHolder: 'CONG TY TNHH AI PRO GLOBAL',
};

type CheckoutTab = Extract<PaymentMethod, 'vietqr' | 'stripe_card' | 'crypto_usdt'>;

const isCheckoutTab = (v: unknown): v is CheckoutTab =>
  v === 'vietqr' || v === 'stripe_card' || v === 'crypto_usdt';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeConfig } = useApp();
  const { user, token } = useAuth();
  const { items, finalTotalVND, finalTotalUSD, discountVND, discountUSD, couponCode, clearCart } = useCart();

  // ── AIPRO-107: 3 payment tabs — VietQR (default) / Stripe / Crypto USDT ──
  const [paymentTab, setPaymentTab] = useState<CheckoutTab>(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (isCheckoutTab(saved)) return saved;
    } catch { /* private mode */ }
    return 'vietqr';
  });

  // Persist favourite tab (DoD AIPRO-107)
  useEffect(() => {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, paymentTab);
    } catch { /* ignore */ }
  }, [paymentTab]);

  const [timeLeft, setTimeLeft] = useState(ORDER_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<'idle' | 'authorizing' | 'capturing' | 'completed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ── VietQR state (AIPRO-108) ──
  const [qrLoading, setQrLoading] = useState(true);
  const [vietqr, setVietqr] = useState<VietQRData | null>(null);

  // ── Webhook/polling confirmation state (AIPRO-110) ──
  const [awaitingTransfer, setAwaitingTransfer] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // ── Referral attribution (#InviteToPay) ──
  const [referralCode] = useState<string | null>(() => {
    const fromState = (location.state as any)?.referralCode as string | undefined;
    if (fromState) return String(fromState).toUpperCase();
    return captureRefFromUrl() ?? peekPendingReferral()?.code ?? null;
  });

  // Card inputs (Stripe Elements mock — dark-mode synced, Spec Tab 2)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Session-stable identifiers
  const orderIdRef = useRef(`AIPRO${Math.floor(100000 + Math.random() * 900000)}`);
  const cryptoAddressRef = useRef('TQn9Y2kcF6...iU7pRz'); // demo TRC-20 address, stable per session
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCartMode = items.length > 0;

  const totalAmountVND = isCartMode
    ? finalTotalVND
    : (activeConfig?.duration.monthlyEquivalentVND ?? 0) * (activeConfig?.duration.months ?? 0);
  const totalAmountUSD = isCartMode
    ? finalTotalUSD
    : (activeConfig?.duration.monthlyEquivalentUSD ?? 0) * (activeConfig?.duration.months ?? 0);

  useEffect(() => {
    trackEvent('checkout_viewed', {
      order_id: orderIdRef.current,
      product: isCartMode ? `${items.length} items` : activeConfig?.product.name ?? 'unknown',
      amount_usd: totalAmountUSD,
      currency: 'USD',
      gateway: paymentTab,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard: no cart items and no DB-backed configuration → nothing to checkout
  useEffect(() => {
    if (!isCartMode && !activeConfig) {
      navigate('/', { replace: true });
    }
  }, [isCartMode, activeConfig, navigate]);

  // ── AIPRO-109: 10-minute countdown, wall-clock based (survives tab switches) ──
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, ORDER_DURATION_SECONDS - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
        trackEvent('checkout_timer_expired', { order_id: orderIdRef.current });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Build the dynamic VietQR payload for the current slot/memo ──
  const generateVietqr = useCallback(() => {
    setQrLoading(true);
    // Simulate SePay dynamic-QR API latency (real integration replaces this fetch).
    const t = setTimeout(() => {
      setVietqr({
        ...VIETQR_BANK,
        amount: Math.round(totalAmountVND),
        transferMemo: `AIPRO${orderIdRef.current.replace(/^AIPRO/, '')}`,
        qrCodeUrl: '', // rendered client-side by VietQRContainer
      });
      setQrLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, [totalAmountVND]);

  useEffect(() => {
    if (paymentTab === 'vietqr') return generateVietqr();
  }, [paymentTab, generateVietqr]);

  const handleRefreshQr = () => {
    // "🔄 Làm mới mã thanh toán": new slot + new memo + restart timer (AIPRO-109 DoD)
    orderIdRef.current = `AIPRO${Math.floor(100000 + Math.random() * 900000)}`;
    setAwaitingTransfer(false);
    setCreatedOrderId(null);
    setIsExpired(false);
    setTimeLeft(ORDER_DURATION_SECONDS);
    setPaymentError(null);
    generateVietqr();
    trackEvent('vietqr_refreshed', { order_id: orderIdRef.current });
  };

  // Format card number with spaces (#### #### #### ####)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(value.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  // Format expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value);
  };

  const detectedCardType = cardNumber.startsWith('4')
    ? 'visa'
    : cardNumber.startsWith('5')
    ? 'mastercard'
    : 'unknown';

  // ── Create the real order row in DB (shared by all gateways) ──
  const createOrderInDb = async (method: PaymentMethod, gatewayRef: string): Promise<string> => {
    if (!token) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    const base = {
      guestEmail: user?.email ?? activeConfig?.guestEmail ?? '',
      discountVND,
      discountUSD,
      totalVND: totalAmountVND,
      totalUSD: totalAmountUSD,
      currency: 'USD',
      paymentMethod: method,
      paymentGatewayRef: gatewayRef,
      referralCode: consumePendingReferral() ?? referralCode ?? undefined,
    };

    let resultOrderId = orderIdRef.current;
    if (isCartMode && items.length > 0) {
      const firstItem = items[0];
      const res = await ordersApi.create(token, {
        productId: firstItem.product.id,
        productName: firstItem.product.name,
        productSlug: firstItem.product.slug,
        planDurationMonths: firstItem.duration.months,
        provisioningType: firstItem.provisioningType,
        targetEmail: firstItem.targetEmail,
        quantity: firstItem.quantity,
        unitPriceVND: firstItem.unitPriceVND,
        unitPriceUSD: firstItem.unitPriceUSD,
        ...base,
      });
      if (res.data?.orderId) resultOrderId = res.data.orderId;
      clearCart();
    } else if (activeConfig) {
      const res = await ordersApi.create(token, {
        productId: activeConfig.product.id,
        productName: activeConfig.product.name,
        productSlug: activeConfig.product.slug,
        planDurationMonths: activeConfig.duration.months,
        provisioningType: activeConfig.provisioningType,
        targetEmail: activeConfig.targetEmail,
        quantity: 1,
        unitPriceVND: activeConfig.duration.monthlyEquivalentVND * activeConfig.duration.months,
        unitPriceUSD: activeConfig.duration.monthlyEquivalentUSD * activeConfig.duration.months,
        ...base,
      });
      if (res.data?.orderId) resultOrderId = res.data.orderId;
    }
    return resultOrderId;
  };

  const finalizeSuccess = (orderId: string, method: PaymentMethod) => {
    setProcessStage('completed');
    setPaymentSuccess(true);
    playSuccessChime(); // AIPRO-110: subtle success chime
    trackEvent('purchase', {
      transaction_id: orderId,
      referral_code: referralCode ?? undefined,
      value: totalAmountUSD,
      currency: 'USD',
      payment_method: method,
      card_type: method === 'stripe_card' ? detectedCardType : undefined,
      items: isCartMode
        ? items.map((i) => ({ item_id: i.product.slug, item_name: i.product.name, quantity: i.quantity }))
        : [{ item_id: activeConfig?.product.slug ?? '', item_name: activeConfig?.product.name ?? '', quantity: 1 }],
    });
    // Auto-redirect to Trang 4 after exactly 1.2s (DoD AIPRO-110)
    setTimeout(() => navigate(`/order/success/${orderId}`), 1200);
  };

  // ── AIPRO-110: lightweight polling listener (2s) emulating the banking webhook ──
  // When Backend confirms the transfer matched amount+memo → chime, ✓, redirect 1.2s.
  const startWebhookPolling = (orderId: string) => {
    setAwaitingTransfer(true);
    setIsProcessing(false);
    setProcessStage('idle');
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    let ticks = 0;
    pollTimerRef.current = setInterval(() => {
      ticks += 1;
      // Demo behaviour: SePay/Casso webhook typically fires in 1.5–3s; simulate confirm at ~6s.
      // Replace with real GET /api/orders/:id status check or WebSocket event when gateway live.
      if (ticks >= 3 && !isExpired) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        finalizeSuccess(orderId, 'vietqr');
      }
    }, 2000);
  };

  useEffect(() => () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  // ── Tab 1: VietQR — create pending order, then listen for the bank transfer ──
  const handleStartVietqrPayment = async () => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (isExpired) {
      handleRefreshQr();
      return;
    }
    setIsProcessing(true);
    setPaymentError(null);
    setProcessStage('authorizing');
    trackEvent('payment_initiated', { order_id: orderIdRef.current, sub_method: 'vietqr', amount_vnd: totalAmountVND });
    try {
      const health = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/health`).then((r) => r.json());
      if (health?.postgres !== 'connected') {
        throw new Error('Gateway tạm thời không sẵn sàng. Vui lòng thử lại.');
      }
      setProcessStage('capturing');
      const oid = await createOrderInDb('vietqr', `SEPAY-${orderIdRef.current}`);
      setCreatedOrderId(oid);
      startWebhookPolling(oid);
    } catch (err: any) {
      console.error('[Checkout] VietQR order creation failed:', err);
      setIsProcessing(false);
      setProcessStage('idle');
      setPaymentError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    }
  };

  // ── Tab 2: Stripe card charge (Elements-style flow) ──
  const handleExecuteStripePayment = async () => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 15 || cardExpiry.length < 4 || cardCvv.length < 3 || !cardHolder.trim()) {
      setPaymentError('Vui lòng điền đầy đủ thông tin thẻ hợp lệ.');
      return;
    }
    setPaymentError(null);
    setIsProcessing(true);
    setProcessStage('authorizing');
    trackEvent('payment_initiated', { order_id: orderIdRef.current, sub_method: 'stripe_card', amount_usd: totalAmountUSD });
    try {
      const health = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/health`).then((r) => r.json());
      if (health?.postgres !== 'connected') {
        throw new Error('Gateway tạm thời không sẵn sàng. Vui lòng thử lại.');
      }
      setProcessStage('capturing');
      const oid = await createOrderInDb('stripe_card', `STRIPE-${Date.now()}`);
      finalizeSuccess(oid, 'stripe_card');
    } catch (err: any) {
      console.error('[Checkout] Stripe payment failed:', err);
      setIsProcessing(false);
      setProcessStage('idle');
      setPaymentError(err.message || 'Thanh toán thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    }
  };

  // ── Tab 3: Crypto USDT — create pending order, then poll on-chain confirmation ──
  const handleExecuteCryptoPayment = async () => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (isExpired) {
      handleRefreshQr();
      return;
    }
    setPaymentError(null);
    setIsProcessing(true);
    setProcessStage('authorizing');
    trackEvent('payment_initiated', { order_id: orderIdRef.current, sub_method: 'crypto_usdt', amount_usd: totalAmountUSD });
    try {
      const health = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/health`).then((r) => r.json());
      if (health?.postgres !== 'connected') {
        throw new Error('Gateway tạm thời không sẵn sàng. Vui lòng thử lại.');
      }
      setProcessStage('capturing');
      const oid = await createOrderInDb('crypto_usdt', `USDTTRC20-${orderIdRef.current}`);
      startWebhookPolling(oid);
    } catch (err: any) {
      console.error('[Checkout] Crypto order creation failed:', err);
      setIsProcessing(false);
      setProcessStage('idle');
      setPaymentError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    }
  };

  const usdtAmount = (totalAmountUSD + Number.EPSILON).toFixed(2);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerProgress = (timeLeft / ORDER_DURATION_SECONDS) * 100;

  const tabDefs: Array<{ id: CheckoutTab; label: string; note: string; logo: string }> = [
    { id: 'vietqr', label: 'VietQR Tự Động', note: 'Khuyên dùng tại VN · Miễn phí', logo: '/assets/logos/logo_pay_vietqr.svg' },
    { id: 'stripe_card', label: 'Thẻ Quốc Tế', note: 'Visa / MC / Apple Pay', logo: '/assets/logos/logo_pay_stripe.svg' },
    { id: 'crypto_usdt', label: 'Crypto USDT', note: 'Web3 · Solana / Arbitrum', logo: '/assets/logos/logo_pay_usdt_crypto.svg' },
  ];

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {/* SUCCESS OVERLAY (Webhook confirmed payment — AIPRO-110) */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 bg-canvas/90 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="text-center p-8 rounded-2xl bg-surface border border-status-success/40 shadow-[0_0_50px_rgba(16,185,129,0.3)] max-w-md mx-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success mx-auto mb-4 flex items-center justify-center">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary">✓ ĐÃ NHẬN THANH TOÁN</h2>
            <p className="text-xs text-text-secondary mt-2">
              Giao dịch đã được xác nhận an toàn. Đang tự động chuyển tiếp đến License Vault...
            </p>
            <div className="w-full h-1.5 bg-canvas rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-status-success animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 7 Cols (Multi-gateway checkout) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Referral Attribution Banner (#InviteToPay) */}
          {referralCode && (
            <div className="p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/30 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-accent-cyan shrink-0" />
              <p className="text-xs text-text-secondary">
                Đơn hàng này được quy kết cho lời mời{' '}
                <span className="font-mono font-bold text-accent-cyan">{referralCode}</span> — người gửi lời mời
                sẽ tự động nhận quà sau khi thanh toán hợp lệ (FAB).
              </p>
            </div>
          )}

          {/* Guest Email Verified Notice */}
          <div className="p-4 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary-blue/10 text-primary-blue">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-text-muted block">Tài khoản &amp; bản quyền sẽ gửi về:</span>
                <span className="text-xs font-semibold text-text-primary font-mono">
                  {activeConfig?.guestEmail || user?.email || 'Khách vãng lai (Chưa nhập mail)'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-primary-blue hover:underline font-medium cursor-pointer"
            >
              Đổi email
            </button>
          </div>

          {/* MAIN CHECKOUT CARD */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle shadow-card-hover space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-border-subtle">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span>Chọn Cổng Thanh Toán</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40 font-bold">
                    TỰ ĐỘNG XÁC NHẬN
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Đa kênh phù hợp cho Dev Việt Nam lẫn Quốc tế
                </p>
              </div>
              <img src="/assets/logos/logo_aipro_main_dark.svg" alt="AIPro" className="h-7 hidden sm:block opacity-80" />
            </div>

            {/* ── AIPRO-107: 3 payment tabs ── */}
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Phương thức thanh toán">
              {tabDefs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={paymentTab === tab.id}
                  onClick={() => setPaymentTab(tab.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                    paymentTab === tab.id
                      ? 'bg-elevated border-primary-blue shadow-[0_0_15px_rgba(0,102,255,0.25)]'
                      : 'bg-canvas/60 border-border-subtle hover:border-border-focus'
                  }`}
                >
                  <img src={tab.logo} alt={tab.label} className="h-5 w-auto object-contain" />
                  <span className="text-[11px] sm:text-xs font-bold text-text-primary leading-tight">{tab.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-text-muted leading-tight">{tab.note}</span>
                </button>
              ))}
            </div>

            {/* Price banner */}
            <div className="p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-text-muted block">Số tiền cần thanh toán:</span>
                <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                  {paymentTab === 'stripe_card' ? (
                    <span className="text-2xl font-extrabold font-mono text-[#FFC439]">${totalAmountUSD.toFixed(2)} USD</span>
                  ) : paymentTab === 'crypto_usdt' ? (
                    <span className="text-2xl font-extrabold font-mono text-[#26A17B]">{usdtAmount} USDT</span>
                  ) : (
                    <span className="text-2xl font-extrabold font-mono text-[#FFC439]">
                      {Math.round(totalAmountVND).toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-text-muted space-y-0.5 text-left sm:text-right">
                <div className="flex items-center gap-1 sm:justify-end text-status-success font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{paymentTab === 'vietqr' ? 'Miễn phí giao dịch · Xác nhận tự động' : 'Bảo mật PCI-DSS · Buyer Protection'}</span>
                </div>
                <div>
                  {paymentTab === 'crypto_usdt'
                    ? `Tỷ giá phiên: 1 USDT ≈ ${USD_VND_RATE.toLocaleString('vi-VN')} ₫`
                    : paymentTab === 'stripe_card'
                    ? 'Billing currency: US Dollars (USD)'
                    : 'Chuyển khoản ngân hàng chính xác từng đồng'}
                </div>
              </div>
            </div>

            {/* Error */}
            {paymentError && (
              <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/40 text-xs text-status-error font-medium animate-fadeIn">
                ⚠️ {paymentError}
              </div>
            )}

            {/* Processing overlay (Stripe) */}
            {isProcessing && (
              <div className="p-6 rounded-2xl bg-canvas border border-[#FFC439]/40 space-y-4 text-center animate-fadeIn">
                <div className="flex items-center justify-center gap-2 text-[#FFC439]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-bold">
                    {processStage === 'authorizing' && 'Đang kết nối cổng thanh toán an toàn Stripe Gateway...'}
                    {processStage === 'capturing' &&
                      (paymentTab === 'stripe_card'
                        ? 'Đang xác thực bảo mật thẻ Visa / Mastercard 3D-Secure...'
                        : 'Đang khởi tạo đơn hàng chờ đối soát tự động...')}
                    {processStage === 'completed' && 'Thanh toán thành công! Đang tự động cấp bản quyền...'}
                  </span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFC439] to-status-success transition-all duration-700"
                    style={{ width: processStage === 'authorizing' ? '40%' : processStage === 'capturing' ? '80%' : '100%' }}
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi hệ thống mã hóa giao dịch.
                </p>
              </div>
            )}

            {/* ════════ TAB PANELS ════════ */}
            {!isProcessing && (
              <div>
                {/* ── SUB-PANEL 1: VIETQR AUTO-VERIFY (AIPRO-108/110) ── */}
                {paymentTab === 'vietqr' && (
                  <div className="space-y-5">
                    {awaitingTransfer ? (
                      /* Webhook listening state */
                      <div className="p-6 rounded-2xl bg-canvas border border-primary-blue/40 text-center space-y-4 animate-fadeIn">
                        <div className="relative w-16 h-16 mx-auto">
                          <span className="absolute inset-0 rounded-full border-2 border-primary-blue/60 animate-[radarPulse_1.8s_ease-out_infinite]" />
                          <span className="absolute inset-0 rounded-full border-2 border-primary-blue/40 animate-[radarPulse_1.8s_ease-out_infinite_0.6s]" />
                          <div className="absolute inset-0 rounded-full bg-primary-blue/10 flex items-center justify-center">
                            <Clock className="w-7 h-7 text-primary-blue" />
                          </div>
                        </div>
                        <p className="text-sm font-bold text-text-primary">
                          Đang chờ Webhook ngân hàng xác nhận...
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Hệ thống phát hiện giao dịch khớp số tiền &amp; nội dung{' '}
                          <span className="font-mono font-bold text-accent-cyan">{vietqr?.transferMemo}</span>. Không rời khỏi trang này.
                        </p>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-primary-blue animate-marquee rounded-full" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <VietQRContainer
                          data={vietqr}
                          loading={qrLoading}
                          isExpired={isExpired}
                          onRefresh={handleRefreshQr}
                        />
                        <button
                          type="button"
                          onClick={handleStartVietqrPayment}
                          disabled={qrLoading || isExpired}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0052CC] via-primary-blue to-[#0079C1] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-blue/25 transition-all cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Tôi đã chuyển khoản — Bắt đầu đối soát tự động</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                        <p className="text-[11px] text-text-muted text-center">
                          * Mở app ngân hàng, quét mã hoặc sao chép nội dung chuyển. Tiền về tới đâu, hệ thống xác nhận tới đó (1.5–3 giây).
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* ── SUB-PANEL 2: STRIPE CARD (Spec Tab 2 — Elements dark-mode) ── */}
                {paymentTab === 'stripe_card' && (
                  <div className="space-y-4 p-5 rounded-2xl bg-canvas border border-border-subtle animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                        <CreditCard className="w-4 h-4 text-[#635BFF]" />
                        <span>Nhập thông tin thẻ (Stripe Secure)</span>
                      </div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Lock className="w-3 h-3 text-status-success" />
                        Bảo mật PCI-DSS bởi Stripe
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-text-muted block mb-1">Số thẻ Visa / Mastercard</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4242 •••• •••• 4242"
                          className="w-full pl-3.5 pr-20 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue tracking-wider"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {detectedCardType === 'visa' && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 font-extrabold text-[10px] font-mono">VISA</span>
                          )}
                          {detectedCardType === 'mastercard' && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-600/30 text-orange-400 font-extrabold text-[10px] font-mono">MC</span>
                          )}
                          {detectedCardType === 'unknown' && (
                            <span className="text-[10px] text-text-muted font-mono">VISA / MC</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">Hạn dùng (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM / YY"
                          className="w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">Mã bảo mật CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue text-center tracking-widest"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-text-muted block mb-1">Tên in trên thẻ (Không dấu)</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue uppercase"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteStripePayment}
                      className="w-full mt-2 py-3.5 rounded-xl bg-[#635BFF] hover:brightness-110 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/25 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Thanh toán ${totalAmountUSD.toFixed(2)} USD qua Stripe</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>

                    <p className="text-[11px] text-text-muted text-center">
                      * Hỗ trợ Visa, Mastercard, Apple Pay &amp; Google Pay. Nhấn thanh toán để mô phỏng giao dịch 3D-Secure qua cổng Stripe.
                    </p>
                  </div>
                )}

                {/* ── SUB-PANEL 3: CRYPTO USDT (Spec Tab 3) ── */}
                {paymentTab === 'crypto_usdt' && (
                  <div className="space-y-4 p-5 rounded-2xl bg-canvas border border-[#26A17B]/30 animate-fadeIn">
                    {awaitingTransfer ? (
                      <div className="py-6 text-center space-y-3">
                        <Bitcoin className="w-10 h-10 text-[#26A17B] mx-auto animate-pulse" />
                        <p className="text-sm font-bold text-text-primary">Đang chờ xác nhận on-chain...</p>
                        <p className="text-[11px] text-text-muted">
                          Giao dịch USDT của bạn sẽ được đối soát tự động qua blockchain explorer webhook.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-text-secondary">
                          Thanh toán bằng <span className="font-bold text-[#26A17B]">USDT (TRC-20 / Solana / Arbitrum)</span>. Tỷ giá USDT/VND được
                          <span className="font-semibold text-text-primary"> cố định trong suốt phiên checkout</span> — không lo trượt giá.
                        </p>

                        <div className="p-3 bg-surface rounded-xl border border-border-subtle flex items-center justify-between text-xs font-mono">
                          <span className="text-text-muted">Số tiền gửi chính xác:</span>
                          <span className="font-bold text-[#26A17B]">{usdtAmount} USDT</span>
                        </div>

                        <div className="p-3 bg-surface rounded-xl border border-border-subtle flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-text-muted block">Địa chỉ ví nhận (TRC-20)</span>
                            <span className="text-xs font-mono font-bold text-text-primary break-all">{cryptoAddressRef.current}</span>
                          </div>
                          <button
                            type="button"
                            disabled={isExpired}
                            onClick={async () => {
                              await navigator.clipboard.writeText(cryptoAddressRef.current).catch(() => undefined);
                              trackEvent('crypto_address_copied', { order_id: orderIdRef.current });
                            }}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-canvas border-border-subtle text-[11px] font-semibold text-text-secondary hover:border-primary-blue hover:text-primary-blue transition-all cursor-pointer disabled:opacity-40"
                          >
                            <Copy className="w-3.5 h-3.5" /> Sao chép
                          </button>
                        </div>

                        {isExpired && (
                          <button
                            type="button"
                            onClick={handleRefreshQr}
                            className="w-full py-2.5 rounded-xl bg-primary-blue text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" /> 🔄 Làm mới phiên thanh toán
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleExecuteCryptoPayment}
                          disabled={isExpired}
                          className="w-full py-3.5 rounded-xl bg-[#26A17B] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#26A17B]/25 transition-all cursor-pointer"
                        >
                          <Bitcoin className="w-4 h-4" />
                          <span>Tôi đã gửi {usdtAmount} USDT — Kích hoạt đối soát</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                        <p className="text-[11px] text-text-muted text-center">
                          * Gửi đúng số tiền và ghi rõ mã đơn <span className="font-mono font-bold">{orderIdRef.current}</span> trong memo nếu chain yêu cầu.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Trust Badges */}
            <div className="pt-4 border-t border-border-subtle/80 flex flex-wrap items-center justify-center gap-5 text-[11px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-status-success" /> Mã hóa SSL 256-bit chuẩn PCI
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFC439]" /> Bảo vệ người mua 180 ngày
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-cyan" /> Kích hoạt bản quyền tức thì &lt; 30s
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 Cols (Order summary & 10-min countdown timer) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle shadow-card-hover">
            {/* 10-Minute Countdown Clock (AIPRO-109) */}
            <div className="pb-4 border-b border-border-subtle/60">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Clock className="w-4 h-4 text-status-warning" />
                  Thời gian giữ slot tài khoản:
                </span>
                <span className="font-mono text-base font-bold text-status-warning">{timerString}</span>
              </div>
              <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                <div className="h-full bg-status-warning transition-all duration-1000" style={{ width: `${timerProgress}%` }} />
              </div>
              {isExpired && (
                <button
                  type="button"
                  onClick={handleRefreshQr}
                  className="mt-3 w-full py-2 rounded-lg bg-primary-blue/15 border border-primary-blue/40 text-primary-blue text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-primary-blue/25 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới phiên thanh toán
                </button>
              )}
            </div>

            {/* Order Details */}
            <div className="py-4 space-y-3 text-xs border-b border-border-subtle/60">
              <div className="flex justify-between font-medium">
                <span className="text-text-secondary">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-text-primary">{createdOrderId ?? orderIdRef.current}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Sản phẩm:</span>
                <span className="font-semibold text-text-primary">
                  {isCartMode ? `${items.length} sản phẩm trong giỏ` : `${activeConfig?.product.name ?? '—'} (${activeConfig?.duration.label ?? '—'})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cổng thanh toán:</span>
                <span className="font-semibold text-[#FFC439] flex items-center gap-1">
                  <span>
                    {paymentTab === 'vietqr' ? 'VietQR (SePay/Casso)' : paymentTab === 'stripe_card' ? 'Stripe (Visa/MC)' : 'Crypto USDT (Web3)'}
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Loại bàn giao:</span>
                <span className="text-text-primary">
                  {activeConfig?.provisioningType === 'invite_email' ? 'Nâng chính chủ' : 'Cấp sẵn độc quyền'}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Bàn giao SLA:</span>
                <span className="text-status-success font-semibold">&lt; 30 giây</span>
              </div>
            </div>

            {/* Total */}
            <div className="py-4 flex items-baseline justify-between">
              <span className="text-xs text-text-muted">Tổng thanh toán:</span>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-mono text-[#FFC439] block">
                  {paymentTab === 'stripe_card'
                    ? `$${totalAmountUSD.toFixed(2)} USD`
                    : paymentTab === 'crypto_usdt'
                    ? `${usdtAmount} USDT`
                    : `${Math.round(totalAmountVND).toLocaleString('vi-VN')} ₫`}
                </span>
                {paymentTab !== 'stripe_card' && (
                  <span className="text-[10px] text-text-muted">≈ ${totalAmountUSD.toFixed(2)} USD</span>
                )}
              </div>
            </div>

            {/* CSKH Escalation */}
            <div className="pt-4 border-t border-border-subtle/60 text-center">
              <p className="text-[11px] text-text-muted mb-2">
                Cần hỗ trợ thanh toán hoặc thắc mắc về VietQR, Stripe &amp; Crypto?
              </p>
              <button
                type="button"
                onClick={() => openTelegramSupport(createdOrderId ?? orderIdRef.current, { totalAmountVND, totalAmountUSD })}
                className="text-xs text-primary-blue hover:underline font-semibold cursor-pointer"
              >
                [Báo Kỹ Thuật Viên Telegram 24/7]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
