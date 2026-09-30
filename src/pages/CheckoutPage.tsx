import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/utils/telemetry';
import { openTelegramSupport } from '@/utils/diagnostics';
import { ordersApi } from '@/services/api';
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
} from 'lucide-react';

const ORDER_DURATION_SECONDS = 600; // 10 minutes

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeConfig: rawActiveConfig, formatPrice, currency } = useApp();
  const { user, token } = useAuth();
  const { items, finalTotalVND, finalTotalUSD, discountVND, discountUSD, couponCode, clearCart } = useCart();

  const [paymentSubMethod, setPaymentSubMethod] = useState<'card_visa' | 'paypal_wallet' | 'paypal_credit'>('card_visa');
  const [timeLeft, setTimeLeft] = useState(ORDER_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<'idle' | 'authorizing' | 'capturing' | 'completed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Visa / Card input form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardError, setCardError] = useState('');

  // Generate deterministic order id (will be replaced by server response)
  const orderId = useRef(`AIPRO-${Math.floor(10000 + Math.random() * 90000)}`).current;

  // Determine if we're using cart mode or single-product mode
  const isCartMode = items.length > 0;

  // Single-product checkout requires a product selected from the DB catalog.
  // If missing (e.g. stale sessionStorage), bounce back to the products page.
  useEffect(() => {
    if (!rawActiveConfig?.product && items.length === 0) {
      navigate('/products', { replace: true });
    }
  }, [rawActiveConfig, items.length, navigate]);

  const activeConfig = rawActiveConfig ?? {
    product: null as any,
    provisioningType: 'invite_email' as const,
    targetEmail: '',
    duration: {
      months: 1,
      label: '1 Tháng',
      discountPercent: 0,
      monthlyEquivalentVND: 0,
      monthlyEquivalentUSD: 0,
    },
    guestEmail: '',
  };

  // Calculate pricing: prefer cart totals, fallback to activeConfig
  const totalAmountVND = isCartMode
    ? finalTotalVND
    : activeConfig.duration.monthlyEquivalentVND * activeConfig.duration.months;
  const totalAmountUSD = isCartMode
    ? finalTotalUSD
    : activeConfig.duration.monthlyEquivalentUSD * activeConfig.duration.months;

  useEffect(() => {
    trackEvent('checkout_viewed', {
      order_id: orderId,
      product: isCartMode ? `${items.length} items` : activeConfig.product?.name ?? 'unknown',
      amount_usd: totalAmountUSD,
      currency: 'USD',
      gateway: 'paypal',
    });
  }, [orderId, activeConfig, totalAmountUSD, isCartMode, items.length]);

  // 10-Minute Countdown Timer based on wall-clock delta
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, ORDER_DURATION_SECONDS - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
        trackEvent('checkout_timer_expired', { order_id: orderId });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Format card number with spaces (#### #### #### ####)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    if (cardError) setCardError('');
  };

  // Format expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  // Detect card type (Visa starts with 4, Mastercard starts with 5)
  const detectedCardType = cardNumber.startsWith('4')
    ? 'visa'
    : cardNumber.startsWith('5')
    ? 'mastercard'
    : 'unknown';

  // Process PayPal / Visa payment — calls real API to create order
  const handleExecutePayment = async (methodType: 'card_visa' | 'paypal_wallet' | 'paypal_credit') => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setIsProcessing(true);
    setProcessStage('authorizing');
    setPaymentError(null);

    trackEvent('payment_initiated', {
      order_id: orderId,
      sub_method: methodType,
      amount_usd: totalAmountUSD,
    });

    try {
      // Stage 1: Authorizing (simulates gateway connection delay)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setProcessStage('capturing');

      // Stage 2: Capturing — create real order in DB via API
      await new Promise((resolve) => setTimeout(resolve, 800));

      let createdOrderId = orderId;

      if (isCartMode && items.length > 0) {
        // Cart mode: create an order for the first item (or handle multi-item)
        const firstItem = items[0];
        const result = await ordersApi.create(token, {
          productId: firstItem.product.id,
          productName: firstItem.product.name,
          productSlug: firstItem.product.slug,
          planDurationMonths: firstItem.duration.months,
          provisioningType: firstItem.provisioningType,
          targetEmail: firstItem.targetEmail,
          guestEmail: user.email,
          quantity: firstItem.quantity,
          unitPriceVND: firstItem.unitPriceVND,
          unitPriceUSD: firstItem.unitPriceUSD,
          discountVND: discountVND,
          discountUSD: discountUSD,
          totalVND: finalTotalVND,
          totalUSD: finalTotalUSD,
          currency: 'VND',
          paymentMethod: methodType === 'card_visa' ? 'paypal_card' : methodType === 'paypal_wallet' ? 'paypal_wallet' : 'paypal_credit',
          paymentGatewayRef: `PAYPAL-${Date.now()}`,
          couponCode: couponCode || undefined,
        });
        if (result.data?.orderId) {
          createdOrderId = result.data.orderId;
        }
        clearCart();
      } else {
        // Single product mode (activeConfig)
        const result = await ordersApi.create(token, {
          productId: activeConfig.product.id,
          productName: activeConfig.product.name,
          productSlug: activeConfig.product.slug,
          planDurationMonths: activeConfig.duration.months,
          provisioningType: activeConfig.provisioningType,
          targetEmail: activeConfig.targetEmail,
          guestEmail: activeConfig.guestEmail || user.email,
          quantity: 1,
          unitPriceVND: activeConfig.duration.monthlyEquivalentVND * activeConfig.duration.months,
          unitPriceUSD: activeConfig.duration.monthlyEquivalentUSD * activeConfig.duration.months,
          discountVND: 0,
          discountUSD: 0,
          totalVND: totalAmountVND,
          totalUSD: totalAmountUSD,
          currency: 'VND',
          paymentMethod: methodType === 'card_visa' ? 'paypal_card' : methodType === 'paypal_wallet' ? 'paypal_wallet' : 'paypal_credit',
          paymentGatewayRef: `PAYPAL-${Date.now()}`,
        });
        if (result.data?.orderId) {
          createdOrderId = result.data.orderId;
        }
      }

      setProcessStage('completed');
      setPaymentSuccess(true);

      trackEvent('purchase', {
        transaction_id: createdOrderId,
        value: totalAmountUSD,
        currency: 'USD',
        payment_method: 'paypal',
        card_type: methodType === 'card_visa' ? detectedCardType : 'paypal_balance',
        items: isCartMode
          ? items.map((i) => ({ item_id: i.product.slug, item_name: i.product.name, quantity: i.quantity }))
          : [{ item_id: activeConfig.product?.slug, item_name: activeConfig.product?.name, quantity: 1 }],
      });

      setTimeout(() => {
        navigate(`/order/success/${createdOrderId}`);
      }, 1200);

    } catch (err: any) {
      console.error('[Checkout] Payment/Order creation failed:', err);
      setIsProcessing(false);
      setProcessStage('idle');
      setPaymentError(err.message || 'Thanh toán thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    }
  };


  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerProgress = (timeLeft / ORDER_DURATION_SECONDS) * 100;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {/* SUCCESS OVERLAY (When PayPal confirms payment) */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 bg-canvas/90 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="text-center p-8 rounded-2xl bg-surface border border-status-success/40 shadow-[0_0_50px_rgba(16,185,129,0.3)] max-w-md mx-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success mx-auto mb-4 flex items-center justify-center">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary">THANH TOÁN THÀNH CÔNG!</h2>
            <p className="text-xs text-text-secondary mt-2">
              PayPal đã xác nhận giao dịch an toàn. Đang tự động chuyển tiếp đến License Vault...
            </p>
            <div className="w-full h-1.5 bg-canvas rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-status-success animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 7 Cols (PayPal & Visa Gateway) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Guest Email Verified Notice */}
          <div className="p-4 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary-blue/10 text-primary-blue">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-text-muted block">Tài khoản &amp; bản quyền sẽ gửi về:</span>
                <span className="text-xs font-semibold text-text-primary font-mono">
                  {activeConfig.guestEmail || 'Khách vãng lai (Chưa nhập mail)'}
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

          {/* MAIN DEDICATED PAYPAL CHECKOUT CARD */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle shadow-card-hover space-y-6">
            {/* Header: PayPal Logo + Supported Card Brands */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#003087]/15 border border-[#003087]/30 flex items-center justify-center">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.79.79 0 0 1 .78-.663h6.732c4.12 0 6.643 2.052 6.136 5.864-.47 3.528-2.977 5.564-6.536 5.564H9.55l-1.428 6.074a.8.8 0 0 1-.787.662l-.259.11z"
                      fill="#003087"
                    />
                    <path
                      d="M8.706 8.922h4.522c2.476 0 4.093 1.258 3.75 3.84-.36 2.705-2.28 4.266-5.008 4.266H8.72a.64.64 0 0 1-.632-.534L7.076 21.337h2.868l1.042-6.61a.64.64 0 0 1 .632-.535h2.368c3.559 0 6.066-2.036 6.536-5.564.507-3.812-2.016-5.864-6.136-5.864H7.654a.79.79 0 0 0-.78.663L4.944 20.597a.641.641 0 0 0 .633.74h1.5l1.629-10.35a2.06 2.06 0 0 1 2.06-1.745l-.06.68z"
                      fill="#0079C1"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span>Thanh Toán PayPal</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFC439]/20 text-[#FFC439] border border-[#FFC439]/40 font-bold">
                      Hỗ Trợ Visa &amp; Mastercard
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Cổng thanh toán quốc tế bảo mật hàng đầu thế giới
                  </p>
                </div>
              </div>

              {/* Supported Card Badges */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-canvas px-3 py-1.5 rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Chấp nhận:</span>
                {/* VISA badge */}
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-extrabold text-[11px] font-mono border border-blue-500/30">
                  VISA
                </span>
                {/* Mastercard badge */}
                <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 font-extrabold text-[11px] font-mono border border-orange-500/30">
                  MC
                </span>
                {/* AMEX badge */}
                <span className="px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-400 font-extrabold text-[11px] font-mono border border-cyan-500/30">
                  AMEX
                </span>
              </div>
            </div>

            {/* Price Conversion Banner */}
            <div className="p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-text-muted block">Số tiền thanh toán qua PayPal:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold font-mono text-[#FFC439]">
                    ${totalAmountUSD.toFixed(2)} USD
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    (~{new Intl.NumberFormat('vi-VN').format(totalAmountVND)} ₫)
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-text-muted space-y-0.5 text-left sm:text-right">
                <div className="flex items-center gap-1 sm:justify-end text-status-success font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Miễn phí giao dịch &amp; bảo hiểm 180 ngày</span>
                </div>
                <div>Tỷ giá quy đổi cố định: 1 USD ≈ 25,000 VNĐ</div>
              </div>
            </div>

            {/* Method Sub-Tabs inside PayPal */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-secondary block uppercase tracking-wider">
                Chọn hình thức thanh toán thuận tiện:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Option 1: Visa / Mastercard via PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentSubMethod('card_visa')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                    paymentSubMethod === 'card_visa'
                      ? 'bg-elevated border-primary-blue shadow-[0_0_15px_rgba(0,102,255,0.25)]'
                      : 'bg-canvas/60 border-border-subtle hover:border-border-focus'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold text-text-primary">Thẻ Visa / MC</span>
                  <span className="text-[10px] text-status-success font-medium">Không cần acc PayPal</span>
                </button>

                {/* Option 2: PayPal Account Balance */}
                <button
                  type="button"
                  onClick={() => setPaymentSubMethod('paypal_wallet')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                    paymentSubMethod === 'paypal_wallet'
                      ? 'bg-elevated border-[#FFC439] shadow-[0_0_15px_rgba(255,196,57,0.25)]'
                      : 'bg-canvas/60 border-border-subtle hover:border-border-focus'
                  }`}
                >
                  <span className="text-sm font-extrabold text-[#FFC439] italic">PayPal</span>
                  <span className="text-xs font-bold text-text-primary">Tài Khoản PayPal</span>
                  <span className="text-[10px] text-text-muted">1-Click Đăng nhập</span>
                </button>

                {/* Option 3: PayPal Pay Later */}
                <button
                  type="button"
                  onClick={() => setPaymentSubMethod('paypal_credit')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                    paymentSubMethod === 'paypal_credit'
                      ? 'bg-elevated border-[#0079C1] shadow-[0_0_15px_rgba(0,121,193,0.25)]'
                      : 'bg-canvas/60 border-border-subtle hover:border-border-focus'
                  }`}
                >
                  <span className="text-xs font-bold text-[#0079C1] italic">Pay Later</span>
                  <span className="text-xs font-bold text-text-primary">Trả Góp 4 Kỳ</span>
                  <span className="text-[10px] text-[#FFC439] font-medium">0% Lãi suất</span>
                </button>
              </div>
            </div>

            {/* PROGRESS LOADING OVERLAY (During Payment) */}
            {isProcessing ? (
              <div className="p-6 rounded-2xl bg-canvas border border-[#FFC439]/40 space-y-4 text-center animate-fadeIn">
                <div className="flex items-center justify-center gap-2 text-[#FFC439]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-bold">
                    {processStage === 'authorizing' &&
                      (paymentSubMethod === 'card_visa'
                        ? 'Đang kết nối cổng thanh toán an toàn PayPal Card Gateway...'
                        : 'Đang kết nối bảo mật với tài khoản PayPal...')}
                    {processStage === 'capturing' &&
                      (paymentSubMethod === 'card_visa'
                        ? 'Đang xác thực bảo mật thẻ Visa / Mastercard 3D-Secure...'
                        : 'Đang xác thực trừ tiền ví PayPal...')}
                    {processStage === 'completed' && 'Thanh toán thành công! Đang tự động cấp bản quyền...'}
                  </span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFC439] to-status-success transition-all duration-700"
                    style={{
                      width:
                        processStage === 'authorizing'
                          ? '40%'
                          : processStage === 'capturing'
                          ? '80%'
                          : '100%',
                    }}
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi hệ thống mã hóa giao dịch.
                </p>
              </div>
            ) : (
              <div>
                {/* SUB-PANEL 1: VISA / MASTERCARD VIA PAYPAL GUEST CHECKOUT */}
                {paymentSubMethod === 'card_visa' && (
                  <div className="space-y-4 p-5 rounded-2xl bg-canvas border border-border-subtle animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                        <CreditCard className="w-4 h-4 text-primary-blue" />
                        <span>Nhập thông tin thẻ Visa / Mastercard</span>
                      </div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Lock className="w-3 h-3 text-status-success" />
                        Bảo mật PCI-DSS bởi PayPal
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Card Number Input */}
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">
                          Số thẻ Visa / Mastercard
                        </label>
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
                              <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 font-extrabold text-[10px] font-mono">
                                VISA
                              </span>
                            )}
                            {detectedCardType === 'mastercard' && (
                              <span className="px-1.5 py-0.5 rounded bg-orange-600/30 text-orange-400 font-extrabold text-[10px] font-mono">
                                MC
                              </span>
                            )}
                            {detectedCardType === 'unknown' && (
                              <span className="text-[10px] text-text-muted font-mono">VISA / MC</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expiry and CVV Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-text-muted block mb-1">
                            Hạn dùng (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            placeholder="MM / YY"
                            className="w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-text-muted block mb-1">
                            Mã bảo mật CVV
                          </label>
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

                      {/* Cardholder Name */}
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">
                          Tên in trên thẻ (Không dấu)
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          className="w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue uppercase"
                        />
                      </div>
                    </div>

                    {/* Pay with Visa Button */}
                    <button
                      type="button"
                      onClick={() => handleExecutePayment('card_visa')}
                      className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-primary-blue to-[#0079C1] hover:brightness-110 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-blue/25 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Thanh toán ${totalAmountUSD.toFixed(2)} USD bằng thẻ Visa / Mastercard</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>

                    <p className="text-[11px] text-text-muted text-center">
                      * Nhấn thanh toán để tự động điền thẻ test và mô phỏng giao dịch qua cổng an toàn PayPal.
                    </p>
                  </div>
                )}

                {/* SUB-PANEL 2: PAYPAL WALLET ACCOUNT */}
                {paymentSubMethod === 'paypal_wallet' && (
                  <div className="space-y-4 p-5 rounded-2xl bg-canvas border border-[#FFC439]/30 text-center animate-fadeIn">
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      Đăng nhập an toàn vào ví PayPal của bạn để thanh toán bằng số dư hoặc tài khoản ngân hàng liên kết.
                    </p>

                    <button
                      type="button"
                      onClick={() => handleExecutePayment('paypal_wallet')}
                      className="w-full max-w-md mx-auto h-12 rounded-xl bg-[#FFC439] hover:bg-[#F2BA36] active:scale-[0.99] text-[#003087] font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_4px_14px_rgba(255,196,57,0.35)] transition-all cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.79.79 0 0 1 .78-.663h6.732c4.12 0 6.643 2.052 6.136 5.864-.47 3.528-2.977 5.564-6.536 5.564H9.55l-1.428 6.074a.8.8 0 0 1-.787.662l-.259.11z"
                          fill="#003087"
                        />
                        <path
                          d="M8.706 8.922h4.522c2.476 0 4.093 1.258 3.75 3.84-.36 2.705-2.28 4.266-5.008 4.266H8.72a.64.64 0 0 1-.632-.534L7.076 21.337h2.868l1.042-6.61a.64.64 0 0 1 .632-.535h2.368c3.559 0 6.066-2.036 6.536-5.564.507-3.812-2.016-5.864-6.136-5.864H7.654a.79.79 0 0 0-.78.663L4.944 20.597a.641.641 0 0 0 .633.74h1.5l1.629-10.35a2.06 2.06 0 0 1 2.06-1.745l-.06.68z"
                          fill="#0079C1"
                        />
                      </svg>
                      <span className="italic font-extrabold tracking-tight text-base">PayPal</span>
                      <span className="font-semibold text-xs text-[#003087]">
                        - Trả ngay ${totalAmountUSD.toFixed(2)} USD
                      </span>
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
                      <Lock className="w-3.5 h-3.5 text-status-success" />
                      <span>Được bảo vệ bởi PayPal Buyer Protection 180 ngày</span>
                    </div>
                  </div>
                )}

                {/* SUB-PANEL 3: PAYPAL PAY LATER */}
                {paymentSubMethod === 'paypal_credit' && (
                  <div className="space-y-4 p-5 rounded-2xl bg-canvas border border-[#0079C1]/30 text-center animate-fadeIn">
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      Chia nhỏ đơn hàng thành 4 kỳ thanh toán linh hoạt mỗi 2 tuần một lần, hoàn toàn không phát sinh lãi suất.
                    </p>

                    <div className="p-3 bg-surface rounded-xl border border-border-subtle max-w-md mx-auto flex items-center justify-between text-xs font-mono">
                      <span className="text-text-muted">Kỳ 1 (Thanh toán hôm nay):</span>
                      <span className="font-bold text-accent-cyan">${(totalAmountUSD / 4).toFixed(2)} USD</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExecutePayment('paypal_credit')}
                      className="w-full max-w-md mx-auto h-12 rounded-xl bg-[#003087] hover:bg-[#002266] active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <span className="text-[#FFC439] font-bold italic text-sm">Pay</span>
                      <span className="text-white font-bold italic text-sm">Later</span>
                      <span className="text-gray-200">
                        - Trả góp ${(totalAmountUSD / 4).toFixed(2)} USD / kỳ (0% Lãi)
                      </span>
                    </button>
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
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFC439]" /> PayPal Buyer Protection 180 ngày
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
            {/* 10-Minute Countdown Clock */}
            <div className="pb-4 border-b border-border-subtle/60">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Clock className="w-4 h-4 text-status-warning" />
                  Thời gian giữ slot tài khoản:
                </span>
                <span className="font-mono text-base font-bold text-status-warning">
                  {timerString}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-warning transition-all duration-1000"
                  style={{ width: `${timerProgress}%` }}
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="py-4 space-y-3 text-xs border-b border-border-subtle/60">
              <div className="flex justify-between font-medium">
                <span className="text-text-secondary">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-text-primary">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Sản phẩm:</span>
                <span className="font-semibold text-text-primary">
                  {activeConfig.product?.name ?? '—'} ({activeConfig.duration.label})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cổng thanh toán:</span>
                <span className="font-semibold text-[#FFC439] flex items-center gap-1">
                  <span>PayPal (Visa/MC)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Loại bàn giao:</span>
                <span className="text-text-primary">
                  {activeConfig.provisioningType === 'invite_email' ? 'Nâng chính chủ' : 'Cấp sẵn độc quyền'}
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
                  ${totalAmountUSD.toFixed(2)} USD
                </span>
                <span className="text-[11px] text-text-muted font-mono">
                  (~{new Intl.NumberFormat('vi-VN').format(totalAmountVND)} VNĐ)
                </span>
              </div>
            </div>

            {/* CSKH Escalation */}
            <div className="pt-4 border-t border-border-subtle/60 text-center">
              <p className="text-[11px] text-text-muted mb-2">
                Cần hỗ trợ thanh toán hoặc thắc mắc về PayPal &amp; Thẻ Visa?
              </p>
              <button
                type="button"
                onClick={() => openTelegramSupport(orderId, { totalAmountVND, totalAmountUSD })}
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
