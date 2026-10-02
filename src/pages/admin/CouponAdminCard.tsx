import React, { useEffect, useMemo, useState } from 'react';
import { TicketPercent, RefreshCw, Loader2, Save, X, Search, CalendarClock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { couponsApi, AdminCoupon } from '@/services/api';
import { useCountdown } from '@/hooks/useCountdown';

type CouponStatus = 'live' | 'expired' | 'off' | 'used';

function statusOf(c: AdminCoupon): CouponStatus {
  if (c.usedByOrder) return 'used';
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= Date.now()) return 'expired';
  if (!c.active) return 'off';
  return 'live';
}

const STATUS_META: Record<CouponStatus, { label: string; cls: string }> = {
  live: { label: 'Active', cls: 'bg-status-success/15 text-status-success border-status-success/40' },
  expired: { label: 'Expired', cls: 'bg-status-error/10 text-status-error border-status-error/40' },
  off: { label: 'Disabled', cls: 'bg-canvas text-text-muted border-border-subtle' },
  used: { label: 'Used', cls: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30' },
};

const fmtLocal = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    : 'No expiry';

/** ISO → value for <input type="datetime-local"> (local time, minute precision). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** datetime-local value → ISO (null when cleared = never expires). */
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const PRESETS: Array<{ label: string; minutes: number | null }> = [
  { label: '+15 min', minutes: 15 },
  { label: '+1 hr', minutes: 60 },
  { label: '+24 hr', minutes: 24 * 60 },
  { label: '+7 days', minutes: 7 * 24 * 60 },
  { label: 'No expiry', minutes: null },
];

const CouponRow: React.FC<{
  coupon: AdminCoupon;
  token: string;
  onUpdated: (c: AdminCoupon) => void;
  onError: (msg: string) => void;
}> = ({ coupon: initial, token, onUpdated, onError }) => {
  const [coupon, setCoupon] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { label: timeLeft, expired } = useCountdown(coupon.expiresAt);

  useEffect(() => setCoupon(initial), [initial]);

  const status = statusOf(coupon);
  const meta = STATUS_META[status];

  const startEdit = () => {
    setEditValue(toLocalInput(coupon.expiresAt));
    setEditing(true);
  };

  const applyPreset = (minutes: number | null) => {
    if (minutes === null) {
      setEditValue('');
      return;
    }
    const d = new Date(Date.now() + minutes * 60000);
    setEditValue(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await couponsApi.adminUpdate(token, coupon.code, { expiresAt: fromLocalInput(editValue) });
      setCoupon(updated);
      onUpdated(updated);
      setEditing(false);
    } catch (err: any) {
      onError(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setSaving(true);
    try {
      const updated = await couponsApi.adminUpdate(token, coupon.code, { active: !coupon.active });
      setCoupon(updated);
      onUpdated(updated);
    } catch (err: any) {
      onError(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`p-3 rounded-xl border ${status === 'live' ? 'bg-canvas border-border-subtle' : 'bg-canvas/60 border-border-subtle opacity-80'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-extrabold text-text-primary">{coupon.code}</span>
          <span className="px-1.5 py-0.5 rounded bg-primary-blue/10 text-primary-blue text-[10px] font-bold">
            -{coupon.discountPercent}%
          </span>
          <span className="text-[10px] text-text-muted" title={coupon.source === 'wheel' ? 'Wheel prize (per visitor)' : 'Manual code'}>
            {coupon.source === 'wheel' ? '🎡 wheel' : '✋ manual'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
          <button
            onClick={startEdit}
            disabled={editing}
            className="px-2 py-1 rounded-lg bg-primary-blue/10 hover:bg-primary-blue/20 text-primary-blue text-[10px] font-bold cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <CalendarClock className="w-3 h-3" /> Edit expiry
          </button>
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-50 ${
              coupon.active ? 'bg-status-error/10 text-status-error hover:bg-status-error/20' : 'bg-status-success/10 text-status-success hover:bg-status-success/20'
            }`}
          >
            {coupon.active ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted flex-wrap">
        <span>
          Expires: <b className={expired && status !== 'used' ? 'text-status-error' : 'text-text-secondary'}>{fmtLocal(coupon.expiresAt)}</b>
        </span>
        {status === 'live' && timeLeft && (
          <span className={`font-mono font-bold ${timeLeft.startsWith('00') || Number(timeLeft.split(':')[0]) < 5 ? 'text-status-warning' : ''}`}>
            ({timeLeft} left)
          </span>
        )}
        {coupon.usedByOrder && <span className="font-mono">· order {coupon.usedByOrder}</span>}
      </div>

      {editing && (
        <div className="mt-2 pt-2 border-t border-border-subtle space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-surface border border-border-subtle text-[11px] font-mono text-text-primary focus:outline-none focus:border-primary-blue"
            />
            <span className="text-[10px] text-text-muted">clear = no expiry</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.minutes)}
                className="px-2 py-1 rounded-lg bg-canvas border border-border-subtle hover:border-primary-blue text-[10px] font-semibold text-text-secondary cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-hover text-white text-[10px] font-bold cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save new expiry
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-text-muted hover:text-text-primary hover:bg-surface cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Admin coupon manager: adjust expiry per code (support can extend a
 * customer's wheel prize) and switch codes on/off. */
export const CouponAdminCard: React.FC = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    couponsApi
      .adminList(token)
      .then(setCoupons)
      .catch((err) => setMessage(`❌ ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const filtered = useMemo(
    () => (search.trim() ? coupons.filter((c) => c.code.includes(search.trim().toUpperCase())) : coupons),
    [coupons, search]
  );

  const liveCount = coupons.filter((c) => statusOf(c) === 'live').length;

  return (
    <div className="p-5 rounded-2xl bg-white border border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
            <TicketPercent className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-text-muted">Discount code manager</p>
            <p className="text-xs font-bold text-text-primary">
              {liveCount} active · latest {coupons.length} codes
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg hover:bg-canvas text-text-muted hover:text-text-primary cursor-pointer"
          title="Reload list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Search code… (e.g. LUCKY-1A2B3C)"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-canvas border border-border-subtle text-xs font-mono text-text-primary placeholder:font-sans placeholder:normal-case focus:outline-none focus:border-primary-blue"
          />
        </div>
      </div>

      {message && <p className="mb-2 text-[11px] font-semibold text-text-primary">{message}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-text-muted py-3">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[11px] text-text-muted py-3">No matching codes.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filtered.map((c) => (
            <CouponRow
              key={c.code}
              coupon={c}
              token={token!}
              onUpdated={(u) => setCoupons((prev) => prev.map((x) => (x.code === u.code ? u : x)))}
              onError={(m) => setMessage(`❌ ${m}`)}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-text-muted leading-relaxed">
        💡 Edit each code's expiry (extend a customer's prize during support). The default TTL for new spins lives in the <b>Lucky Wheel</b> card above.
      </p>
    </div>
  );
};
