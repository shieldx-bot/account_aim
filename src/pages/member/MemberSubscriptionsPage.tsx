import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionsApi } from '@/services/api';
import type { MemberSubscription } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const MemberSubscriptionsPage: React.FC = () => {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Production: vault data comes from PostgreSQL subscriptions table
  useEffect(() => {
    if (!token) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    subscriptionsApi
      .getMySubscriptions(token)
      .then((data) => {
        if (!cancelled) setSubscriptions(data as MemberSubscription[]);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Unable to load the account list from the server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleAutoRenew = async (id: string, nextValue: boolean) => {
    if (!token) return;
    // Optimistic UI update, then persist to DB
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, autoRenew: nextValue } : sub)));
    try {
      await subscriptionsApi.updateAutoRenew(token, id, nextValue);
    } catch (err) {
      // Rollback on failure
      setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, autoRenew: !nextValue } : sub)));
      setError((err as Error).message || 'Unable to save the auto-renew setting.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
            AI Account &amp; Credentials Management
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            All purchased AgentLab licenses, API access keys, and renewal settings.
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary-blue/25 transition-all text-center"
        >
          + Buy more accounts
        </Link>
      </div>

      {/* Subscriptions Cards */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Loader2 className="w-6 h-6 animate-spin text-primary-blue mx-auto mb-3" />
          <p className="text-xs text-text-muted">Loading account vault from the server…</p>
        </div>
      ) : (
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
                        Method:{' '}
                        <strong className="text-text-primary">
                          {sub.provisioningType === 'invite_email' ? 'Assign to your own email' : 'Pre-provisioned account'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-text-muted block">Valid until:</span>
                      <span className="font-mono text-xs font-bold text-text-primary">
                        {new Date(sub.expiresAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        sub.status === 'expiring_soon'
                          ? 'bg-status-warning/15 text-status-warning'
                          : 'bg-status-success/15 text-status-success'
                      }`}
                    >
                      {sub.daysRemaining} days left
                    </span>
                  </div>
                </div>

                {/* Credentials & Tokens Vault Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
                  {/* Email Access */}
                  <div className="p-3 rounded-xl bg-canvas border border-border-subtle font-mono text-xs">
                    <span className="text-[10px] text-text-muted block uppercase mb-1">Login / license email</span>
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
                      <span className="text-[10px] text-text-muted block uppercase mb-1">Security password</span>
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
                      onChange={() => toggleAutoRenew(sub.id, !sub.autoRenew)}
                      className="w-4 h-4 rounded border-border-subtle bg-canvas text-primary-blue focus:ring-primary-blue/20"
                    />
                    <span className="text-text-secondary">
                      Auto-renew when the wallet balance is sufficient (extra 5% discount)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/lookup"
                      className="px-3 py-1.5 rounded-lg bg-canvas hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-status-error flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Report issue / Request replacement</span>
                    </Link>
                    <Link
                      to={`/product/${sub.productSlug}`}
                      className="px-4 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-hover text-white font-bold transition-all"
                    >
                      Renew plan
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle shadow-sm">
            <KeyRound className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-base font-bold text-text-primary mb-1">No accounts yet</h3>
            <p className="text-xs text-text-secondary mb-5">Explore the most powerful AgentLab plans to get started.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-blue/20"
            >
              Visit the Store
            </Link>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
