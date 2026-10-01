/**
 * ============================================================
 * Referral attribution store (#InviteToPay)
 * - Visitor ID: stable anonymous device fingerprint (UUID v4 in localStorage)
 * - Pending referral code: written by the /r/:code landing route OR by the
 *   ?ref= query param on any page; consumed (read + clear) by Checkout.
 * - 30-day expiry, last-click wins.
 * ============================================================
 */

const VISITOR_ID_KEY = 'agentlab_visitor_id';
const PENDING_REF_KEY = 'agentlab_pending_referral';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface PendingReferral {
  code: string;
  email?: string;
  clickedAt: number;
}

const getStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // private browsing / SSR safety
  }
};

/** Stable anonymous visitor id for click-attribution (server-side validated). */
export const getVisitorId = (): string => {
  const ls = getStorage();
  if (!ls) return crypto.randomUUID();
  let id = ls.getItem(VISITOR_ID_KEY);
  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = crypto.randomUUID().replace(/-/g, '');
    ls.setItem(VISITOR_ID_KEY, id);
  }
  return id;
};

/** Persist an incoming invite code (last-click wins, refreshes 30-day window). */
export const setPendingReferral = (code: string, email?: string): void => {
  const ls = getStorage();
  if (!ls || !code) return;
  ls.setItem(
    PENDING_REF_KEY,
    JSON.stringify({ code: code.trim().toUpperCase(), email, clickedAt: Date.now() } satisfies PendingReferral)
  );
};

/** Read pending referral without clearing (used to show banner in checkout). */
export const peekPendingReferral = (): PendingReferral | null => {
  const ls = getStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(PENDING_REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingReferral;
    if (!parsed?.code || Date.now() - parsed.clickedAt > ATTRIBUTION_TTL_MS) {
      ls.removeItem(PENDING_REF_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/** Consume the pending referral (checkout attaches it to the order payload). */
export const consumePendingReferral = (): string | null => {
  const pending = peekPendingReferral();
  if (!pending) return null;
  getStorage()?.removeItem(PENDING_REF_KEY);
  return pending.code;
};

/** Capture ?ref=CODE from any URL (home deep-links, ads UTMs, /r fallback). */
export const captureRefFromUrl = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^APX-[A-Z0-9]{4,8}$/i.test(ref.trim())) {
      setPendingReferral(ref.trim().toUpperCase());
      return ref.trim().toUpperCase();
    }
  } catch {
    /* noop */
  }
  return null;
};
