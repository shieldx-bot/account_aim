import React, { useState, useEffect, useRef } from 'react';
import { Gift, X, Copy, Check, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

const SEGMENTS = [10, 20, 30, 40, 50, 60, 70, 80, 90]; // percent per slice
const SLICE_ANGLE = 360 / SEGMENTS.length;
const COLORS = ['#1d4ed8', '#0e7490', '#7c3aed', '#b45309', '#047857', '#be123c', '#4338ca', '#0f766e', '#6d28d9'];

export const LUCKY_STORAGE_KEY = 'agentlab_lucky_code';
export const WHEEL_SHOWN_KEY = 'agentlab_wheel_seen';

interface StoredPrize {
  code: string;
  discountPercent: number;
  wonAt: string;
}

export function getStoredPrize(): StoredPrize | null {
  try {
    const raw = localStorage.getItem(LUCKY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPrize) : null;
  } catch {
    return null;
  }
}

function getVisitorId(): string {
  let id = localStorage.getItem('agentlab_visitor_id');
  if (!id) {
    id = `v_${crypto.randomUUID()}`;
    localStorage.setItem('agentlab_visitor_id', id);
  }
  return id;
}

export const LuckyWheelModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [segments, setSegments] = useState<number[]>(SEGMENTS);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<{ code: string; discountPercent: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/wheel/config`)
      .then((r) => r.json())
      .then((b) => {
        if (b?.data?.segments?.length) setSegments(b.data.segments.map((s: any) => s.percent));
      })
      .catch(() => {});
  }, []);

  const gradient = segments
    .map((p, i) => `${COLORS[i % COLORS.length]} ${i * SLICE_ANGLE}deg ${(i + 1) * SLICE_ANGLE}deg`)
    .join(', ');

  const spin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
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

      const percent = body.data.discountPercent;
      const idx = segments.indexOf(percent);
      // Land the pointer in the middle of the winning slice + 4 full turns.
      const target = 360 * 4 + (360 - (idx * SLICE_ANGLE + SLICE_ANGLE / 2));
      setRotation(target);

      setTimeout(() => {
        const stored: StoredPrize = { code: body.data.code, discountPercent: percent, wonAt: new Date().toISOString() };
        localStorage.setItem(LUCKY_STORAGE_KEY, JSON.stringify(stored));
        localStorage.setItem(WHEEL_SHOWN_KEY, '1');
        setPrize({ code: body.data.code, discountPercent: percent });
        setIsSpinning(false);
      }, 4600);
    } catch {
      setIsSpinning(false);
      onClose();
    }
  };

  const copyCode = () => {
    if (prize) {
      navigator.clipboard?.writeText(prize.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-[min(94vw,440px)] rounded-3xl bg-surface border border-border-subtle shadow-2xl p-6 text-center animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!prize ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent-cyan">First visit only</p>
            </div>
            <h2 className="text-xl font-extrabold text-text-primary">Vòng quay may mắn 🎡</h2>
            <p className="text-xs text-text-secondary mt-1 mb-4">
              Quay 1 lần duy nhất trên trình duyệt này — trúng phiếu giảm giá{' '}
              <span className="font-bold text-status-success">10% → 90%</span> cho một đơn hàng!
            </p>

            {/* Wheel */}
            <div className="relative mx-auto w-[260px] h-[260px] mb-5">
              {/* Pointer */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-status-warning drop-shadow" />
              <div
                className="w-full h-full rounded-full border-[6px] border-canvas shadow-xl"
                style={{
                  background: `conic-gradient(${gradient})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 4.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {segments.map((p, i) => (
                  <div
                    key={p}
                    className="absolute inset-0 flex items-start justify-center text-[13px] font-extrabold text-white"
                    style={{ transform: `rotate(${i * SLICE_ANGLE + SLICE_ANGLE / 2}deg)`, pointerEvents: 'none' }}
                  >
                    <span className="mt-6 drop-shadow">{p}%</span>
                  </div>
                ))}
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface border border-border-subtle shadow flex items-center justify-center text-[10px] font-extrabold text-primary-blue">
                AgentLab
              </div>
            </div>

            <button
              onClick={spin}
              disabled={isSpinning}
              className="w-full py-3 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary-blue/30 disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {isSpinning ? 'Đang quay…' : 'QUAY NGAY'}
            </button>
            <p className="text-[10px] text-text-muted mt-3">
              * Mã giảm giá áp dụng cho 1 đơn hàng duy nhất, tự xóa sau khi thanh toán thành công.
            </p>
          </>
        ) : (
          <div className="py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-status-success/15 flex items-center justify-center mb-3">
              <Gift className="w-8 h-8 text-status-success" />
            </div>
            <h2 className="text-xl font-extrabold text-text-primary">Chúc mừng! 🎉</h2>
            <p className="text-sm text-text-secondary mt-1">
              Bạn trúng phiếu giảm giá <span className="font-extrabold text-status-success">{prize.discountPercent}%</span>
            </p>

            <button
              onClick={copyCode}
              className="mt-4 w-full py-3 rounded-xl bg-canvas border-2 border-dashed border-primary-blue/50 flex items-center justify-center gap-2 font-mono font-extrabold text-primary-blue text-lg cursor-pointer hover:bg-primary-blue/5 transition-colors"
            >
              {prize.code}
              {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
            </button>
            <p className="text-[11px] text-text-muted mt-2">
              {copied ? 'Đã copy mã!' : 'Bấm để copy mã — tự áp dụng khi thanh toán'}
            </p>

            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('agentlab:lucky-won'));
              }}
              className="mt-4 w-full py-3 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-sm font-bold cursor-pointer transition-colors"
            >
              Mua sắm với giá giảm →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/** Fixed top-right badge showing the won coupon while it is still usable. */
export const LuckyBadge: React.FC = () => {
  const [prize, setPrize] = useState<StoredPrize | null>(getStoredPrize());
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="fixed top-16 right-3 z-40 animate-fadeIn">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(prize.code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="group flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl bg-status-success/95 hover:bg-status-success text-white shadow-lg shadow-status-success/40 cursor-pointer transition-all hover:scale-105"
        title={copied ? 'Đã copy!' : 'Bấm để copy mã giảm giá'}
      >
        <Gift className="w-4 h-4 shrink-0" />
        <span className="text-[11px] font-extrabold leading-tight">
          -{prize.discountPercent}% · <span className="font-mono">{prize.code}</span>
        </span>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />}
      </button>
    </div>
  );
};

/** Mounts the modal once per browser (guests only, on first visit). */
export const LuckyWheelGate: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    if (localStorage.getItem(WHEEL_SHOWN_KEY)) return;
    if (getStoredPrize()) {
      localStorage.setItem(WHEEL_SHOWN_KEY, '1');
      return;
    }
    const t = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  return show ? <LuckyWheelModal onClose={() => setShow(false)} /> : null;
};
