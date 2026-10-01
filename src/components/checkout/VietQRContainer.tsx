import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import type { VietQRData } from '@/types';
import { trackEvent } from '@/utils/telemetry';

/**
 * AIPRO-108 — Dynamic VietQR Widget + quick-copy buttons.
 * Spec DoD:
 *  - QR 220x220px on white background, rounded 8px.
 *  - Blue radar-pulse animation around the QR frame (banking webhook listener).
 *  - Transfer-info rows: Bank / Account / Amount / Memo with unique order code.
 *  - Copy button per row: navigator.clipboard.writeText(), exact data (amount = integer only),
 *    icon switches to ✓ "Đã sao chép" for 2s then reverts.
 *  - While loading: skeleton placeholder (img_qr_placeholder.svg).
 *  - On expiry (isExpired): blur(4px) overlay + "Làm mới mã thanh toán" button, copies disabled (AIPRO-109).
 */

interface RowDef {
  label: string;
  value: string;
  /** Value written to clipboard (defaults to `value`). Amount must be an integer string. */
  copyValue?: string;
  mono?: boolean;
}

// ── Deterministic pseudo-QR renderer (visual mock of the bank's dynamic QR) ──
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const QrGlyph: React.FC<{ seedKey: string }> = ({ seedKey }) => {
  const cells = useMemo(() => {
    const rand = mulberry32(hashString(seedKey));
    const GRID = 25;
    const finder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= GRID - 7) || (r >= GRID - 7 && c < 7);
    const out: Array<[number, number]> = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (finder(r, c)) continue;
        if (rand() > 0.52) out.push([c, r]);
      }
    }
    return out;
  }, [seedKey]);

  const GRID = 25;
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={7} height={7} rx={1.4} fill="#0B1220" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1} fill="#FFFFFF" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} fill="#0052CC" />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${GRID} ${GRID}`} className="w-full h-full" shapeRendering="crispEdges" role="img" aria-label="Mã VietQR chuyển khoản ngân hàng">
      {cells.map(([c, r], i) => (
        <rect key={i} x={c} y={r} width={1} height={1} fill="#0B1220" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={GRID - 7} y={0} />
      <Finder x={0} y={GRID - 7} />
    </svg>
  );
};

export interface VietQRContainerProps {
  data: VietQRData | null;
  loading: boolean;
  isExpired: boolean;
  onRefresh: () => void;
}

export const VietQRContainer: React.FC<VietQRContainerProps> = ({ data, loading, isExpired, onRefresh }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (revertTimer.current) clearTimeout(revertTimer.current);
  }, []);

  const handleCopy = async (key: string, value: string) => {
    if (isExpired || !value) return;
    try {
      // No stray whitespace in clipboard payload (DoD AIPRO-108).
      await navigator.clipboard.writeText(value.trim());
    } catch {
      // Fallback for non-secure contexts.
      const ta = document.createElement('textarea');
      ta.value = value.trim();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    trackEvent('vietqr_field_copied', { field: key });
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setCopiedKey(null), 2000);
  };

  const rows: RowDef[] = data
    ? [
        { label: 'Ngân hàng thụ hưởng', value: data.bankName },
        { label: 'Số tài khoản', value: data.accountNumber, mono: true },
        { label: 'Chủ tài khoản', value: data.accountHolder },
        // Amount copied as INTEGER only (e.g. 749000) — DoD AIPRO-108.
        { label: 'Số tiền chính xác', value: `${data.amount.toLocaleString('vi-VN')} ₫`, copyValue: String(Math.round(data.amount)), mono: true },
        { label: 'Nội dung chuyển khoản', value: data.transferMemo, mono: true },
      ]
    : [];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* QR FRAME: 220x220, white bg, radius 8px, radar pulse ring */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Radar pulse rings (listening-for-webhook effect) */}
          {!isExpired && !loading && (
            <>
              <span className="absolute inset-0 rounded-lg border-2 border-primary-blue/50 animate-[radarPulse_2.2s_ease-out_infinite]" aria-hidden />
              <span className="absolute inset-0 rounded-lg border-2 border-primary-blue/40 animate-[radarPulse_2.2s_ease-out_infinite_0.7s]" aria-hidden />
              <span className="absolute inset-0 rounded-lg border-2 border-primary-blue/30 animate-[radarPulse_2.2s_ease-out_infinite_1.4s]" aria-hidden />
            </>
          )}
          <div
            className="relative w-[220px] h-[220px] bg-white rounded-lg p-3 border border-border-subtle shadow-[0_0_25px_rgba(0,102,255,0.18)] overflow-hidden"
            style={isExpired ? { filter: 'blur(4px)' } : undefined}
          >
            {loading || !data ? (
              /* Skeleton placeholder while fetching QR (DoD AIPRO-108) */
              <div className="w-full h-full flex items-center justify-center bg-canvas rounded-md animate-pulse">
                <img src="/assets/images/img_qr_placeholder.svg" alt="Đang tải mã QR" className="w-24 h-24 opacity-60" />
              </div>
            ) : (
              <QrGlyph seedKey={`${data.accountNumber}|${data.transferMemo}|${data.amount}`} />
            )}
          </div>

          {/* Expired overlay: blur + refresh CTA (DoD AIPRO-109) */}
          {isExpired && (
            <div className="absolute inset-0 rounded-lg bg-canvas/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
              <p className="text-xs font-bold text-status-warning">Mã QR đã hết hiệu lực</p>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-blue hover:brightness-110 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-primary-blue/30 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                🔄 Làm mới mã thanh toán
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-text-muted flex items-center justify-center gap-1.5">
        <Loader2 className={`w-3 h-3 ${isExpired ? 'opacity-0' : 'animate-spin text-status-success'}`} />
        Hệ thống đang lắng nghe Webhook ngân hàng — tự động xác nhận sau 1.5–3 giây khi tiền về
      </p>

      {/* Transfer info rows with copy buttons */}
      <div className="space-y-2">
        {rows.map((row) => {
          const copied = copiedKey === row.label;
          return (
            <div key={row.label} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-canvas border border-border-subtle">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-text-muted block">{row.label}</span>
                <span className={`text-sm font-bold text-text-primary break-all ${row.mono ? 'font-mono' : ''}`}>
                  {row.value}
                </span>
              </div>
              <button
                type="button"
                disabled={isExpired}
                onClick={() => handleCopy(row.label, row.copyValue ?? row.value)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  copied
                    ? 'bg-status-success/15 border-status-success/50 text-status-success'
                    : 'bg-surface border-border-subtle text-text-secondary hover:border-primary-blue hover:text-primary-blue'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '✓ Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
