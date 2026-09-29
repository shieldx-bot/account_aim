import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_MEMBER_SUBSCRIPTIONS } from '@/data/mockMemberData';
import { useAuth } from '@/context/AuthContext';
import {
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  ExternalLink,
  Code2,
  Lock,
} from 'lucide-react';

export const MemberSubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'alex.dev@gmail.com';
  const initialSubscriptions = isDemoUser ? MOCK_MEMBER_SUBSCRIPTIONS : [];
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleAutoRenew = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, autoRenew: !sub.autoRenew } : sub))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
            Quản lý Tài khoản AI &amp; Credentials
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Toàn bộ tài khoản AI Pro bản quyền đã mua, khóa truy cập API và thiết lập gia hạn.
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary-blue/25 transition-all text-center"
        >
          + Mua thêm tài khoản mới
        </Link>
      </div>

      {/* Subscriptions Cards */}
      <div className="space-y-4">
        {subscriptions.length > 0 ? (
          subscriptions.map((sub) => {
            const isRevealed = !!revealedIds[sub.id];

            return (
              <div
                key={sub.id}
                className="bg-surface border border-border-subtle hover:border-primary-blue/30 rounded-2xl p-6 transition-all shadow-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-canvas border border-border-subtle flex items-center justify-center text-primary-blue">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-text-primary">{sub.productName}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-canvas text-text-muted text-[10px] font-mono uppercase">
                          {sub.brand}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        Phương thức:{' '}
                        <strong className="text-text-primary">
                          {sub.provisioningType === 'invite_email' ? 'Gán Email chính chủ' : 'Tài khoản cấp sẵn'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-text-muted block">Hạn sử dụng đến:</span>
                      <span className="font-mono text-xs font-bold text-text-primary">{sub.expiresAt}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        sub.status === 'expiring_soon'
                          ? 'bg-status-warning/15 text-status-warning'
                          : 'bg-status-success/15 text-status-success'
                      }`}
                    >
                      Còn {sub.daysRemaining} ngày
                    </span>
                  </div>
                </div>

                {/* Credentials & Tokens Vault Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
                  {/* Email Access */}
                  <div className="p-3 rounded-xl bg-canvas border border-border-subtle font-mono text-xs">
                    <span className="text-[10px] text-text-muted block uppercase mb-1">Email đăng nhập / nhận quyền</span>
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary truncate">{sub.accountEmail}</span>
                      <button
                        onClick={() => handleCopy(sub.accountEmail, `email-${sub.id}`)}
                        className="p-1 text-text-muted hover:text-text-primary"
                      >
                        {copiedKey === `email-${sub.id}` ? (
                          <Check className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password if available */}
                  {sub.accountPassword && (
                    <div className="p-3 rounded-xl bg-canvas border border-border-subtle font-mono text-xs">
                      <span className="text-[10px] text-text-muted block uppercase mb-1">Mật khẩu bảo mật</span>
                      <div className="flex items-center justify-between">
                        <span className="text-text-primary">
                          {isRevealed ? sub.accountPassword : '••••••••••••••••'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleReveal(sub.id)}
                            className="p-1 text-text-muted hover:text-text-primary"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(sub.accountPassword!, `pass-${sub.id}`)}
                            className="p-1 text-text-muted hover:text-text-primary"
                          >
                            {copiedKey === `pass-${sub.id}` ? (
                              <Check className="w-3.5 h-3.5 text-status-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Access Token if available */}
                  {sub.accessToken && (
                    <div className="p-3 rounded-xl bg-canvas border border-border-subtle font-mono text-xs">
                      <span className="text-[10px] text-text-muted block uppercase mb-1">Session Token (Claude API)</span>
                      <div className="flex items-center justify-between">
                        <span className="text-text-primary truncate max-w-[150px]">
                          {isRevealed ? sub.accessToken : 'sk-ant-••••••••••••'}
                        </span>
                        <button
                          onClick={() => handleCopy(sub.accessToken!, `token-${sub.id}`)}
                          className="p-1 text-text-muted hover:text-text-primary"
                        >
                          {copiedKey === `token-${sub.id}` ? (
                            <Check className="w-3.5 h-3.5 text-status-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer row of card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sub.autoRenew}
                      onChange={() => toggleAutoRenew(sub.id)}
                      className="w-4 h-4 rounded border-border-subtle bg-canvas text-primary-blue focus:ring-primary-blue/20"
                    />
                    <span className="text-text-secondary">
                      Tự động gia hạn khi số dư ví đủ (chiết khấu thêm 5%)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/lookup"
                      className="px-3 py-1.5 rounded-lg bg-canvas hover:bg-canvas-subtle border border-border-subtle text-text-secondary hover:text-status-error flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Báo lỗi / Yêu cầu đổi mới</span>
                    </Link>
                    <Link
                      to={`/product/${sub.productSlug}`}
                      className="px-4 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-hover text-white font-bold transition-all"
                    >
                      Gia hạn gói
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle shadow-sm">
            <KeyRound className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-base font-bold text-text-primary mb-1">Chưa có tài khoản nào</h3>
            <p className="text-xs text-text-secondary mb-5">Khám phá các gói AI Pro mạnh mẽ nhất để bắt đầu.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-blue/20"
            >
              Xem Cửa hàng ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
