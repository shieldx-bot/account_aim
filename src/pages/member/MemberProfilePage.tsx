import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { usdToVnd } from '@/types';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Lock,
  Smartphone,
} from 'lucide-react';

export const MemberProfilePage: React.FC = () => {
  const { user, updateUser, addBalance } = useAuth();
  const { formatPrice } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const [customTopup, setCustomTopup] = useState(200000);
  const [topupSuccess, setTopupSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, phone });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTopup = (amtUSD: number) => {
    // USD is the source of truth; VND field derived for legacy payloads.
    addBalance(usdToVnd(amtUSD), amtUSD);
    setTopupSuccess(true);
    setTimeout(() => setTopupSuccess(false), 3000);
  };

  const handleCopyApi = () => {
    navigator.clipboard.writeText('aipro_live_key_dev_9941a87c12f009');
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
          Cài đặt Tài khoản &amp; Ví tiền
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Quản lý hồ sơ cá nhân, số dư ví nạp tiền tự động và bảo mật 2 lớp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Wallet Top-Up Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-status-success/15 text-status-success flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Số dư ví trả trước</h3>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border-subtle mb-4">
              <span className="text-[10px] text-text-muted block uppercase">Số dư hiện tại</span>
              <div className="font-mono text-2xl font-extrabold text-status-success mt-1">
                {formatPrice(user?.balanceVND || 0, user?.balanceUSD || 0)}
              </div>
            </div>

            {topupSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-status-success/15 border border-status-success/30 text-status-success text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Nạp tiền thành công vào ví!</span>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold text-text-secondary block">Nạp nhanh qua VietQR:</span>
              <div className="grid grid-cols-2 gap-2">
                {[4, 8, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleTopup(amt)}
                    className="p-2.5 rounded-xl bg-canvas hover:bg-canvas-subtle border border-border-subtle hover:border-primary-blue text-xs font-mono text-center transition-all"
                  >
                    +${amt.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Developer API Key */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-lg font-mono text-xs">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-xs font-bold text-text-primary uppercase font-sans">API Key Tự Động Hóa</h3>
            </div>
            <p className="text-[11px] text-text-muted font-sans mb-3">
              Dùng để tự động gia hạn hoặc kích hoạt tài khoản qua CLI / CI-CD pipeline.
            </p>
            <div className="p-2.5 rounded-lg bg-canvas border border-border-subtle flex items-center justify-between">
              <span className="text-text-muted truncate mr-2">aipro_live_•••••••009</span>
              <button
                type="button"
                onClick={handleCopyApi}
                className="p-1 text-primary-blue hover:text-accent-cyan"
              >
                {copiedApiKey ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Profile & Security Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-blue" />
              <span>Hồ sơ cá nhân</span>
            </h3>

            {isSaved && (
              <div className="mb-4 p-3 rounded-xl bg-status-success/15 border border-status-success/30 text-status-success text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã lưu cập nhật thông tin thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-canvas border border-border-subtle rounded-xl text-xs text-text-primary focus:border-primary-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Số điện thoại (Nhận OTP)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full px-3.5 py-2.5 bg-canvas border border-border-subtle rounded-xl text-xs text-text-primary font-mono focus:border-primary-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Email đăng ký (Cố định)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-canvas/50 border border-border-subtle rounded-xl text-xs text-text-muted font-mono cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-blue/20"
                >
                  Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          </div>

          {/* Security & 2FA Card */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-cyan" />
              <span>Bảo mật &amp; Xác thực 2 lớp</span>
            </h3>

            <div className="divide-y divide-border-subtle">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Xác thực 2 yếu tố (2FA OTP)</h4>
                  <p className="text-[11px] text-text-secondary">Yêu cầu OTP khi lấy mật khẩu tài khoản trong Vault.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    twoFactorEnabled ? 'bg-primary-blue' : 'bg-canvas border border-border-subtle'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Đổi mật khẩu tài khoản</h4>
                  <p className="text-[11px] text-text-secondary">Cập nhật mật khẩu định kỳ để bảo vệ quyền lợi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Liên kết đổi mật khẩu đã được gửi về email của bạn.')}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold hover:bg-canvas-subtle"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
