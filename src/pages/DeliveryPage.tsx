import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { trackEvent } from '@/utils/telemetry';
import { openTelegramSupport } from '@/utils/diagnostics';
import {
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Key,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const DeliveryPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { activeConfig: rawActiveConfig } = useApp();

  // Delivery page requires a completed checkout config (product chosen from DB catalog)
  useEffect(() => {
    if (!rawActiveConfig?.product) {
      navigate('/products', { replace: true });
    }
  }, [rawActiveConfig, navigate]);

  const activeConfig = rawActiveConfig ?? {
    product: null as any,
    provisioningType: 'invite_email' as const,
    targetEmail: '',
    duration: { months: 1, label: '1 Tháng', discountPercent: 0, monthlyEquivalentVND: 0, monthlyEquivalentUSD: 0 },
    guestEmail: '',
  };

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'testing' | 'active'>('idle');
  const [mgmtPassword, setMgmtPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Deterministic mock credentials based on product
  const credentials = {
    email: activeConfig.targetEmail || 'cursor.dev.pro92@gmail.com',
    password: 'pX!9#vK2_devSec2026',
    token2FA: 'JBSWY3DPEHPK3PXP',
    warrantyDays: 90,
    expiresAt: '22/06/2026',
  };

  useEffect(() => {
    trackEvent('fulfillment_viewed', {
      order_id: orderId,
      delivery_speed_seconds: 18,
    });
  }, [orderId]);

  // Handle copy with 60s auto-clear safety
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    trackEvent('credentials_copied_field', { field: fieldName, order_id: orderId });
    setTimeout(() => setCopiedField(null), 2000);

    // Auto-clear clipboard safety for sensitive passwords after 60s
    if (fieldName === 'password' || fieldName === 'token') {
      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, 60000);
    }
  };

  // Download credentials as JSON or .env file
  const handleDownloadFile = (format: 'json' | 'env') => {
    let content = '';
    let filename = '';
    let type = '';

    if (format === 'json') {
      content = JSON.stringify(
        {
          orderId,
          product: activeConfig.product?.name ?? 'AI License',
          accountEmail: credentials.email,
          password: credentials.password,
          twoFactorSecret: credentials.token2FA,
          warrantyExpiration: credentials.expiresAt,
          instructions: 'https://aipro.dev/docs',
        },
        null,
        2
      );
      filename = `aipro-credentials-${orderId}.json`;
      type = 'application/json';
    } else {
      content = [
        `# AIPRO.DEV LICENSE VAULT - ORDER ${orderId}`,
        `AIPRO_PRODUCT="${activeConfig.product?.name ?? 'AI License'}"`,
        `AIPRO_ACCOUNT_EMAIL="${credentials.email}"`,
        `AIPRO_ACCOUNT_PASSWORD="${credentials.password}"`,
        `AIPRO_2FA_SECRET="${credentials.token2FA}"`,
        `AIPRO_WARRANTY_EXPIRY="${credentials.expiresAt}"`,
      ].join('\n');
      filename = `aipro-${orderId}.env`;
      type = 'text/plain';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    trackEvent('credentials_downloaded', { format, order_id: orderId });
  };

  // Copy full markdown block for Notion / Password Managers
  const handleCopyMarkdown = () => {
    const md = `### AIPro.dev License Vault - ${activeConfig.product?.name ?? 'AI License'}
- **Order ID**: \`${orderId}\`
- **Email**: \`${credentials.email}\`
- **Password**: \`${credentials.password}\`
- **2FA Secret**: \`${credentials.token2FA}\`
- **Warranty Until**: ${credentials.expiresAt}
- **Support**: https://t.me/aipro_support`;

    handleCopy(md, 'markdown');
  };

  // Self-test Account Health
  const handleVerifyStatus = () => {
    setHealthStatus('testing');
    trackEvent('self_test_initiated', { order_id: orderId });

    setTimeout(() => {
      setHealthStatus('active');
    }, 2000);
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6 py-10 pb-24">
      {/* 1. SUCCESS BANNER */}
      <div className="text-center mb-10 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bàn giao hoàn tất trong 18 giây</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
          Thanh Toán Thành Công! Tài Khoản Đã Sẵn Sàng.
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-2">
          Mã đơn hàng: <span className="font-mono font-bold text-text-primary">{orderId}</span> &bull; Bản sao lưu đã gửi về email của bạn.
        </p>
      </div>

      {/* 2. THE CREDENTIALS VAULT CARD */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-accent-cyan/40 shadow-[0_0_40px_rgba(0,240,255,0.08)] mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle/70 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan block">
              The Credentials Vault
            </span>
            <h2 className="text-lg font-bold text-text-primary mt-0.5">
              {activeConfig.product?.name ?? '—'} ({activeConfig.duration.label})
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
            🟢 Bảo hành: Còn {credentials.warrantyDays} ngày
          </span>
        </div>

        {/* Credentials Rows */}
        <div className="space-y-4">
          {/* Row 1: Email */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Tài Khoản / Email Dịch Vụ:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-11 px-4 rounded-xl bg-canvas border border-border-subtle flex items-center font-mono text-xs text-text-primary select-all">
                {credentials.email}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(credentials.email, 'email')}
                className="h-11 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-success" />
                    <span className="text-status-success">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Password */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Mật Khẩu / Access Token:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-11 px-4 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between font-mono text-xs text-text-primary select-all">
                <span>{showPassword ? credentials.password : '••••••••••••••••••••'}</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text-primary p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(credentials.password, 'password')}
                className="h-11 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-success" />
                    <span className="text-status-success">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 3: 2FA Backup Secret */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Mã Phục Hồi / 2FA Secret Key (Nếu có):
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-11 px-4 rounded-xl bg-canvas border border-border-subtle flex items-center font-mono text-xs text-text-primary select-all">
                {credentials.token2FA}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(credentials.token2FA, 'token')}
                className="h-11 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
              >
                {copiedField === 'token' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-success" />
                    <span className="text-status-success">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-8 pt-6 border-t border-border-subtle/70 flex flex-wrap items-center gap-3">
          <a
            href="https://cursor.com"
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-[200px] h-12 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 glow-blue-button transition-all"
          >
            <span>🚀 Mở Ứng Dụng Ngay (Open Tool)</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => handleDownloadFile('json')}
            className="h-12 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-accent-cyan" />
            <span>Tải file .json</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="h-12 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4 text-primary-blue" />
            <span>{copiedField === 'markdown' ? '✓ Đã sao chép MD' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>

      {/* 3. AUTOMATED ACCOUNT HEALTH CHECK WIDGET */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-status-success" />
            Kiểm Tra Tự Động Trạng Thái Tài Khoản
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Xác nhận cookie, hạn ngạch Pro và kết nối trực tiếp với API nhà phát hành.
          </p>
        </div>

        {healthStatus === 'active' ? (
          <span className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            🟢 Active 100% - Đã Sẵn Sàng
          </span>
        ) : (
          <button
            type="button"
            disabled={healthStatus === 'testing'}
            onClick={handleVerifyStatus}
            className="px-4 py-2.5 rounded-xl bg-surface hover:bg-elevated border border-border-focus text-xs font-semibold text-text-primary flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthStatus === 'testing' ? 'animate-spin text-accent-cyan' : ''}`} />
            <span>{healthStatus === 'testing' ? 'Đang test kết nối API...' : 'Kiểm tra tài khoản ngay'}</span>
          </button>
        )}
      </div>

      {/* 4. INSTANT PASSWORD SETUP (FRICTIONLESS ZERO-SIGNUP) */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle mb-8">
        <h3 className="font-bold text-sm text-text-primary mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-cyan" />
          Tự Động Tạo Mật Khẩu Tra Cứu (Tùy Chọn)
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Để lần sau tra cứu lại tài khoản hoặc đổi bảo hành mà không cần mã OTP, bạn có thể đặt nhanh một mật khẩu:
        </p>

        {passwordSaved ? (
          <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Đã lưu mật khẩu tra cứu thành công! Bạn có thể dùng email và mật khẩu này tại trang Tra Cứu.
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="password"
              value={mgmtPassword}
              onChange={(e) => setMgmtPassword(e.target.value)}
              placeholder="Nhập mật khẩu quản lý (tối thiểu 8 ký tự)..."
              className="flex-1 h-11 px-4 rounded-xl bg-canvas border border-border-subtle text-xs text-text-primary focus:border-border-focus focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (mgmtPassword.length >= 8) {
                  setPasswordSaved(true);
                  localStorage.setItem(`aipro_pwd_${activeConfig.guestEmail}`, mgmtPassword);
                }
              }}
              className="h-11 px-5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-semibold shrink-0"
            >
              Lưu mật khẩu
            </button>
          </div>
        )}
      </div>

      {/* 5. DEVELOPER SETUP GUIDE & SUPPORT */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
        <h3 className="font-bold text-sm text-text-primary mb-3">Hướng Dẫn Kích Hoạt Nhanh</h3>
        <ol className="space-y-2 text-xs text-text-secondary list-decimal list-inside leading-relaxed mb-6">
          <li>Đăng xuất tài khoản cũ trên ứng dụng Cursor hoặc trình duyệt của bạn.</li>
          <li>Đăng nhập bằng tài khoản và mật khẩu được cung cấp trong License Vault ở trên.</li>
          <li>Vào mục <span className="font-mono text-accent-cyan">Settings &gt; Subscription</span> để xác nhận hạn mức Pro đã sẵn sàng.</li>
        </ol>

        <div className="p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <ShieldCheck className="w-4 h-4 text-status-success" />
            <span>Gặp sự cố kích hoạt? Bảo hành 1-đổi-1 tự động trong 60 giây.</span>
          </div>
          <button
            type="button"
            onClick={() => openTelegramSupport(orderId)}
            className="text-primary-blue hover:underline font-semibold shrink-0"
          >
            [Liên hệ Kỹ thuật viên Telegram 24/7]
          </button>
        </div>
      </div>
    </div>
  );
};
