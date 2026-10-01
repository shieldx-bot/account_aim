import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Gift,
  Zap,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ordersApi } from '@/services/api';
import { trackEvent } from '@/utils/telemetry';
import { setPendingReferral } from '@/utils/referral';

/**
 * ============================================================
 * "INVITE A FRIEND TO BUY — GET A PAID ACCOUNT FOR FREE" CAMPAIGN
 * Referral-to-Unlock Event Section (Frontend + Ads optimized)
 * ============================================================
 *
 * MECHANICS (viral loop):
 *  1. User receives a personalized invite link (?ref=CODE&utm_source=channel)
 *  2. They share it with friends → a friend buys & pays for a valid order (FAB = First Paid Booking)
 *  3. The system auto-unlocks + delivers a PREMIUM ACCOUNT already paid for
 *     to the inviter (provisioning type: pre_created)
 *
 * ADS / GROWTH KPIs:
 *  - CTA button CTR (>3.5%), landing → first invite send conversion (>25%)
 *  - K-factor = (invites/user) x (paid conversion/friend) — target ≥ 0.4
 *  - Entire funnel instrumented via dataLayer (GA4/Pinterest/Meta events)
 */

// Invite links resolve on our own origin so the /r/:code landing route can
// validate + attribute clicks server-side (works in dev & prod behind the same domain).
const INVITE_BASE_URL = `${window.location.origin}/r`;

export const ReferralEventSection: React.FC = () => {
  const { products, formatPrice } = useApp();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [issuing, setIssuing] = useState(true);

  // Real referral code issued by POST /api/referral/code (idempotent per user/session).
  // The backend re-validates every code at click & order time, so codes are always DB-backed.
  const [refCode, setRefCode] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { code } = await ordersApi.issueCode(undefined, token || undefined);
        if (cancelled) return;
        sessionStorage.setItem('agentlab_ref_code', code);
        setRefCode(code);
        setPendingReferral(code); // own-session attribution harmless; overwritten by last-click
      } catch {
        if (cancelled) return;
        // API unreachable → leave link empty; Copy/Share buttons stay disabled
        // rather than minting unverifiable codes.
      } finally {
        if (!cancelled) setIssuing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const inviteLink = refCode
    ? `${INVITE_BASE_URL}/${refCode}?utm_source=referral&utm_medium=event&utm_campaign=invite2pay`
    : '';

  const prizeProduct = React.useMemo(
    () => [...products].sort((a, b) => b.currentPriceVND - a.currentPriceVND)[0],
    [products],
  );

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      trackEvent('referral_link_copied', { ref_code: refCode });
    } catch {
      // Fallback for non-secure contexts
      trackEvent('referral_copy_failed', { ref_code: refCode });
    }
  };

  const handleShare = (channel: 'facebook' | 'zalo' | 'messenger') => {
    if (!inviteLink) return;
    const text = encodeURIComponent(
      'I\'m using premium AI accounts without paying a dime 💸 When you buy a Claude/Cursor plan, the system instantly gifts me an account that\'s already paid for — we both win! Grab the deal here:',
    );
    const url = encodeURIComponent(inviteLink);
    const shareUrls: Record<typeof channel, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      zalo: `https://social-plugins.line.me/lineit/share?url=${url}`,
      messenger: `https://www.messenger.com/t/${url}`,
    };
    window.open(shareUrls[channel], '_blank', 'noopener,noreferrer,width=640,height=520');
    trackEvent('referral_share_click', { channel, ref_code: refCode });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      trackEvent('referral_signup_invalid_email', { ref_code: refCode });
      return;
    }
    trackEvent('generate_referral_link', {
      ref_code: refCode,
      email_domain: emailInput.split('@')[1],
      campaign: 'invite2pay',
    });
    // Persist pending attribution so checkout can attach it to the order payload.
    setPendingReferral(refCode, emailInput);
    navigate('/checkout', { state: { referralCode: refCode, referralEmail: emailInput } });
  };

  const steps = [
    {
      icon: <Users className="w-6 h-6 text-accent-cyan" />,
      title: 'Step 1 — Send your invite',
      desc: 'Share your personalized invite link with friends via Facebook, Zalo, Messenger, or one-tap copy.',
      kpiLabel: 'Target: ≥ 3 invites / user',
    },
    {
      icon: <Zap className="w-6 h-6 text-accent-cyan" />,
      title: 'Step 2 — Your friend pays',
      desc: 'Your friend purchases any AI account plan (Claude Pro, Cursor, ChatGPT Plus…) and completes a valid order.',
      kpiLabel: 'FAB validation: 3-layer anti-fraud',
    },
    {
      icon: <Gift className="w-6 h-6 text-accent-cyan" />,
      title: 'Step 3 — Get your account instantly',
      desc: 'The system automatically unlocks and delivers a PAID-FOR PREMIUM ACCOUNT to your gift vault within ≤ 30 seconds.',
      kpiLabel: 'Delivery SLA: instant provisioning',
    },
  ];

  return (
    <section id="referral-event" className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface via-canvas to-primary-blue/15 border border-border-subtle shadow-2xl">
        {/* Ambient glow accents */}
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-accent-cyan/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] bg-primary-blue/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 p-8 sm:p-12 lg:p-14">
          {/* Header */}
          <div data-section-header className="max-w-3xl space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-blue/15 border border-primary-blue/40 text-accent-cyan text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LIMITED-TIME EVENT · #InviteToPay · K-Factor Loop</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Invite a friend to buy an AI account —{' '}
              <span className="bg-gradient-to-r from-primary-blue to-accent-cyan bg-clip-text text-transparent">
                Get a paid-for account instantly
              </span>
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Every time one of your friends completes an order, the system automatically{' '}
              <strong className="text-text-primary">unlocks your gift</strong>: a premium account{' '}
              <strong className="text-text-primary">already paid for</strong>, just for you. No reduced plans,
              no manual approval waits — instant delivery to your own email.
            </p>
          </div>

          {/* 3-step funnel cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
            {steps.map((s, i) => (
              <div
                key={i}
                className="group relative rounded-2xl bg-surface/80 backdrop-blur border border-border-subtle hover:border-primary-blue/50 p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-blue/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-blue/10 border border-primary-blue/30 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="font-mono text-3xl font-black text-primary-blue/20 group-hover:text-primary-blue/40 transition-colors">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{s.desc}</p>
                <span className="inline-block font-mono text-[10px] uppercase tracking-wider text-accent-cyan/80 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full px-2.5 py-1">
                  {s.kpiLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Prize showcase + Invite console */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Prize card */}
            <div className="lg:col-span-2 rounded-2xl bg-gradient-to-b from-primary-blue/20 to-surface border border-primary-blue/40 p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 text-accent-cyan text-xs font-mono font-semibold mb-3">
                  <Gift className="w-4 h-4" />
                  <span>GIFT UNLOCKED PER VALID INVITE</span>
                </div>
                {prizeProduct ? (
                  <>
                    <h4 className="text-xl font-extrabold text-text-primary leading-snug">
                      {prizeProduct.name}
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">{prizeProduct.platformSubtext}</p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-accent-cyan">
                        {formatPrice(prizeProduct.currentPriceVND, prizeProduct.currentPriceUSD)}
                      </span>
                      <span className="text-xs text-text-secondary line-through">
                        {formatPrice(prizeProduct.originalPriceVND, prizeProduct.originalPriceUSD)}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {prizeProduct.quotaFeatures.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-text-secondary">
                    The highest-priced plan in the catalog will be picked as the unlock reward.
                  </p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-primary-blue/25 font-mono text-[11px] text-text-secondary">
                Prize value covered 100% by AgentLab · Anti-abuse: 1 reward per valid FAB
              </div>
            </div>

            {/* Invite console */}
            <div className="lg:col-span-3 rounded-2xl bg-surface border border-border-subtle p-6 sm:p-8 shadow-lg">
              <h3 className="text-lg font-bold text-text-primary mb-1">Your personalized invite link</h3>
              <p className="text-xs text-text-secondary mb-5">
                Your ID is <span className="font-mono text-accent-cyan">{refCode}</span> — every order from this link
                is automatically attributed to you (30-day attribution, last-click).
              </p>

              {/* Link input + copy */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 flex items-center rounded-xl bg-canvas border border-border-subtle focus-within:border-primary-blue/60 transition-colors overflow-hidden">
                  <span className="pl-4 pr-2 text-text-secondary font-mono text-xs select-none">#</span>
                  <input
                    readOnly
                    disabled={!inviteLink}
                    value={issuing || !inviteLink ? 'Generating your personalized invite link…' : inviteLink}
                    onFocus={(e) => e.target.select()}
                    aria-label="Personal invite link"
                    className="w-full bg-transparent px-2 py-3.5 text-sm font-mono text-text-primary outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    disabled={!inviteLink}
                    className={`m-1.5 mr-1.5 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      copied
                        ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                        : 'bg-primary-blue text-white hover:bg-primary-hover shadow-button'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy link'}</span>
                  </button>
                </div>
              </div>

              {/* Social quick-share row */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => handleShare('facebook')}
                  className="px-4 py-2 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/40 text-[#1877F2] text-xs font-semibold hover:bg-[#1877F2]/20 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Facebook
                </button>
                <button
                  onClick={() => handleShare('zalo')}
                  className="px-4 py-2 rounded-lg bg-[#0068FF]/10 border border-[#0068FF]/40 text-[#0068FF] text-xs font-semibold hover:bg-[#0068FF]/20 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Zalo
                </button>
                <button
                  onClick={() => handleShare('messenger')}
                  className="px-4 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/40 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/20 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Messenger
                </button>
              </div>

              {/* Email capture → funnel into checkout with attribution */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <label htmlFor="referral-email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Or enter your email to lock in your reward & head straight to Checkout
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="referral-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ban@email.com"
                    className="flex-1 rounded-xl bg-canvas border border-border-subtle focus:border-primary-blue/70 focus:ring-2 focus:ring-primary-blue/20 outline-none px-4 py-3.5 text-sm text-text-primary placeholder:text-text-secondary/60 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-sm font-bold shadow-button hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Claim my free account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-text-secondary/80 leading-relaxed">
                  🔒 We only use your email to deliver your gift & prevent fraud (device fingerprint + velocity check).
                  Your friend still gets their own exclusive discount when buying via your link — a win-win loop.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReferralEventSection;
