import React, { useEffect, useState } from 'react';
import { Gift, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/services/api';

interface Segment {
  percent: number;
  weight: number;
}

/** Admin editor for the Lucky Wheel prize table (weights = relative odds)
 * and the prize-code lifetime that drives the customer-facing countdown. */
export const LuckyWheelAdminCard: React.FC = () => {
  const { token } = useAuth();
  const [active, setActive] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [ttlMinutes, setTtlMinutes] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/wheel/admin/config`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((b) => {
        if (b?.data) {
          setActive(b.data.active);
          setSegments(b.data.segments);
          setTtlMinutes(Number(b.data.couponTtlMinutes) || 15);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/wheel/admin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active, segments, couponTtlMinutes: ttlMinutes }),
      });
      const body = await res.json();
      setMessage(res.ok ? '✅ Wheel configuration saved' : `❌ ${body?.message || 'Save failed'}`);
    } catch {
      setMessage('❌ Cannot reach the server');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const total = segments.reduce((t, s) => t + s.weight, 0);

  return (
    <div className="p-5 rounded-2xl bg-white border border-border-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-sans">
          <div className="w-8 h-8 rounded-lg bg-primary-blue/10 text-primary-blue flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-text-muted">Lucky Wheel</p>
            <p className="text-xs font-bold text-text-primary">Win odds per discount tier</p>
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-primary-blue" />
          Wheel enabled
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-text-muted py-3"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto pr-1">
            {segments.map((s, i) => (
              <div key={s.percent} className="flex items-center gap-2">
                <span className="w-12 font-bold text-text-primary">-{s.percent}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.weight}
                  onChange={(e) => {
                    const next = [...segments];
                    next[i] = { ...s, weight: Number(e.target.value) };
                    setSegments(next);
                  }}
                  className="flex-1 accent-primary-blue"
                />
                <span className="w-8 text-right font-mono text-text-secondary">{s.weight}</span>
                <span className="w-14 text-right font-mono text-[10px] text-text-muted">
                  {total > 0 ? `${((s.weight / total) * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 flex-1">
              <span className="text-[11px] font-semibold text-text-primary whitespace-nowrap">⏳ Code lifetime after spin (minutes):</span>
              <input
                type="number"
                min={5}
                max={10080}
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-lg bg-canvas border border-border-subtle text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary-blue"
              />
            </label>
            <span className="text-[10px] text-text-muted">
              {ttlMinutes < 60 ? `${ttlMinutes} min` : `${(ttlMinutes / 60).toFixed(1)} hr`} — shorter = more urgent (recommended 10–30)
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-text-muted">
              Weights are relative — {total} points total. Higher = more likely to win.
            </span>
            <button
              onClick={save}
              disabled={saving || segments.length === 0}
              className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
          {message && <p className="mt-2 text-[11px] font-semibold text-text-primary">{message}</p>}
        </>
      )}
    </div>
  );
};
