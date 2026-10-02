import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Gift, X, Copy, Check, Sparkles, Volume2, VolumeX, TimerReset } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { API_BASE_URL } from '@/services/api';

const SEGMENTS = [10, 20, 30, 40, 50, 60, 70, 80, 90]; // percent per slice
const SLICE_ANGLE = 360 / SEGMENTS.length;
const COLORS = ['#7c3aed', '#0ea5e9', '#22c55e', '#3b82f6', '#14b8a6', '#8b5cf6', '#0d9488', '#6366f1', '#f59e0b'];
const GOLD = '#f59e0b';
const SPIN_MS = 5200;

export const LUCKY_STORAGE_KEY = 'agentlab_lucky_code';
export const WHEEL_SHOWN_KEY = 'agentlab_wheel_seen';
export const WHEEL_DECLINED_KEY = 'agentlab_wheel_declined_at';
const WHEEL_SOUND_KEY = 'agentlab_wheel_sound';
const RESHOW_AFTER_MS = 24 * 60 * 60 * 1000; // 'Maybe later' cools down for a day

interface StoredPrize {
  code: string;
  discountPercent: number;
  wonAt: string;
  expiresAt?: string | null;
}

export function getStoredPrize(): StoredPrize | null {
  try {
    const raw = localStorage.getItem(LUCKY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPrize) : null;
  } catch {
    return null;
  }
}

export function clearStoredPrize() {
  localStorage.removeItem(LUCKY_STORAGE_KEY);
}

export function isPrizeExpired(prize: StoredPrize | null): boolean {
  return Boolean(prize?.expiresAt && new Date(prize.expiresAt).getTime() <= Date.now());
}

function getVisitorId(): string {
  let id = localStorage.getItem('agentlab_visitor_id');
  if (!id) {
    id = `v_${crypto.randomUUID()}`;
    localStorage.setItem('agentlab_visitor_id', id);
  }
  return id;
}

/** Casino light bulbs around the wheel rim — blink fast while spinning. */
const RimBulbs: React.FC<{ spinning: boolean }> = ({ spinning }) => {
  const bulbs = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ angle: i * (360 / 16), delay: (i % 4) * 0.15 })),
    []
  );
  return (
    <>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-yellow-200"
          style={{
            transform: `rotate(${b.angle}deg) translateY(calc(-50% - 0px)) translateY(-146px)`,
            marginLeft: -3,
            marginTop: -3,
            animation: `wheelBlink ${spinning ? 0.35 : 1.1}s linear ${b.delay}s infinite`,
            boxShadow: '0 0 6px 1px rgba(253, 224, 71, 0.9)',
          }}
        />
      ))}
    </>
  );
};

const CONFETTI_COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#06b6d4', '#eab308', '#ec4899'];

const ConfettiBurst: React.FC = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 1.8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: 5 + Math.random() * 6,
        height: 8 + Math.random() * 8,
        drift: Math.random() * 120 - 60,
        round: Math.random() > 0.6,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.round ? p.width : p.height,
              background: p.color,
              borderRadius: p.round ? '50%' : 2,
              animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export const LuckyWheelModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [segments, setSegments] = useState<number[]>(SEGMENTS);
  const [ttlMinutes, setTtlMinutes] = useState(15);
  const [totalIssued, setTotalIssued] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<{ code: string; discountPercent: number; expiresAt: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(WHEEL_SOUND_KEY) !== '0');
  const rotationRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickTimersRef = useRef<number[]>([]);
  const maxPercent = useMemo(() => Math.max(...segments), [segments]);
  const jackpotIdx = segments.indexOf(maxPercent);

  const { label: timeLabel, expired, urgent } = useCountdown(prize?.expiresAt);

  useEffect(() => {
    fetch(`${API_BASE_URL}/wheel/config`)
      .then((r) => r.json())
      .then((b) => {
        if (b?.data?.segments?.length) {
          setSegments(b.data.segments.map((s: any) => s.percent));
          setTtlMinutes(Number(b.data.couponTtlMinutes) || 15);
        } else if (b?.data && b.data.active === false) {
          onClose();
        }
      })
      .catch(() => {});
    fetch(`${API_BASE_URL}/wheel/stats`)
      .then((r) => r.json())
      .then((b) => setTotalIssued(Number(b?.data?.totalIssued) || null))
      .catch(() => {});
    return () => {
      tickTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, [onClose]);

  const gradient = segments
    .map((p, i) => {
      const c = p === maxPercent ? GOLD : COLORS[i % COLORS.length];
      return `${c} ${i * SLICE_ANGLE}deg ${(i + 1) * SLICE_ANGLE}deg`;
    })
    .join(', ');

  // --- sound (created inside the spin click = allowed by autoplay policies) ---
  const ensureAudio = useCallback(() => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      audioCtxRef.current.resume();
    } catch {
      /* audio is a bonus, never a blocker */
    }
  }, [soundOn]);

  const playTick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !soundOn) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 1500 + Math.random() * 400;
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.06);
  }, [soundOn]);

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !soundOn) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.5);
    });
  }, [soundOn]);

  /** Tick per slice boundary crossed, decelerating like the CSS bezier. */
  const scheduleTicks = useCallback(
    (travel: number) => {
      const count = Math.floor(travel / SLICE_ANGLE);
      for (let k = 1; k <= count; k++) {
        const p = (k * SLICE_ANGLE) / travel;
        const x = 1 - Math.pow(1 - p, 1 / 4); // easeOutQuart inverse ≈ the CSS bezier
        tickTimersRef.current.push(window.setTimeout(playTick, x * SPIN_MS));
      }
    },
    [playTick]
  );

  const spin = async () => {
    if (isSpinning) return;
    ensureAudio();
    setIsSpinning(true);
    setConfirmExit(false);
    setLoadError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/wheel/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      const body = await res.json();
      if (!res.ok || !body?.data?.available || !body.data.code) {
        throw new Error(body?.message || 'Wheel unavailable');
      }

      const percent = body.data.discountPercent as number;
      const expiresAt = (body.data.expiresAt as string | undefined) || null;
      const idx = Math.max(0, segments.indexOf(percent));
      // Land inside the winning slice (random offset keeps re-spins organic),
      // always travelling forward so the animation never rewinds.
      const frac = 0.25 + Math.random() * 0.5;
      const desiredMod = (360 - (idx * SLICE_ANGLE + SLICE_ANGLE * frac)) % 360;
      const currentMod = ((rotationRef.current % 360) + 360) % 360;
      let delta = desiredMod - currentMod;
      if (delta < 0) delta += 360;
      const next = rotationRef.current + 360 * 5 + delta;
      rotationRef.current = next;
      setRotation(next);
      scheduleTicks(360 * 5 + delta);

      window.setTimeout(() => {
        const stored: StoredPrize = {
          code: body.data.code,
          discountPercent: percent,
          wonAt: new Date().toISOString(),
          expiresAt,
        };
        localStorage.setItem(LUCKY_STORAGE_KEY, JSON.stringify(stored));
        localStorage.setItem(WHEEL_SHOWN_KEY, '1');
        setPrize({ code: body.data.code, discountPercent: percent, expiresAt });
        setIsSpinning(false);
        playChime();
      }, SPIN_MS + 120);
    } catch {
      setIsSpinning(false);
      setLoadError(true);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const requestClose = () => {
    if (prize || isSpinning) {
      onClose();
      return;
    }
    // Intercept the escape: one beat of loss aversion before letting go.
    setConfirmExit(true);
  };

  const declineForToday = () => {
    localStorage.setItem(WHEEL_SHOWN_KEY, '1');
    localStorage.setItem(WHEEL_DECLINED_KEY, String(Date.now()));
    onClose();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(WHEEL_SOUND_KEY, next ? '1' : '0');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translate3d(0, -24px, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--drift, 0px), 115%, 0) rotate(760deg); opacity: 0; }
        }
        @keyframes wheelBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes pointerWobble {
          0%, 100% { transform: translateX(-50%) rotate(-4deg); }
          50% { transform: translateX(-50%) rotate(4deg); }
        }
        @keyframes hubPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.55); }
          70% { box-shadow: 0 0 0 14px rgba(245, 158, 11, 0); }
        }
        @keyframes prizePop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="relative w-[min(94vw,460px)] rounded-3xl bg-surface border border-border-subtle shadow-2xl p-6 text-center animate-scaleUp overflow-hidden">
        {prize && <ConfettiBurst />}

        <button
          onClick={toggleSound}
          className="absolute top-3 left-3 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas cursor-pointer z-30"
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        {!confirmExit && (
          <button
            onClick={requestClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas cursor-pointer z-30"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ---------- EXIT-INTERRUPT: the last-chance layer ---------- */}
        {confirmExit && !prize ? (
          <div className="py-6 z-30 relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-status-warning/15 flex items-center justify-center mb-3 text-3xl">⏳</div>
            <h2 className="text-xl font-extrabold text-text-primary">Wait! Don’t miss out…</h2>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Your <span className="font-bold text-status-error">one free spin</span> is still waiting.
              Leave now and you lose your shot at up to{' '}
              <span className="font-extrabold text-status-error">{maxPercent}%</span> off your first order.
            </p>
            <p className="text-[11px] text-text-muted mt-2">
              It only takes {ttlMinutes} minutes to spin and check out at the discounted price.
            </p>
            <button
              onClick={spin}
              className="mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-extrabold shadow-lg shadow-amber-500/40 cursor-pointer transition-all animate-pulse"
            >
              🎡 SPIN NOW — IT COSTS NOTHING
            </button>
            <button
              onClick={declineForToday}
              className="mt-2.5 w-full py-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-secondary hover:bg-canvas cursor-pointer transition-colors"
            >
              Skip anyway (the code disappears)
            </button>
          </div>
        ) : !prize ? (
          /* ---------- PRE-SPIN: appetite + expectation setting ---------- */
          <>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent-cyan">An offer just for you</p>
            </div>
            <h2 className="text-xl font-extrabold text-text-primary">Lucky Wheel 🎡</h2>
            {totalIssued !== null && totalIssued > 0 && (
              <p className="text-[11px] font-semibold text-status-success mt-1">
                🔥 {totalIssued.toLocaleString('en-US')} lucky codes already claimed — yours is waiting!
              </p>
            )}
            <div className="mt-2 mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-warning/10 border border-status-warning/40">
              <TimerReset className="w-3.5 h-3.5 text-status-warning" />
              <span className="text-[11px] font-bold text-status-warning">
                Your code only lasts {ttlMinutes} minutes — when it’s gone, it’s gone forever!
              </span>
            </div>

            {/* Wheel */}
            <div className="relative mx-auto w-[300px] h-[300px] mb-5">
              <RimBulbs spinning={isSpinning} />
              {/* Pointer */}
              <div
                className="absolute left-1/2 -top-2 z-20 w-0 h-0 border-l-[13px] border-r-[13px] border-t-[26px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg"
                style={isSpinning ? { animation: 'pointerWobble 0.18s ease-in-out infinite', left: '50%' } : { left: '50%', transform: 'translateX(-50%)' }}
              />
              <div
                className="w-full h-full rounded-full shadow-2xl"
                style={{
                  background: '#fbbf24',
                  padding: 10,
                  boxShadow: isSpinning ? '0 0 40px rgba(245, 158, 11, 0.55)' : '0 12px 30px rgba(0,0,0,0.35)',
                }}
              >
                <div
                  className="w-full h-full rounded-full border-[5px] border-white/90"
                  style={{
                    background: `conic-gradient(${gradient})`,
                    transform: `rotate(${rotation}deg)`,
                    transition: `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                  }}
                >
                  {segments.map((p, i) => (
                    <div
                      key={`${p}-${i}`}
                      className="absolute inset-0 flex items-start justify-center font-extrabold text-white"
                      style={{ transform: `rotate(${i * SLICE_ANGLE + SLICE_ANGLE / 2}deg)`, pointerEvents: 'none' }}
                    >
                      <span className="mt-6 text-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                        {i === jackpotIdx && <span className="mr-0.5">👑</span>}
                        {p}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Center hub = the spin button */}
              <button
                onClick={spin}
                disabled={isSpinning}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] rounded-full bg-gradient-to-b from-amber-400 to-orange-500 border-4 border-white shadow-xl text-white font-black text-sm tracking-wide hover:scale-105 active:scale-95 disabled:cursor-wait transition-transform cursor-pointer z-10"
                style={{ animation: isSpinning ? 'none' : 'hubPulse 1.8s infinite' }}
                aria-label="Spin the wheel"
              >
                {isSpinning ? '…' : 'QUAY'}
              </button>
            </div>

            {loadError ? (
              <p className="text-xs font-semibold text-status-error mb-3">Can’t reach the server — hit SPIN to try again.</p>
            ) : (
              <p className="text-xs text-text-secondary mb-3 h-4">
                {isSpinning ? (
                  <span className="font-bold text-primary-blue">Mixing your prize… hold your breath!</span>
                ) : (
                  <span>Only <b>1 spin</b> per browser — whatever you win, use it on the spot!</span>
                )}
              </p>
            )}

            <button
              onClick={spin}
              disabled={isSpinning}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-extrabold shadow-lg shadow-amber-500/40 disabled:opacity-70 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {isSpinning ? 'SPINNING…' : 'SPIN NOW — FREE'}
            </button>
            <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
              🎟️ Code applies to 1 order and self-deletes after successful payment. No spin = no code.
            </p>
          </>
        ) : (
          /* ---------- WON: euphoria → countdown urgency → CTA ---------- */
          <div className="py-2 relative z-30">
            <h2 className="text-xl font-extrabold text-text-primary">🎉 Congratulations — you won!</h2>
            <p className="text-sm text-text-secondary mt-1">
              <span className="font-extrabold text-status-error">{prize.discountPercent}%</span> off your order
            </p>
            <div
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 my-2"
              style={{ animation: 'prizePop 0.6s ease-out' }}
            >
              -{prize.discountPercent}%
            </div>

            {expired ? (
              <div className="mt-2 p-4 rounded-xl bg-status-error/10 border border-status-error/40">
                <p className="text-sm font-bold text-status-error">⏰ Oops — the clock hit zero and this code has expired!</p>
                <p className="text-[11px] text-text-secondary mt-1">But you can spin a fresh one right now.</p>
                <button
                  onClick={() => {
                    setPrize(null);
                    setRotation(0);
                    rotationRef.current = 0;
                  }}
                  className="mt-3 w-full py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold cursor-pointer"
                >
                  🎡 Spin again
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => copyCode(prize.code)}
                  className="mt-1 w-full py-3 rounded-xl bg-canvas border-2 border-dashed border-amber-500/60 flex items-center justify-center gap-2 font-mono font-extrabold text-amber-600 text-lg cursor-pointer hover:bg-amber-500/5 transition-colors"
                >
                  {prize.code}
                  {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <p className="text-[11px] text-text-muted mt-1.5">{copied ? '✅ Copied — paste it at checkout!' : 'Click to copy — auto-applied at checkout'}</p>

                {/* The burning countdown */}
                <div className={`mt-3 p-3 rounded-xl border ${urgent ? 'bg-status-error/10 border-status-error/50 animate-pulse' : 'bg-status-warning/10 border-status-warning/40'}`}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">⏰ CODE EXPIRES IN</p>
                  <p className={`text-3xl font-black font-mono tabular-nums ${urgent ? 'text-status-error' : 'text-status-warning'}`}>
                    {timeLabel}
                  </p>
                  <p className="text-[11px] font-semibold text-text-secondary mt-1">
                    At 0:00 the code is <span className="text-status-error font-bold">gone forever</span>. Pay now to lock in this price!
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('agentlab:lucky-won'));
                  }}
                  className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-extrabold shadow-lg shadow-emerald-500/40 cursor-pointer transition-all animate-pulse"
                >
                  ⚡ BUY NOW WITH YOUR DISCOUNT →
                </button>
                <p className="text-[10px] text-text-muted mt-2.5">
                  🔒 Exclusive to this browser · 1 order only · paid via PayPal
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Fixed top-right badge: the won coupon with a live countdown while it lives. */
export const LuckyBadge: React.FC = () => {
  const [prize, setPrize] = useState<StoredPrize | null>(getStoredPrize());
  const [copied, setCopied] = useState(false);
  const { label, expired, urgent } = useCountdown(prize?.expiresAt);

  useEffect(() => {
    const onWon = () => setPrize(getStoredPrize());
    const onCleared = () => setPrize(getStoredPrize());
    window.addEventListener('agentlab:lucky-won', onWon);
    window.addEventListener('agentlab:lucky-used', onCleared);
    return () => {
      window.removeEventListener('agentlab:lucky-won', onWon);
      window.removeEventListener('agentlab:lucky-used', onCleared);
    };
  }, []);

  if (!prize) return null;

  if (expired) {
    // The prize died — turn the badge into a re-engagement hook.
    return (
      <div className="fixed top-16 right-3 z-40 animate-fadeIn">
        <button
          onClick={() => {
            clearStoredPrize();
            window.dispatchEvent(new CustomEvent('agentlab:lucky-expired'));
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-warning/95 hover:bg-status-warning text-white shadow-lg shadow-status-warning/40 cursor-pointer transition-all hover:scale-105"
          title="Your old code expired — click to spin a fresh one!"
        >
          <TimerReset className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-extrabold">Code expired — Spin again? 🎡</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 right-3 z-40 animate-fadeIn">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(prize.code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-white shadow-lg cursor-pointer transition-all hover:scale-105 ${
          urgent ? 'bg-status-error hover:bg-status-error shadow-status-error/50 animate-pulse' : 'bg-status-success/95 hover:bg-status-success shadow-status-success/40'
        }`}
        title={copied ? 'Copied!' : 'Click to copy your discount code'}
      >
        <Gift className="w-4 h-4 shrink-0" />
        <span className="text-[11px] font-extrabold leading-tight">
          -{prize.discountPercent}% · <span className="font-mono">{prize.code}</span>
        </span>
        {label && (
          <span
            className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md ${
              urgent ? 'bg-white text-status-error' : 'bg-black/20 text-white'
            }`}
          >
            ⏰ {label}
          </span>
        )}
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />}
      </button>
    </div>
  );
};

/** Mounts the modal for eligible guests: first visit, or 24h after a decline,
 * or the moment an old prize lapses (fresh spin offer). */
export const LuckyWheelGate: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const [show, setShow] = useState(false);
  const [nudge, setNudge] = useState(0);

  useEffect(() => {
    if (isAuthenticated) return;

    // A lapsed prize is worthless — retire it so the wheel can re-arm.
    const prize = getStoredPrize();
    if (prize && isPrizeExpired(prize)) {
      clearStoredPrize();
      localStorage.removeItem(WHEEL_SHOWN_KEY);
    }

    const declinedAt = Number(localStorage.getItem(WHEEL_DECLINED_KEY) || 0);
    const cooledDown = Date.now() - declinedAt > RESHOW_AFTER_MS;
    if (localStorage.getItem(WHEEL_SHOWN_KEY) && !cooledDown) return;
    if (prize && !isPrizeExpired(prize)) {
      localStorage.setItem(WHEEL_SHOWN_KEY, '1');
      return;
    }
    const t = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(t);
  }, [isAuthenticated, nudge]);

  useEffect(() => {
    // Fired by the expired badge / checkout — reopen with a fresh-spin offer.
    const onExpired = () => {
      setNudge((n) => n + 1);
      setShow(true);
    };
    window.addEventListener('agentlab:lucky-expired', onExpired);
    return () => window.removeEventListener('agentlab:lucky-expired', onExpired);
  }, []);

  return show ? <LuckyWheelModal onClose={() => setShow(false)} /> : null;
};
