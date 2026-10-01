import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ordersApi, subscriptionsApi } from '@/services/api';
import type { MemberSubscription, OrderItem } from '@/types';
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
  Loader2,
  Gift,
  Users,
} from 'lucide-react';

interface ReferralStats {
  codes: string[];
  totalClicks: number;
  totalRewards: number;
  pendingRewards: number;
  conversions: Array<{
    order_id: string;
    amount_vnd: number;
    reward_type: string;
    product_id: string;
    product_name: string;
    brand: string;
    status: string;
    created_at: string;
  }>;
}

export const MemberDashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const { formatPrice } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPassId, setRevealedPassId] = useState<string | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<MemberSubscription[]>([]);
  const [userOrders, setUserOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  // #InviteToPay — referrer program stats (GET /api/referral/me)
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  // Production: dashboard KPIs & vault come from PostgreSQL via API
  useEffect(() => {
    if (!token) {
      setUserSubscriptions([]);
      setUserOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([subscriptionsApi.getMySubscriptions(token), ordersApi.getMyOrders(token)])
      .then(([subs, ords]) => {
        if (!cancelled) {
          setUserSubscriptions(subs as MemberSubscription[]);
          setUserOrders(ords as OrderItem[]);
        }
      })
      .catch((err: Error) => {
        console.warn('[MemberDashboard] Failed to load data from API:', err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Referral stats are non-critical — load independently so a failure
    // never blocks the vault/orders dashboard.
    ordersApi
      .getMyStats(token)
      .then((data) => {
        if (!cancelled) setReferral(data as ReferralStats);
      })
      .catch((err: Error) => console.warn('[MemberDashboard] Referral stats unavailable:', err.message));

    return () => {
      cancelled = true;
    };
  }, [token]);

  const activeCount = userSubscriptions.filter((s) => s.status === 'active' || s.status === 'expiring_soon').length;
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
              <span>{user?.tier || 'Standard'} tier • 5% off every order</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
              Welcome back, {user?.name || 'Developer'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              You have {activeCount} active AgentLab accounts with automatic 24/7 1-for-1 warranty coverage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/lookup"
              className="px-4 py-2.5 rounded-xl bg-status-error/10 hover:bg-status-error/20 border border-status-error/30 text-status-error text-xs font-bold transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Auto Replacement Bot</span>
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary-blue/25 transition-all flex items-center gap-2"
            >
              <span>Buy more accounts</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Active accounts</span>
            <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-text-primary">{activeCount}</div>
          <span className="text-[11px] text-status-success font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Running normally</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Expiring soon</span>
            <div className="w-8 h-8 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-status-warning">{expiringCount}</div>
          <span className="text-[11px] text-text-muted mt-1 block">
            {expiringSub ? `${expiringSub.productName} (${expiringSub.daysRemaining} days left)` : 'No accounts expiring soon'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Total spent</span>
            <div className="w-8 h-8 rounded-lg bg-primary-blue/10 text-primary-blue flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-text-primary">
            {formatPrice(totalSpentVND, totalSpentUSD)}
          </div>
          <span className="text-[11px] text-accent-cyan font-medium mt-1 block">
            Earned {points} reward points
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase">Available wallet balance</span>
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-accent-cyan">
            {formatPrice(user?.balanceVND || 0, user?.balanceUSD || 0)}
          </div>
          <span className="text-[11px] text-status-success font-medium mt-1 block">
            Ready for instant renewal
          </span>
        </div>
      </div>

      {/* Active Subscriptions Vault section */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary">Your AI accounts</h2>
            <p className="text-xs text-text-secondary">Secure access details and subscription periods.</p>
          </div>
          <Link
            to="/member/subscriptions"
            className="text-xs font-semibold text-primary-blue hover:text-accent-cyan flex items-center gap-1 transition-colors"
          >
            <span>View all details</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 bg-canvas rounded-xl border border-border-subtle">
            <Loader2 className="w-5 h-5 animate-spin text-primary-blue inline mr-2" />
            <span className="text-xs text-text-muted">Loading account vault…</span>
          </div>
        ) : userSubscriptions.length > 0 ? (
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
                        Expires in {sub.daysRemaining} days
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success text-[10px] font-bold font-mono">
                        Active • {sub.daysRemaining} days
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
                            title="Show/hide password"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(sub.accountPassword!, `pass-${sub.id}`)}
                            className="text-text-muted hover:text-text-primary p-1"
                            title="Copy password"
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
                      Renew now
                    </Link>
                    <Link
                      to="/lookup"
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
                      title="Report issue / Warranty"
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
            <p className="text-xs text-text-muted">You don't have any AI accounts yet. Explore the store now!</p>
            <Link to="/" className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary-blue text-white text-xs font-bold hover:bg-primary-hover transition-colors">Buy now</Link>
          </div>
        )}
      </div>

      {/* Referral Program Panel (#InviteToPay) */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Gift className="w-4 h-4 text-accent-cyan" />
              Invite & Earn Program
            </h2>
            <p className="text-xs text-text-secondary">
              For each friend who makes a valid purchase (FAB) — you get 1 free month of that account.
            </p>
          </div>
          <Link
            to="/#referral-event"
            className="text-xs font-semibold text-primary-blue hover:text-accent-cyan flex items-center gap-1 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Get invite link</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {referral && referral.codes.length > 0 ? (
          <div className="space-y-4">
            {/* Invite code + shareable link */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-canvas border border-border-subtle">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase text-text-muted block mb-1">Your invite code</span>
                <div className="font-mono text-lg font-extrabold text-accent-cyan truncate">
                  {referral.codes[0]}
                </div>
                <span className="text-[11px] text-text-muted font-mono block mt-1 truncate">
                  {`${window.location.origin}/r/${referral.codes[0]}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(`${window.location.origin}/r/${referral.codes[0]}`, 'invite-link')
                }
                className="px-4 py-2 rounded-lg bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
              >
                {copiedId === 'invite-link' ? (
                  <><Check className="w-4 h-4" /> Link copied</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy invite link</>
                )}
              </button>
            </div>

            {/* Referral KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <span className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Link clicks</span>
                <div className="font-mono text-xl font-extrabold text-text-primary">{referral.totalClicks}</div>
              </div>
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <span className="text-[10px] font-semibold uppercase text-text-muted block mb-1">FAB conversions</span>
                <div className="font-mono text-xl font-extrabold text-text-primary">
                  {referral.conversions.filter((c) => c.status !== 'rejected').length}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <span className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Accounts earned</span>
                <div className="font-mono text-xl font-extrabold text-status-success">
                  {referral.totalRewards}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <span className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Pending rewards</span>
                <div className="font-mono text-xl font-extrabold text-status-warning">{referral.pendingRewards}</div>
              </div>
            </div>

            {/* Conversion history */}
            {referral.conversions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Your order</th>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Reward</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {referral.conversions.slice(0, 5).map((c) => (
                      <tr key={c.order_id}>
                        <td className="py-2.5 px-4 text-accent-cyan font-bold">{c.order_id}</td>
                        <td className="py-2.5 px-4 font-sans text-text-primary">{c.product_name || c.brand || '—'}</td>
                        <td className="py-2.5 px-4 text-text-muted">{new Date(c.created_at).toLocaleDateString('en-US')}</td>
                        <td className="py-2.5 px-4 font-bold text-text-primary">
                          {c.reward_type === 'subscription_1month' ? (
                            <span className="text-accent-cyan">1 month of {c.product_name || c.brand || 'account'}</span>
                          ) : (
                            formatPrice(Number(c.amount_vnd), Number(c.amount_vnd) / 25000)
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'granted'
                                ? 'bg-status-success/15 text-status-success'
                                : c.status === 'pending'
                                  ? 'bg-status-warning/15 text-status-warning'
                                  : 'bg-text-muted/15 text-text-muted'
                            }`}
                          >
                            {c.status === 'granted' ? 'Account received' : c.status === 'pending' ? 'Awaiting FAB verification' : 'Rejected'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-canvas rounded-xl border border-border-subtle">
            <p className="text-xs text-text-muted mb-3">
              You don't have an invite code yet. Create your first invite link to start earning free accounts!
            </p>
            <Link
              to="/#referral-event"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-blue text-white text-xs font-bold hover:bg-primary-hover transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Invite friends now
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders table */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary">Recent orders</h2>
            <p className="text-xs text-text-secondary">Transaction history and electronic invoices.</p>
          </div>
          <Link
            to="/member/orders"
            className="text-xs font-semibold text-primary-blue hover:text-accent-cyan flex items-center gap-1 transition-colors"
          >
            <span>All orders</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-blue inline mr-2" />
                    <span className="text-xs text-text-muted">Loading data from the server…</span>
                  </td>
                </tr>
              ) : userOrders.length > 0 ? (
                userOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-accent-cyan">{ord.orderId}</td>
                    <td className="py-3 px-4 font-sans font-medium text-text-primary">
                      {ord.productName} ({ord.planDurationMonths} months)
                    </td>
                    <td className="py-3 px-4 text-text-muted">{new Date(ord.createdAt).toLocaleString('en-US')}</td>
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {formatPrice(ord.totalAmount, ord.totalUSD ?? ord.totalAmount / 25000)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'dispatched' || ord.status === 'paid'
                            ? 'bg-status-success/15 text-status-success'
                            : ord.status === 'pending'
                              ? 'bg-status-warning/15 text-status-warning'
                              : 'bg-text-muted/15 text-text-muted'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>
                          {ord.status === 'dispatched'
                            ? 'Delivered'
                            : ord.status === 'paid'
                              ? 'Paid'
                              : ord.status === 'pending'
                                ? 'Pending'
                                : ord.status}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/order/success/${ord.orderId}`}
                        className="inline-flex items-center gap-1 text-primary-blue hover:text-accent-cyan font-semibold text-xs"
                      >
                        <span>View Vault</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-text-muted">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
