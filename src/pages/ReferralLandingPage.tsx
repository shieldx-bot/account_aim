import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Sparkles, Loader2, UserX, ArrowRight } from 'lucide-react';
import { ordersApi } from '@/services/api';
import { trackEvent } from '@/utils/telemetry';
import { setPendingReferral, getVisitorId } from '@/utils/referral';

/**
 * ============================================================
 * Invite Landing Route — /r/:code
 * ============================================================
 * The destination of every personal invite link. Flow:
 *  1. Validate the code against POST-less GET /api/referral/validate/:code
 *  2. Record a server-side click (30-day last-click attribution)
 *  3. Persist the pending referral locally so Checkout can attach it
 *  4. Redirect the friend into the storefront (#referral-event anchor)
 * Invalid codes → friendly dead-link screen instead of raw 404.
 */

export const ReferralLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');

  useEffect(() => {
    let cancelled = false;
    const normalized = String(code || '').trim().toUpperCase();

    if (!normalized) {
      setStatus('invalid');
      return;
    }

    (async () => {
      try {
        const valid = await ordersApi.validateCode(normalized);
        if (cancelled) return;

        if (!valid) {
          setStatus('invalid');
          trackEvent('referral_landing_invalid', { code: normalized });
          return;
        }

        // Server-side click attribution (visitor fingerprint id)
        const visitorId = getVisitorId();
        await ordersApi.recordClick(normalized, visitorId).catch(() => undefined);

        // Client-side handoff for checkout attribution
        setPendingReferral(normalized);
        trackEvent('referral_landed', { code: normalized, visitor_id: visitorId });
        setStatus('valid');

        setTimeout(() => {
          navigate(`/?ref=${normalized}#referral-event`, { replace: true });
        }, 1600);
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  if (status === 'valid') {
    return <Navigate to={`/?ref=${String(code).toUpperCase()}#referral-event`} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="max-w-md w-full text-center rounded-3xl bg-surface border border-border-subtle p-10 shadow-2xl">
        {status === 'validating' ? (
          <>
            <Loader2 className="w-10 h-10 text-accent-cyan mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-text-primary mb-2">Validating invitation…</h1>
            <p className="text-sm text-text-secondary">
              We are verifying invite code <span className="font-mono text-accent-cyan">{code}</span> and
              preparing your exclusive offer.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <UserX className="w-6 h-6 text-status-error" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Invalid invite link</h1>
            <p className="text-sm text-text-secondary mb-6">
              Code <span className="font-mono">{code}</span> does not exist or has expired. Ask your friend
              to send a new link, or continue shopping at the standard price.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Explore AI account plans
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReferralLandingPage;
