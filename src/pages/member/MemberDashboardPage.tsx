import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { MOCK_MEMBER_SUBSCRIPTIONS, MOCK_MEMBER_ORDERS } from '@/data/mockMemberData';
import {
  KeyRound,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const MemberDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPassId, setRevealedPassId] = useState<string | null>(null);

  const isDemoUser = user?.email === 'alex.dev@gmail.com';
  const userSubscriptions = isDemoUser ? MOCK_MEMBER_SUBSCRIPTIONS : [];
  const userOrders = isDemoUser ? MOCK_MEMBER_ORDERS : [];
  const activeCount = userSubscriptions.filter((s) => s.status === 'active').length;
  const expiringCount = userSubscriptions.filter((s) => s.status === 'expiring_soon').length;
  const expiringSub = userSubscriptions.find((s) => s.status === 'expiring_soon');
  const totalSpentVND = userOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalSpentUSD = totalSpentVND / 25000;
  const points = Math.floor(totalSpentVND / 10000);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface to-surface-subtle border border-border-subtle">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-primary-blue/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/30 text-accent-cyan text-xs font-bold font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cấp bậc {user?.tier || 'Standard'} • Giảm 5% mọi đơn hàng</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
              Chào mừng trở lại, {user?.name || 'Developer'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Bạn có {activeCount} tài khoản AI Pro đang hoạt động với cam kết bảo hành 1-đổi-1 tự động 24/7.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/lookup"
              className="px-4 py-2.5 rounded-xl bg-status-error/10 hover:bg-status-error/20 border border-status-error/30 text-status-error text-xs font-bold transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Bot Đổi Trả Tự Động</span>
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary-blue/25 transition-all flex items-center gap-2"
            >
              <span>Mua thêm tài khoản</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Tài khoản Active</span>
            <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-text-primary">{activeCount}</div>
          <span className="text-[11px] text-status-success font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Hoạt động bình thường</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Sắp hết hạn</span>
            <div className="w-8 h-8 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-status-warning">{expiringCount}</div>
          <span className="text-[11px] text-text-muted mt-1 block">
            {expiringSub ? `${expiringSub.productName} (còn ${expiringSub.daysRemaining} ngày)` : 'Không có tài khoản sắp hết hạn'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Tổng chi tiêu</span>
            <div className="w-8 h-8 rounded-lg bg-primary-blue/10 text-primary-blue flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-text-primary">
            {formatPrice(totalSpentVND, totalSpentUSD)}
          </div>
          <span className="text-[11px] text-accent-cyan font-medium mt-1 block">
            Đã tích lũy {points} điểm thưởng
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Số dư ví khả dụng</span>
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-accent-cyan">
            {formatPrice(user?.balanceVND || 0, user?.balanceUSD || 0)}
          </div>
          <span className="text-[11px] text-status-success font-medium mt-1 block">
            Sẵn sàng gia hạn tức thì
          </span>
        </div>
      </div>

      {/* Active Subscriptions Vault section */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary">Tài khoản AI đang sở hữu</h2>
            <p className="text-xs text-text-secondary">Thông tin truy cập bảo mật và thời hạn sử dụng.</p>
          </div>
          <Link
            to="/member/subscriptions"
            className="text-xs font-semibold text-primary-blue hover:text-accent-cyan flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả chi tiết</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {userSubscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userSubscriptions.map((sub) => {
              const isRevealed = revealedPassId === sub.id;
              const isCopied = copiedId === sub.id;

              return (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border transition-all ${
                    sub.status === 'expiring_soon'
                      ? 'bg-status-warning/5 border-status-warning/30'
                      : 'bg-canvas border-border-subtle hover:border-primary-blue/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-text-muted">{sub.brand}</span>
                      <h3 className="text-sm font-bold text-text-primary">{sub.productName}</h3>
                    </div>
                    {sub.status === 'expiring_soon' ? (
                      <span className="px-2 py-0.5 rounded-full bg-status-warning/20 text-status-warning text-[10px] font-bold font-mono">
                        Hết hạn sau {sub.daysRemaining} ngày
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success text-[10px] font-bold font-mono">
                        Active • {sub.daysRemaining} ngày
                      </span>
                    )}
                  </div>

                  {/* Account Details */}
                  <div className="space-y-2 mb-4 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-surface border border-border-subtle flex items-center justify-between">
                      <span className="text-text-muted text-[11px] truncate max-w-[170px]">{sub.accountEmail}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(sub.accountEmail, `email-${sub.id}`)}
                        className="text-text-muted hover:text-text-primary p-1"
                        title="Copy email"
                      >
                        {copiedId === `email-${sub.id}` ? (
                          <Check className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {sub.accountPassword && (
                      <div className="p-2 rounded-lg bg-surface border border-border-subtle flex items-center justify-between">
                        <span className="text-text-primary text-[11px]">
                          {isRevealed ? sub.accountPassword : '••••••••••••'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setRevealedPassId(isRevealed ? null : sub.id)}
                            className="text-text-muted hover:text-text-primary p-1"
                            title="Ẩn/hiện mật khẩu"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(sub.accountPassword!, `pass-${sub.id}`)}
                            className="text-text-muted hover:text-text-primary p-1"
                            title="Copy mật khẩu"
                          >
                            {copiedId === `pass-${sub.id}` ? (
                              <Check className="w-3.5 h-3.5 text-status-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/product/${sub.productSlug}`}
                      className="flex-1 py-1.5 rounded-lg bg-primary-blue/15 hover:bg-primary-blue/25 text-primary-blue text-xs font-bold text-center transition-colors"
                    >
                      Gia hạn ngay
                    </Link>
                    <Link
                      to="/lookup"
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
                      title="Báo lỗi / Bảo hành"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-canvas rounded-xl border border-border-subtle">
            <p className="text-xs text-text-muted">Bạn chưa có tài khoản AI nào. Khám phá cửa hàng ngay!</p>
            <Link to="/" className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary-blue text-white text-xs font-bold hover:bg-primary-hover transition-colors">Mua ngay</Link>
          </div>
        )}
      </div>

      {/* Recent Orders table */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary">Đơn hàng gần đây</h2>
            <p className="text-xs text-text-secondary">Lịch sử giao dịch và hóa đơn điện tử.</p>
          </div>
          <Link
            to="/member/orders"
            className="text-xs font-semibold text-primary-blue hover:text-accent-cyan flex items-center gap-1 transition-colors"
          >
            <span>Tất cả đơn hàng</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Số Tiền</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {userOrders.length > 0 ? (
                userOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-accent-cyan">{ord.orderId}</td>
                    <td className="py-3 px-4 font-sans font-medium text-text-primary">
                      {ord.productName} ({ord.planDurationMonths} tháng)
                    </td>
                    <td className="py-3 px-4 text-text-muted">{ord.createdAt}</td>
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {formatPrice(ord.totalAmount, ord.totalAmount / 25000)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        <span>Đã bàn giao</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/order/success/${ord.orderId}`}
                        className="inline-flex items-center gap-1 text-primary-blue hover:text-accent-cyan font-semibold text-xs"
                      >
                        <span>Xem Vault</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-text-muted">Chưa có đơn hàng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
