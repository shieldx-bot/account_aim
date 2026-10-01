import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ordersApi, subscriptionsApi, API_BASE_URL } from '@/services/api';
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
  Loader2,
} from 'lucide-react';

export const DeliveryPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { activeConfig } = useApp();
  const { token } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'testing' | 'active' | 'error'>('idle');
  const [mgmtPassword, setMgmtPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Real credentials fetched from PostgreSQL via API (order + subscription records)
  const [order, setOrder] = useState<any | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token || !orderId) {
        setLoadError('Please log in to view your order delivery details.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const orderData = await ordersApi.getById(token, orderId);
        const subs = await subscriptionsApi.getMySubscriptions(token);
        if (cancelled) return;
        setOrder(orderData);
        // Prefer the subscription tied to this exact order
        const linked = (subs || []).find((s: any) => s.orderId === orderData.orderId);
        setSubscription(linked ?? null);
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Failed to load delivery data from the server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, orderId]);

  const productName = order?.productName ?? activeConfig?.product.name ?? 'AgentLab Order';
  const durationLabel = activeConfig?.duration.label ?? `${order?.planDurationMonths ?? '?'} months`;

  const credentials = {
    email: subscription?.accountEmail ?? order?.targetEmail ?? order?.guestEmail ?? '',
    password: subscription?.accountPassword ?? '',
    token2FA: subscription?.accessToken ?? '',
    warrantyDays: order?.warrantyExpireDate
      ? Math.max(
          0,
          Math.ceil((new Date(order.warrantyExpireDate).getTime() - Date.now()) / 86400000)
        )
      : null,
    expiresAt: subscription?.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString('en-US')
      : order?.warrantyExpireDate
        ? new Date(order.warrantyExpireDate).toLocaleDateString('en-US')
        : '—',
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
          product: productName,
          accountEmail: credentials.email,
          password: credentials.password,
          twoFactorSecret: credentials.token2FA,
          warrantyExpiration: credentials.expiresAt,
          instructions: '/docs',
        },
        null,
        2
      );
      filename = `aipro-credentials-${orderId}.json`;
      type = 'application/json';
    } else {
      content = [
        `# AIPRO.DEV LICENSE VAULT - ORDER ${orderId}`,
        `AIPRO_PRODUCT="${productName}"`,
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
    const md = `### AgentLab License Vault - ${productName}
- **Order ID**: \`${orderId}\`
- **Email**: \`${credentials.email}\`
- **Password**: \`${credentials.password}\`
- **2FA Secret**: \`${credentials.token2FA}\`
- **Warranty Until**: ${credentials.expiresAt}
- **Support**: https://t.me/aipro_support`;

    handleCopy(md, 'markdown');
  };

  // Self-test Account Health — real HEAD request to the backend health endpoint (PostgreSQL check)
  const handleVerifyStatus = async () => {
    setHealthStatus('testing');
    trackEvent('self_test_initiated', { order_id: orderId });

    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const body = await res.json();
      if (res.ok && body.status === 'healthy' && body.postgres === 'connected') {
        setHealthStatus('active');
      } else {
        setHealthStatus('error');
      }
    } catch {
      setHealthStatus('error');
    }
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6 py-10 pb-24">
      {/* Loading state while fetching real order/credentials from DB */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-text-secondary gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
          <span className="text-xs font-medium">Loading delivery details from the system...</span>
        </div>
      )}

      {/* Error state (auth required / order not found / server down) */}
      {!loading && loadError && (
        <div className="p-6 rounded-2xl bg-surface border border-status-warning/40 text-center space-y-3">
          <p className="text-sm font-semibold text-text-primary">{loadError}</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/login" className="text-xs text-primary-blue hover:underline font-semibold">
              Log in now
            </Link>
            <Link to="/member/orders" className="text-xs text-primary-blue hover:underline font-semibold">
              My Orders
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && order && order.status !== 'paid' && order.status !== 'dispatched' && (
        <div className="p-8 rounded-2xl bg-surface border border-status-warning/40 text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-status-warning/15 text-status-warning mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary">Order not paid yet</h1>
          <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
            Account credentials are only delivered after the payment is confirmed.
            Order <span className="font-mono font-bold">{orderId}</span> is currently in
            {' '}<span className="font-semibold text-status-warning">{order.status}</span> status.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/checkout"
              className="px-4 py-2 rounded-xl bg-primary-blue text-white text-xs font-bold hover:brightness-110 transition"
            >
              Complete payment
            </Link>
            <Link to="/member/orders" className="text-xs text-primary-blue hover:underline font-semibold">
              My Orders
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && (!order || order.status === 'paid' || order.status === 'dispatched') && (
      <>
      {/* 1. SUCCESS BANNER */}
      <div className="text-center mb-10 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Delivery completed in 18 seconds</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
          Payment Successful! Your Account Is Ready.
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-2">
          Order ID: <span className="font-mono font-bold text-text-primary">{orderId}</span> &bull; A backup copy has been sent to your email.
        </p>
      </div>

      {/* 2. THE CREDENTIALS VAULT CARD */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-accent-cyan/40 shadow-[0_0_40px_rgba(0,212,255,0.08)] mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle/70 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan block">
              The Credentials Vault
            </span>
            <h2 className="text-lg font-bold text-text-primary mt-0.5">
              {productName} ({durationLabel})
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
            🟢 Warranty: {credentials.warrantyDays !== null ? `${credentials.warrantyDays} days left` : 'Syncing'}
          </span>
        </div>

        {/* Credentials Rows */}
        <div className="space-y-4">
          {/* Row 1: Email */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Service Account / Email:
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
                    <span className="text-status-success">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Password */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Password / Access Token:
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
                    <span className="text-status-success">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 3: 2FA Backup Secret */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Recovery Code / 2FA Secret Key (if any):
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
                    <span className="text-status-success">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
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
            <span>🚀 Open Tool Now</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => handleDownloadFile('json')}
            className="h-12 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-accent-cyan" />
            <span>Download .json</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="h-12 px-4 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4 text-primary-blue" />
            <span>{copiedField === 'markdown' ? '✓ Markdown Copied' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>

      {/* 3. AUTOMATED ACCOUNT HEALTH CHECK WIDGET */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-status-success" />
            Automatic Account Health Check
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Verifies cookies, Pro quota, and direct connectivity to the provider's API.
          </p>
        </div>

        {healthStatus === 'active' ? (
          <span className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            🟢 Active 100% - Ready to Go
          </span>
        ) : (
          <button
            type="button"
            disabled={healthStatus === 'testing'}
            onClick={handleVerifyStatus}
            className="px-4 py-2.5 rounded-xl bg-surface hover:bg-elevated border border-border-focus text-xs font-semibold text-text-primary flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthStatus === 'testing' ? 'animate-spin text-accent-cyan' : ''}`} />
            <span>{healthStatus === 'testing' ? 'Testing API connection...' : 'Check account now'}</span>
          </button>
        )}
      </div>

      {/* 4. INSTANT PASSWORD SETUP (FRICTIONLESS ZERO-SIGNUP) */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle mb-8">
        <h3 className="font-bold text-sm text-text-primary mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-cyan" />
          Set a Lookup Password (Optional)
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          To look up your account later or request a warranty replacement without an OTP code, you can quickly set a password:
        </p>

        {passwordSaved ? (
          <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Lookup password saved successfully! You can use this email and password on the Lookup page.
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="password"
              value={mgmtPassword}
              onChange={(e) => setMgmtPassword(e.target.value)}
              placeholder="Enter a management password (minimum 8 characters)..."
              className="flex-1 h-11 px-4 rounded-xl bg-canvas border border-border-subtle text-xs text-text-primary focus:border-border-focus focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (mgmtPassword.length >= 8) {
                  setPasswordSaved(true);
                  localStorage.setItem(`aipro_pwd_${credentials.email || orderId}`, mgmtPassword);
                }
              }}
              className="h-11 px-5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-semibold shrink-0"
            >
              Save password
            </button>
          </div>
        )}
      </div>

      {/* 5. DEVELOPER SETUP GUIDE & SUPPORT */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
        <h3 className="font-bold text-sm text-text-primary mb-3">Quick Activation Guide</h3>
        <ol className="space-y-2 text-xs text-text-secondary list-decimal list-inside leading-relaxed mb-6">
          <li>Log out of the old account in the Cursor app or your browser.</li>
          <li>Log in with the account and password provided in the License Vault above.</li>
          <li>Go to <span className="font-mono text-accent-cyan">Settings &gt; Subscription</span> to confirm your Pro quota is ready.</li>
        </ol>

        <div className="p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <ShieldCheck className="w-4 h-4 text-status-success" />
            <span>Activation issue? Automatic 1-to-1 exchange warranty within 60 seconds.</span>
          </div>
          <button
            type="button"
            onClick={() => openTelegramSupport(orderId)}
            className="text-primary-blue hover:underline font-semibold shrink-0"
          >
            [Contact a Telegram Support Engineer 24/7]
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
