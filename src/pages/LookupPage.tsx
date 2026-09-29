import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '@/utils/telemetry';
import { openTelegramSupport } from '@/utils/diagnostics';
import {
  Search,
  ShieldCheck,
  Zap,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

type LookupTab = 'email_otp' | 'order_id';
type WarrantyReason = 'out_of_pro' | 'wrong_password' | 'device_limit' | 'other';
type ReplacementPhase = 'idle' | 'checking' | 'verifying' | 'allocating' | 'completed';

export const LookupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LookupTab>('email_otp');
  const [emailInput, setEmailInput] = useState('');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Verified Order Mock State
  const [accountEmail, setAccountEmail] = useState('cursor.dev.pro92@gmail.com');
  const [accountPassword, setAccountPassword] = useState('pX!9#vK2_devSec2026');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Warranty Bot State
  const [selectedReason, setSelectedReason] = useState<WarrantyReason>('out_of_pro');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [replacementPhase, setReplacementPhase] = useState<ReplacementPhase>('idle');
  const [replacementCount, setReplacementCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aipro_replacement_count');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for OTP
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Handle OTP send
  const handleSendOtp = () => {
    if (!emailInput.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    setErrorMsg('');
    setOtpSent(true);
    setOtpCooldown(60);
    trackEvent('otp_requested', { email: emailInput });
  };

  // Handle OTP input change with auto-focus next
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Pasted full code
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpValues];
      digits.forEach((d, idx) => {
        newOtp[idx] = d;
      });
      setOtpValues(newOtp);
      if (digits.length === 6) {
        setIsVerified(true);
        trackEvent('order_lookup_success', { lookup_method: 'email_otp' });
      }
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      setIsVerified(true);
      trackEvent('order_lookup_success', { lookup_method: 'email_otp' });
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle lookup by Order ID
  const handleOrderLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) {
      setErrorMsg('Vui lòng nhập mã đơn hàng');
      return;
    }
    setIsVerified(true);
    trackEvent('order_lookup_success', { lookup_method: 'order_id', orderId: orderIdInput });
  };

  // Trigger automated replacement flow
  const handleStartReplacement = () => {
    if (replacementCount >= 2) {
      return;
    }

    setShowConfirmModal(false);
    setReplacementPhase('checking');
    trackEvent('warranty_claim_initiated', { reason: selectedReason });

    // Step 1: Checking (1s)
    setTimeout(() => {
      setReplacementPhase('verifying');
      // Step 2: Verifying (2s)
      setTimeout(() => {
        setReplacementPhase('allocating');
        // Step 3: Allocating (3s)
        setTimeout(() => {
          setReplacementPhase('completed');
          // Update credentials with new account
          const newEmail = `cursor.pro.fresh${Math.floor(100 + Math.random() * 900)}@gmail.com`;
          const newPass = `kL9#mZ_${Math.random().toString(36).substring(2, 10)}`;
          setAccountEmail(newEmail);
          setAccountPassword(newPass);

          const newCount = replacementCount + 1;
          setReplacementCount(newCount);
          localStorage.setItem('aipro_replacement_count', String(newCount));

          trackEvent('warranty_claim_resolved', { newAccount: newEmail });
        }, 2500);
      }, 2000);
    }, 1500);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6 py-10 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
          Tra Cứu Đơn Hàng &amp; Kích Hoạt Bảo Hành
        </h1>
        <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
          Quản lý License Vault và tự phục hồi tài khoản 1-đổi-1 tự động trong 60 giây không cần mật khẩu.
        </p>
      </div>

      {/* STAGE 1: FAST LOOKUP GATE (When not verified) */}
      {!isVerified ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border-subtle shadow-card-hover max-w-lg mx-auto">
          {/* Tabs */}
          <div className="flex rounded-xl bg-canvas p-1 border border-border-subtle mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email_otp');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'email_otp' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Tra cứu theo Email (Mã OTP)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('order_id');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'order_id' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Mã Đơn Hàng (#AIPRO-XXXX)
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: EMAIL + OTP */}
          {activeTab === 'email_otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Email đã dùng khi thanh toán:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="alex.dev@gmail.com"
                    className="flex-1 h-11 px-4 rounded-xl bg-canvas border border-border-subtle text-xs text-text-primary focus:border-border-focus focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={otpCooldown > 0}
                    onClick={handleSendOtp}
                    className="h-11 px-4 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-semibold shrink-0 disabled:opacity-50"
                  >
                    {otpCooldown > 0 ? `Gửi lại (${otpCooldown}s)` : 'Gửi mã OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="pt-3 border-t border-border-subtle/50 animate-fadeIn">
                  <span className="block text-xs text-text-muted mb-2 text-center">
                    Nhập mã 6 số gửi về email của bạn (Mẹo test: nhập 6 số bất kỳ hoặc mã 123456):
                  </span>
                  <div className="flex justify-center gap-2">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-12 text-center font-mono text-lg font-bold rounded-xl bg-canvas border border-border-subtle focus:border-border-focus focus:outline-none text-accent-cyan"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDER ID */}
          {activeTab === 'order_id' && (
            <form onSubmit={handleOrderLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Mã đơn hàng:
                </label>
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="Ví dụ: AIPRO-94820"
                  className="w-full h-11 px-4 rounded-xl bg-canvas border border-border-subtle font-mono text-xs text-text-primary focus:border-border-focus focus:outline-none uppercase"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold"
              >
                Tra cứu tức thì
              </button>
            </form>
          )}
        </div>
      ) : (
        /* STAGE 2: VERIFIED ORDER & WARRANTY DASHBOARD */
        <div className="space-y-8 animate-fadeIn">
          {/* Order Details Header Card */}
          <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle/60">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">Đơn Hàng #AIPRO-94820</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
                    🟢 Đang Bảo Hành (Còn 88 ngày)
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1">Gói: Cursor Pro 3 Tháng &bull; Ngày mua: 22/03/2026</p>
              </div>

              <button
                type="button"
                onClick={() => setIsVerified(false)}
                className="text-xs text-text-muted hover:text-text-primary self-start sm:self-auto underline"
              >
                Đăng xuất phiên tra cứu
              </button>
            </div>

            {/* Current Credentials */}
            <div className="mt-5 space-y-3">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                Thông Tin Đăng Nhập Hiện Tại:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between">
                  <span className="text-text-primary select-all">{accountEmail}</span>
                  <button
                    onClick={() => handleCopy(accountEmail, 'email')}
                    className="text-text-muted hover:text-text-primary ml-2"
                  >
                    {copied === 'email' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between">
                  <span>{showPassword ? accountPassword : '••••••••••••••••'}</span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(accountPassword, 'pass')}
                      className="text-text-muted hover:text-text-primary"
                    >
                      {copied === 'pass' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SELF-SERVICE AUTO-REPLACEMENT BOT CARD */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-accent-cyan/30 shadow-[0_0_30px_rgba(0,240,255,0.05)]">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle/60 mb-6">
              <div>
                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-cyan" />
                  Trung Tâm Tự Phục Vụ Bảo Hành (Self-Service Bot)
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Tự động cấp đổi 1 tài khoản mới tinh trong 60 giây nếu phát sinh lỗi kỹ thuật.
                </p>
              </div>
              <span className="text-xs font-mono text-text-muted">
                Đã đổi: <span className="text-accent-cyan font-bold">{replacementCount}</span>/2 lần hôm nay
              </span>
            </div>

            {/* Active Replacement Progress Stepper */}
            {replacementPhase !== 'idle' && (
              <div className="mb-6 p-4 rounded-xl bg-canvas border border-border-focus animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-semibold mb-3">
                  <span className="text-text-primary">Tiến trình khôi phục tự động:</span>
                  <span className="text-accent-cyan font-mono capitalize">{replacementPhase}...</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${replacementPhase === 'checking' ? 'text-accent-cyan font-bold' : 'text-status-success'}`}>
                    <Check className="w-3.5 h-3.5" />
                    <span>[01s] Kiểm tra tình trạng kết nối trên hệ thống Cursor...</span>
                  </div>
                  {(replacementPhase === 'verifying' || replacementPhase === 'allocating' || replacementPhase === 'completed') && (
                    <div className={`flex items-center gap-2 ${replacementPhase === 'verifying' ? 'text-accent-cyan font-bold' : 'text-status-success'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>[03s] Xác nhận lỗi hợp lệ theo điều khoản cam kết SLA 1-đổi-1...</span>
                    </div>
                  )}
                  {(replacementPhase === 'allocating' || replacementPhase === 'completed') && (
                    <div className={`flex items-center gap-2 ${replacementPhase === 'allocating' ? 'text-accent-cyan font-bold' : 'text-status-success'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>[06s] Trích xuất tài khoản dự phòng mới tinh từ kho...</span>
                    </div>
                  )}
                  {replacementPhase === 'completed' && (
                    <div className="flex items-center gap-2 text-status-success font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>[08s] Hoàn tất! Tài khoản mới đã được bàn giao lên màn hình và gửi vào email của bạn.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reason Selection */}
            {replacementPhase === 'idle' && (
              <>
                <div className="mb-6">
                  <span className="block text-xs font-semibold text-text-secondary mb-3">
                    Bạn đang gặp vấn đề gì với tài khoản này?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                      selectedReason === 'out_of_pro' ? 'bg-elevated border-primary-blue text-text-primary' : 'bg-canvas border-border-subtle text-text-secondary'
                    }`}>
                      <input
                        type="radio"
                        name="reason"
                        checked={selectedReason === 'out_of_pro'}
                        onChange={() => setSelectedReason('out_of_pro')}
                        className="text-primary-blue"
                      />
                      <span>Bị out gói Pro / Mất Pro</span>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                      selectedReason === 'wrong_password' ? 'bg-elevated border-primary-blue text-text-primary' : 'bg-canvas border-border-subtle text-text-secondary'
                    }`}>
                      <input
                        type="radio"
                        name="reason"
                        checked={selectedReason === 'wrong_password'}
                        onChange={() => setSelectedReason('wrong_password')}
                        className="text-primary-blue"
                      />
                      <span>Sai mật khẩu đăng nhập</span>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                      selectedReason === 'device_limit' ? 'bg-elevated border-primary-blue text-text-primary' : 'bg-canvas border-border-subtle text-text-secondary'
                    }`}>
                      <input
                        type="radio"
                        name="reason"
                        checked={selectedReason === 'device_limit'}
                        onChange={() => setSelectedReason('device_limit')}
                        className="text-primary-blue"
                      />
                      <span>Bị giới hạn thiết bị</span>
                    </label>
                  </div>
                </div>

                {replacementCount >= 2 ? (
                  <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 text-xs text-status-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Bạn đã sử dụng tối đa 2 lần đổi tự động trong 24 giờ để bảo vệ đơn hàng. Vui lòng bấm liên hệ Kỹ thuật viên Telegram bên dưới để được kiểm tra trực tiếp.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-blue to-[#257CFF] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-2 glow-blue-button transition-all"
                  >
                    <Zap className="w-4 h-4 text-accent-cyan fill-accent-cyan" />
                    <span>⚡ KÍCH HOẠT ĐỔI MỚI TÀI KHOẢN TỰ ĐỘNG (60S)</span>
                  </button>
                )}
              </>
            )}

            {/* Escalation hotline */}
            <div className="mt-6 pt-4 border-t border-border-subtle/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
              <span>Sự cố phức tạp hơn cần hỗ trợ riêng?</span>
              <button
                type="button"
                onClick={() => openTelegramSupport('AIPRO-94820', { reason: selectedReason })}
                className="text-primary-blue hover:underline font-semibold"
              >
                [Kết nối Kỹ thuật viên Telegram 24/7]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-surface border border-border-focus shadow-2xl max-w-md w-full animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-status-warning/10 text-status-warning mx-auto mb-4 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-text-primary text-center">Xác Nhận Đổi Mới Tài Khoản</h3>
            <p className="text-xs text-text-secondary mt-2 text-center leading-relaxed">
              Hệ thống sẽ thu hồi tài khoản cũ và trích xuất ngay 1 tài khoản Cursor Pro mới tinh từ kho dự phòng lên màn hình của bạn. Bạn có chắc chắn muốn thực hiện?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-10 rounded-xl bg-canvas border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleStartReplacement}
                className="flex-1 h-10 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold"
              >
                Xác nhận đổi ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
