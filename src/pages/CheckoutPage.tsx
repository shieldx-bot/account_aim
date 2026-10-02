import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/utils/telemetry';
import { openTelegramSupport } from '@/utils/diagnostics';
import { ordersApi, paymentsApi, API_BASE_URL } from '@/services/api';
import { peekPendingReferral, consumePendingReferral, captureRefFromUrl } from '@/utils/referral';
import { getStoredPrize, clearStoredPrize, LUCKY_STORAGE_KEY } from '@/components/common/LuckyWheel';
import { useCountdown } from '@/hooks/useCountdown';
import {
  TicketPercent,
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeConfig, formatPrice, currency, isLoadingProducts } = useApp();
  const { user, token } = useAuth();
  const { items, subtotalVND, subtotalUSD, finalTotalVND, finalTotalUSD, discountVND, discountUSD, couponCode, couponDiscountPercent, couponExpiresAt, applyCoupon, removeCoupon, clearCart } = useCart();

  const [timeLeft, setTimeLeft] = useState(ORDER_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<'idle' | 'authorizing' | 'capturing' | 'completed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Live countdown for the applied coupon's lifetime (wheel prizes expire fast).
  const { label: couponTimeLeft, expired: couponExpired, urgent: couponUrgent } = useCountdown(couponExpiresAt);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || isApplyingCoupon) return;
    setIsApplyingCoupon(true);
    setCouponMsg(null);
    const r = await applyCoupon(code);
    setCouponMsg({
      ok: r.success,
      text: r.success
        ? `✅ Đã áp dụng ${code.toUpperCase()} — hoàn tất thanh toán ngay trước khi mã hết hạn!`
        : r.message,
    });
    if (r.success) setCouponInput('');
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    localStorage.removeItem(LUCKY_STORAGE_KEY); // removing the wheel prize retires it too
    setCouponMsg({ ok: true, text: 'Đã gỡ mã giảm giá khỏi đơn hàng.' });
  };

  // Auto-apply the Lucky Wheel coupon (first-order prize, one order only).
  // Re-runs when the auth token arrives (guests can log in mid-checkout).
  useEffect(() => {
    if (!token) return;
    const lucky = getStoredPrize();
    if (lucky?.code && !couponCode) {
      applyCoupon(lucky.code).then((r) => {
        if (r.success) {
          window.dispatchEvent(new CustomEvent('agentlab:lucky-used'));
        } else {
          // The prize lapsed while the customer was deciding — say so plainly
          // and point them at a fresh spin instead of a silent failure.
          clearStoredPrize();
          setCouponMsg({
            ok: false,
            text: '⏰ Mã vòng quay đã hết hạn 😥 — về trang chủ quay vòng quay để nhận mã mới (vẫn miễn phí)!',
          });
        }
      });
    }
  }, [token]);

  // ── PayPal pre-payment health check (#test-before-pay) ──
  const [paypalStatus, setPaypalStatus] = useState<{ connected: boolean; env: string; clientId: string | null } | null>(
    null
  );
  const refreshPaypalStatus = () => {
    setPaypalStatus(null);
    paymentsApi
      .getPaypalStatus()
      .then((s) => setPaypalStatus({ connected: s.connected, env: s.env, clientId: s.clientId }))
      .catch(() => setPaypalStatus({ connected: false, env: 'unknown', clientId: null }));
  };
  useEffect(() => {
    refreshPaypalStatus();
  }, []);

  // ── Referral attribution (#InviteToPay) ──
  // Priority: router state (from ReferralEventSection) → ?ref= URL → pending localStorage.
  const [referralCode] = useState<string | null>(() => {
    const fromState = (location.state as any)?.referralCode as string | undefined;
    if (fromState) return String(fromState).toUpperCase();
    return captureRefFromUrl() ?? peekPendingReferral()?.code ?? null;
  });

  // Card input form states — REMOVED: payment details are entered on PayPal's
  // hosted page, never on our servers.

  // Generate deterministic order id (will be replaced by server response)
  const orderId = useRef(`AGTLAB-${Math.floor(10000 + Math.random() * 90000)}`).current;

  // The PayPal SDK Buttons keep the callbacks they were mounted with, so every
  // value those callbacks read must come through this ref. Reading state
  // directly would freeze the values from the first render — an order placed
  // after the coupon was applied would still be created with couponCode = null
  // and PayPal would charge the undiscounted amount.
  const paypalInputsRef = useRef({ user, token, couponCode, items, activeConfig });
  paypalInputsRef.current = { user, token, couponCode, items, activeConfig };

  // Determine if we're using cart mode or single-product mode
  const isCartMode = items.length > 0;

  // Calculate pricing: prefer cart totals, then activeConfig (DB-driven).
  // Single-product mode applies the coupon discount client-side for display;
  // the authoritative reprice still happens on the server at order creation.
  const baseAmountVND = isCartMode
    ? subtotalVND
    : (activeConfig?.duration.monthlyEquivalentVND ?? 0) * (activeConfig?.duration.months ?? 0);
  const baseAmountUSD = isCartMode
    ? subtotalUSD
    : (activeConfig?.duration.monthlyEquivalentUSD ?? 0) * (activeConfig?.duration.months ?? 0);
  const orderDiscountVND = isCartMode ? discountVND : Math.round(baseAmountVND * (couponDiscountPercent / 100));
  const orderDiscountUSD = isCartMode
    ? discountUSD
    : Number((baseAmountUSD * (couponDiscountPercent / 100)).toFixed(2));
  const totalAmountVND = isCartMode ? finalTotalVND : Math.max(0, baseAmountVND - orderDiscountVND);
  const totalAmountUSD = isCartMode ? finalTotalUSD : Math.max(0, Number((baseAmountUSD - orderDiscountUSD).toFixed(2)));

  useEffect(() => {
    trackEvent('checkout_viewed', {
      order_id: orderId,
      product: isCartMode ? `${items.length} items` : activeConfig?.product.name ?? 'unknown',
      amount_usd: totalAmountUSD,
      currency: 'USD',
      gateway: 'paypal',
    });
  }, [orderId, activeConfig, totalAmountUSD, isCartMode, items.length]);

  // Guard: no cart items and no DB-backed configuration → nothing to checkout.
  // Wait for the catalog fetch to settle first — activeConfig is derived from
  // the loaded products (?plan= param), so bouncing early races the fetch.
  useEffect(() => {
    if (!isLoadingProducts && !isCartMode && !activeConfig) {
      navigate('/', { replace: true });
    }
  }, [isLoadingProducts, isCartMode, activeConfig, navigate]);

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

  /**
   * Create the PENDING order (server reprices from the catalog, so the client
   * never dictates the amount).
   */
  const createPendingOrder = async (): Promise<string> => {
    // Read through the ref so the PayPal SDK's mounted callbacks always see
    // the latest auth state and coupon.
    const { user, token, couponCode, items, activeConfig } = paypalInputsRef.current;
    const isCartMode = items.length > 0;
    if (!user || !token) {
      navigate('/login', { state: { from: '/checkout' } });
      throw new Error('Not authenticated');
    }

    let createdOrderId = orderId;

    const createPayload = {
      planDurationMonths: 1,
      provisioningType: 'pre_created',
      targetEmail: undefined as string | undefined,
      guestEmail: '',
      quantity: 1,
      couponCode: couponCode || undefined,
      referralCode: consumePendingReferral() ?? referralCode ?? undefined,
    };
    let productId: string | undefined;

    if (isCartMode && items.length > 0) {
      const firstItem = items[0];
      productId = firstItem.product.id;
      createPayload.planDurationMonths = firstItem.duration.months;
      createPayload.provisioningType = firstItem.provisioningType;
      createPayload.targetEmail = firstItem.targetEmail || undefined;
      createPayload.guestEmail = user.email;
      createPayload.quantity = firstItem.quantity;
    } else if (activeConfig) {
      productId = activeConfig.product.id;
      createPayload.planDurationMonths = activeConfig.duration.months;
      createPayload.provisioningType = activeConfig.provisioningType;
      createPayload.targetEmail = activeConfig.targetEmail || undefined;
      createPayload.guestEmail = activeConfig.guestEmail || user.email;
      createPayload.quantity = 1;
    }

    if (!productId) {
      throw new Error('No product available to check out.');
    }

    const result = await ordersApi.create(token, { productId, ...createPayload });
    if (result.data?.orderId) {
      createdOrderId = result.data.orderId;
    }
    return createdOrderId;
  };

  /**
   * PayPal & Card flow (PayPal JS SDK):
   *   The SDK renders two buttons — PayPal wallet and Debit/Credit Card.
   *   createOrder creates the pending order + PayPal Order server-side
   *   (amount always from the order row); onApprove captures server-side.
   *   Card details never touch our servers — they are entered in PayPal's
   *   hosted popup (PCI scope stays with PayPal).
   */
  const paypalButtonsHostRef = useRef<HTMLDivElement | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdk, setSdk] = useState<any>(null);
  const lastPendingOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sdkReady) return;
    const w = window as any;
    if (w.paypal?.Buttons) setSdk(w.paypal);
  }, [sdkReady]);

  // Load the PayPal JS SDK once PayPal is verified as available.
  useEffect(() => {
    if (!paypalStatus?.connected || !paypalStatus.clientId) return;
    const id = 'paypal-js-sdk';
    if (document.getElementById(id)) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      paypalStatus.clientId
    )}&currency=USD&intent=capture&components=buttons&enable-funding=card&disable-funding=credit,venmo,paylater`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setPaymentError('Unable to load the PayPal payment module. Please retest or pay later.');
    document.body.appendChild(script);
  }, [paypalStatus]);

  // Render the PayPal + Card buttons once the SDK is loaded and the checkout
  // panel is visible (it is replaced by the processing overlay while paying).
  useEffect(() => {
    if (!sdkReady || isProcessing || !sdk || !paypalButtonsHostRef.current) return;
    if (paypalButtonsHostRef.current.childElementCount > 0) return;

    sdk
      .Buttons({
        style: { layout: 'vertical', label: 'paypal', height: 45 },
        createOrder: async (): Promise<string> => {
          const currentToken = paypalInputsRef.current.token;
          if (!currentToken) {
            navigate('/login', { state: { from: '/checkout' } });
            throw new Error('Please sign in to continue.');
          }
          trackEvent('payment_initiated', {
            order_id: orderId,
            gateway: 'paypal',
            amount_usd: totalAmountUSD,
          });
          const health = await fetch(`${API_BASE_URL}/health`).then((r) => r.json());
          if (health?.postgres !== 'connected') {
            throw new Error('The system is temporarily unavailable. Please try again.');
          }
          const pendingOrderId = await createPendingOrder();
          trackEvent('begin_paypal_checkout', { order_id: pendingOrderId, amount_usd: totalAmountUSD });
          const pp = await paymentsApi.createPaypalOrder(currentToken, pendingOrderId);
          lastPendingOrderIdRef.current = pendingOrderId;
          return pp.paypalOrderId;
        },
        onApprove: async (data: { orderID: string }) => {
          const approveToken = paypalInputsRef.current.token;
          if (!approveToken) throw new Error('Session expired — please sign in again.');
          setProcessStage('capturing');
          await paymentsApi.capturePaypalOrder(approveToken, data.orderID);
          setProcessStage('completed');
          setPaymentSuccess(true);
          clearCart();
          localStorage.removeItem(LUCKY_STORAGE_KEY);
          trackEvent('paypal_payment_captured', { order_id: lastPendingOrderIdRef.current });
          setTimeout(() => navigate(`/order/success/${lastPendingOrderIdRef.current}`), 1200);
        },
        onError: (err: unknown) => {
          console.error('[Checkout] PayPal SDK error:', err);
          setIsProcessing(false);
          setProcessStage('idle');
          setPaymentError('PayPal payment failed. Please try again or contact support.');
        },
        onCancel: () => {
          setPaymentError('PayPal payment was canceled. Your order is still reserved — you can try again.');
        },
      })
      .render(paypalButtonsHostRef.current)
      .catch((err: unknown) => {
        console.error('[Checkout] PayPal button render failed:', err);
        setPaymentError('Unable to display the PayPal payment buttons. Please retest.');
      });
  }, [sdkReady, isProcessing, sdk]);

  // PayPal redirect-back: capture the approved payment, then finish the flow.
  const paypalReturn = searchParams.get('paypal_return') === '1';
  const paypalCancel = searchParams.get('paypal_cancel') === '1';
  const paypalCaptureRef = useRef(false);
  useEffect(() => {
    if (paypalCancel) {
      setPaymentError('PayPal payment was canceled. Your order is still reserved — you can try again.');
      return;
    }
    if (!paypalReturn || !token || paypalCaptureRef.current) return;
    const paypalOrderId = searchParams.get('token');
    if (!paypalOrderId) return;

    paypalCaptureRef.current = true;
    setIsProcessing(true);
    setProcessStage('capturing');
    paymentsApi
      .capturePaypalOrder(token, paypalOrderId)
      .then(() => {
        setProcessStage('completed');
        setPaymentSuccess(true);
        clearCart();
        localStorage.removeItem(LUCKY_STORAGE_KEY);
        trackEvent('paypal_payment_captured', { order_id: searchParams.get('orderId') });
        setTimeout(() => navigate(`/order/success/${searchParams.get('orderId')}`), 1200);
      })
      .catch((err) => {
        console.error('[Checkout] PayPal capture failed:', err);
        setIsProcessing(false);
        setProcessStage('idle');
        setPaymentError(err.message || 'PayPal capture failed. Please contact support.');
      });
  }, [paypalReturn, paypalCancel, token, searchParams]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerProgress = (timeLeft / ORDER_DURATION_SECONDS) * 100;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {/* SUCCESS OVERLAY (When PayPal confirms payment) */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 bg-canvas/90 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="text-center p-8 rounded-2xl bg-surface border border-status-success/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] max-w-md mx-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success mx-auto mb-4 flex items-center justify-center">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary">PAYMENT SUCCESSFUL!</h2>
            <p className="text-xs text-text-secondary mt-2">
              PayPal has confirmed the secure transaction. Automatically redirecting to your License Vault...
            </p>
            <div className="w-full h-1.5 bg-canvas rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-status-success animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 7 Cols (PayPal Gateway) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Referral Attribution Banner (#InviteToPay) */}
          {referralCode && (
            <div className="p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/30 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-accent-cyan shrink-0" />
              <p className="text-xs text-text-secondary">
                This order is attributed to the invitation{' '}
                <span className="font-mono font-bold text-accent-cyan">{referralCode}</span> — the inviter
                will automatically receive their reward after a valid payment (FAB).
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
                <span className="text-xs text-text-muted block">Account &amp; license will be delivered to:</span>
                <span className="text-xs font-semibold text-text-primary font-mono">
                  {activeConfig?.guestEmail || 'Guest (no email provided)'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-primary-blue hover:underline font-medium cursor-pointer"
            >
              Change email
            </button>
          </div>

          {/* Discount coupon box */}
          {couponCode ? (
            <div className={`p-4 rounded-xl border ${couponExpired ? 'bg-status-error/5 border-status-error/40' : couponUrgent ? 'bg-status-error/5 border-status-error/40 animate-pulse' : 'bg-status-success/5 border-status-success/30'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <TicketPercent className={`w-4 h-4 shrink-0 ${couponExpired ? 'text-status-error' : 'text-status-success'}`} />
                  <div className="text-xs">
                    <span className={`font-mono font-extrabold ${couponExpired ? 'text-status-error line-through' : 'text-status-success'}`}>{couponCode}</span>
                    {!couponExpired && <span className="text-text-secondary"> — giảm {couponDiscountPercent}% đã áp dụng</span>}
                    {couponCode.startsWith('LUCKY-') && (
                      <span className="block text-[10px] text-text-muted mt-0.5">
                        🎡 Mã vòng quay may mắn — áp dụng cho 1 đơn hàng, tự xóa sau khi thanh toán.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] font-bold text-status-error hover:underline cursor-pointer shrink-0"
                >
                  Gỡ mã
                </button>
              </div>

              {/* Lifetime countdown — the code really dies when this hits zero */}
              {couponExpiresAt && !couponExpired && (
                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${couponUrgent ? 'text-status-error' : 'text-status-warning'}`} />
                    <span className="text-[11px] font-semibold text-text-secondary">Mã hết hạn sau</span>
                  </div>
                  <span className={`font-mono font-black tabular-nums text-lg ${couponUrgent ? 'text-status-error' : 'text-status-warning'}`}>
                    {couponTimeLeft}
                  </span>
                </div>
              )}

              {couponExpired ? (
                <p className="text-[11px] font-bold text-status-error mt-2">
                  ⏰ Mã này đã hết hạn — gỡ mã và về trang chủ quay Vòng quay may mắn để nhận mã mới (vẫn miễn phí)!
                </p>
              ) : (
                orderDiscountUSD > 0 && (
                  <p className="text-[11px] font-semibold text-status-error mt-2.5">
                    ❗ Gỡ mã = bạn tự bỏ lỡ {orderDiscountUSD.toFixed(2)} USD ưu đãi cho đơn này.
                  </p>
                )
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary mb-2">
                <TicketPercent className="w-4 h-4 text-primary-blue" />
                <span>Mã giảm giá</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="VD: LUCKY-1A2B3C (quay vòng quay ở trang chủ)"
                  className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-border-subtle text-xs text-text-primary font-mono placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-primary-blue"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-4 py-2 rounded-lg bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TicketPercent className="w-3.5 h-3.5" />}
                  Áp dụng
                </button>
              </div>
              {couponMsg && (
                <p className={`text-[11px] mt-2 font-semibold ${couponMsg.ok ? 'text-status-success' : 'text-status-error'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>
          )}

          {/* MAIN DEDICATED PAYPAL CHECKOUT CARD */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle shadow-card-hover space-y-6">
            {/* Header: PayPal Branding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFC439]/20 border border-[#FFC439]/40 flex items-center justify-center">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.773-4.471z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span>PayPal Payment</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFC439]/20 text-[#003087] border border-[#FFC439]/40 font-bold">
                      Secure Checkout
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Secure international payment gateway — payment is approved directly on PayPal's page
                  </p>
                </div>
              </div>

              {/* Accepted badges */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-canvas px-3 py-1.5 rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Accepted:</span>
                <span className="px-2 py-0.5 rounded bg-[#003087]/10 text-[#003087] font-extrabold text-[11px] font-mono border border-[#003087]/30">
                  PAYPAL
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-700 font-extrabold text-[11px] font-mono border border-blue-500/30">
                  VISA
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-700 font-extrabold text-[11px] font-mono border border-orange-500/30">
                  MC
                </span>
              </div>
            </div>

            {/* Price Banner */}
            <div className="p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-text-muted block">Amount charged via PayPal:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold font-mono text-[#003087]">
                    ${totalAmountUSD.toFixed(2)} USD
                  </span>
                  {orderDiscountUSD > 0 && (
                    <span className="text-sm font-mono text-text-muted line-through">
                      ${baseAmountUSD.toFixed(2)}
                    </span>
                  )}
                </div>
                {orderDiscountUSD > 0 && (
                  <span className="text-[11px] font-bold text-status-success">
                    🎟️ Đã giảm {orderDiscountUSD.toFixed(2)} USD ({couponDiscountPercent}%){couponCode ? ` — ${couponCode}` : ''}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-text-muted space-y-0.5 text-left sm:text-right">
                <div className="flex items-center gap-1 sm:justify-end text-status-success font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>No transaction fees &amp; 1-to-1 exchange warranty</span>
                </div>
                <div>Billing currency: US Dollars (USD)</div>
              </div>
            </div>

            {/* PROGRESS LOADING OVERLAY (During Payment) */}
            {isProcessing ? (
              <div className="p-6 rounded-2xl bg-canvas border border-[#003087]/40 space-y-4 text-center animate-fadeIn">
                <div className="flex items-center justify-center gap-2 text-[#003087]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-bold">
                    {processStage === 'authorizing' && 'Connecting to the AgentLab system...'}
                    {processStage === 'capturing' && 'Redirecting to PayPal to approve your payment...'}
                    {processStage === 'completed' && 'Payment successful! Provisioning your license...'}
                  </span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#003087] to-status-success transition-all duration-700"
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
                  Please do not close your browser while the system initializes the transaction.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-5 rounded-2xl bg-canvas border border-border-subtle animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <CreditCard className="w-4 h-4 text-[#003087]" />
                    <span>Pay securely with PayPal</span>
                  </div>
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-status-success" />
                    Buyer Protection by PayPal
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Click the button below — you will be redirected to PayPal's secure page to approve the
                  payment (PayPal balance or your linked Visa/Mastercard). After a successful payment,
                  your account is delivered automatically.
                </p>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error font-medium">
                    {paymentError}
                  </div>
                )}

                {/* PayPal pre-payment status check */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-canvas border border-border-subtle">
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        paypalStatus === null
                          ? 'bg-status-warning animate-pulse'
                          : paypalStatus.connected
                          ? 'bg-status-success'
                          : 'bg-status-error'
                      }`}
                    />
                    {paypalStatus === null ? (
                      <span className="text-text-muted">Checking PayPal availability…</span>
                    ) : paypalStatus.connected ? (
                      <span className="text-status-success">
                        PayPal is available ({paypalStatus.env}) — verified just now
                      </span>
                    ) : (
                      <span className="text-status-error">PayPal is temporarily unavailable — please try again later or contact support</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={refreshPaypalStatus}
                    className="text-[10px] font-bold text-primary-blue hover:underline cursor-pointer shrink-0"
                  >
                    Retest
                  </button>
                </div>

                {/* PayPal SDK buttons: PayPal wallet + Debit/Credit Card */}
                {paypalStatus !== null && !paypalStatus.connected ? (
                  <p className="text-[11px] text-status-error text-center py-2">
                    * PayPal is unavailable right now — please try again later (use the Retest button above).
                  </p>
                ) : (
                  <div>
                    <div ref={paypalButtonsHostRef} className="min-h-[110px]" />
                    {!sdkReady && (
                      <p className="text-[11px] text-text-muted text-center py-3">
                        Loading secure PayPal &amp; card payment buttons…
                      </p>
                    )}
                    <p className="text-[11px] text-text-muted text-center mt-2">
                      * Pay with your PayPal balance or a Debit/Credit card (Visa, Mastercard, AMEX) — both are
                      processed on PayPal's secure hosted page.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trust Badges */}
            <div className="pt-4 border-t border-border-subtle/80 flex flex-wrap items-center justify-center gap-5 text-[11px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-status-success" /> 256-bit SSL encryption, PCI compliant
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#003087]" /> PayPal Buyer Protection
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-cyan" /> Instant license activation &lt; 30s
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
                  Account slot reservation time:
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
                <span className="text-text-secondary">Order ID:</span>
                <span className="font-mono font-bold text-text-primary">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Product:</span>
                <span className="font-semibold text-text-primary">
                  {activeConfig?.product.name ?? '—'} ({activeConfig?.duration.label ?? '—'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment gateway:</span>
                <span className="font-semibold text-[#003087] flex items-center gap-1">
                  <span>PayPal (Visa/MC via PayPal)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Delivery type:</span>
                <span className="text-text-primary">
                  {activeConfig?.provisioningType === 'invite_email' ? 'Owner upgrade' : 'Dedicated pre-created'}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Delivery SLA:</span>
                <span className="text-status-success font-semibold">&lt; 30 seconds</span>
              </div>
            </div>

            {orderDiscountUSD > 0 && (
              <div className="pb-2 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Giảm giá ({couponDiscountPercent}%){couponCode ? ` · ${couponCode}` : ''}:</span>
                <span className="font-mono font-bold text-status-success">-${orderDiscountUSD.toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="py-4 flex items-baseline justify-between">
              <span className="text-xs text-text-muted">Total due:</span>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-mono text-[#FFC439] block">
                  ${totalAmountUSD.toFixed(2)} USD
                </span>

              </div>
            </div>

            {/* CSKH Escalation */}
            <div className="pt-4 border-t border-border-subtle/60 text-center">
              <p className="text-[11px] text-text-muted mb-2">
                Need help with payment or questions about PayPal &amp; international cards?
              </p>
              <button
                type="button"
                onClick={() => openTelegramSupport(orderId, { totalAmountVND, totalAmountUSD })}
                className="text-xs text-primary-blue hover:underline font-semibold cursor-pointer"
              >
                [Talk to a Telegram Support Engineer 24/7]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
