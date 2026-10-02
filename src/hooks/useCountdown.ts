import { useEffect, useState } from 'react';

/**
 * Live countdown against an ISO expiry timestamp.
 * Returns null seconds for "no timer" and flips `expired` at zero so callers
 * can react (hide the prize, show a re-spin CTA, …).
 */
export function useCountdown(expiresAt?: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!expiresAt) {
    return { secondsLeft: null as number | null, expired: false, label: null as string | null, urgent: false };
  }

  const ms = new Date(expiresAt).getTime() - now;
  const secondsLeft = Math.max(0, Math.floor(ms / 1000));
  const expired = ms <= 0;
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const label =
    h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return { secondsLeft, expired, label, urgent: secondsLeft > 0 && secondsLeft <= 5 * 60 };
}
