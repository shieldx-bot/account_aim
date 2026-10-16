import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { adsApi } from '@/services/api';
import { usdToVnd } from '@/types';
import type { AdSession, AdsStatus } from '@/types';
import {
  PlayCircle,
  Wallet,
  Timer,
  Gift,
  History,
  Coins,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Trophy,
  ListChecks,
  Sparkles,
  MonitorPlay,
  Lock,
  RefreshCw,
} from 'lucide-react';

const PROVIDER_LABELS: Record<string, string> = {
  internal: 'AgentLab Sponsor',
  torox: 'Torox',
  offertoro: 'Torox',
  bitlabs: 'BitLabs',
  adgate: 'AdGate Media',
  lootably: 'Lootably',
  cpxresearch: 'CPX Research',
  adgem: 'AdGem',
};

const STATUS_STYLES: Record<AdSession['status'], string> = {
  credited: 'bg-status-success/15 text-status-success',
  started: 'bg-status-warning/15 text-status-warning',
  reversed: 'bg-status-error/15 text-status-error',
};

const STATUS_LABELS: Record<AdSession['status'], string> = {
  credited: 'Đã cộng',
  started: 'Đang xem',
  reversed: 'Đã thu hồi',
};

const fmtUsd = (v: number): string => (v >= 0.01 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);

const EQUALIZER_BARS = [0.9, 0.55, 1.25, 0.7, 1.05, 0.4, 0.85, 0.6, 1.15, 0.5, 0.95, 0.65];

export const MemberEarnPage: React.FC = () => {
  const { user, token, addBalance } = useAuth();
  const { formatPrice } = useApp();

  const [status, setStatus] = useState<AdsStatus | null>(null);
  const [history, setHistory] = useState<AdSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'video' | 'offerwall'>('video');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [s, h] = await Promise.all([adsApi.getStatus(token), adsApi.getHistory(token)]);
      setStatus(s);
      setHistory(h);
    } catch (err) {
      console.warn('[MemberEarn] Failed to load ads data:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionId]);

  const handleStartWatch = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const s = await adsApi.startWatch(token);
      setSessionId(s.sessionId);
      setSecondsLeft(s.minWatchSeconds);
      setTotalSeconds(s.minWatchSeconds);
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    if (!token || !sessionId) return;
    setBusy(true);
    try {
      const r = await adsApi.claimWatch(token, sessionId);
      addBalance(usdToVnd(r.rewardUSD), r.rewardUSD);
      showToast('success', `+${fmtUsd(r.rewardUSD)} đã được cộng vào ví AgentLab!`);
      setSessionId(null);
      setSecondsLeft(0);
      await loadAll();
    } catch (err) {
      showToast('error', (err as Error).message);
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const canClaim = Boolean(sessionId) && secondsLeft === 0 && !busy;
  const outOfQuota = status ? status.remainingToday <= 0 : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary-blue inline mr-2" />
        <span className="text-sm text-text-muted">Đang tải trang Xem &amp; Kiếm…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-status-success text-white'
              : 'bg-status-error text-white'
          }`}
        >
          {toast.type === 'success' ? <Trophy className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-accent-cyan" />
            Xem &amp; Kiếm
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Xem video tài trợ và hoàn thành nhiệm vụ để tích credit vào ví AgentLab — dùng để mua và gia hạn tài khoản AI.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="self-start sm:self-auto px-3 py-2 rounded-xl bg-canvas border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {!status?.active ? (
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-status-warning mx-auto mb-3" />
          <h2 className="text-sm font-bold text-text-primary">Tính năng tạm thời chưa mở</h2>
          <p className="text-xs text-text-secondary mt-1">
            Hệ thống Xem &amp; Kiếm đang được bảo trì. Vui lòng quay lại sau hoặc tham gia chương trình giới thiệu bạn bè.
          </p>
          <Link
            to="/member/dashboard"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-primary-blue text-white text-xs font-bold hover:bg-primary-hover transition-colors"
          >
            Về trang tổng quan
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase">Số dư ví</span>
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-text-primary">
                {formatPrice(usdToVnd(status.balanceUSD), status.balanceUSD)}
              </div>
              <span className="text-[11px] text-text-muted mt-1 block">Credit dùng trong store</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase">Đã xem hôm nay</span>
                <div className="w-8 h-8 rounded-lg bg-primary-blue/10 text-primary-blue flex items-center justify-center">
                  <PlayCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-text-primary">
                {status.usedToday}/{status.dailyCap}
              </div>
              <span className="text-[11px] text-text-muted mt-1 block">Lượt video nội bộ</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase">Còn lại hôm nay</span>
                <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-status-success">
                {status.remainingToday}
              </div>
              <span className="text-[11px] text-text-muted mt-1 block">Reset vào 00:00 mỗi ngày</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase">Thưởng / lượt</span>
                <div className="w-8 h-8 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-status-warning">
                {fmtUsd(status.perWatchUSD)}
              </div>
              <span className="text-[11px] text-text-muted mt-1 block">
                Xem đủ {status.minWatchSeconds} giây
              </span>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
            <div className="flex border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setTab('video')}
                className={`flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  tab === 'video'
                    ? 'bg-primary-blue/10 text-primary-blue border-b-2 border-primary-blue'
                    : 'text-text-secondary hover:text-text-primary hover:bg-canvas'
                }`}
              >
                <MonitorPlay className="w-4 h-4" />
                Video tài trợ
              </button>
              <button
                type="button"
                onClick={() => setTab('offerwall')}
                className={`flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  tab === 'offerwall'
                    ? 'bg-primary-blue/10 text-primary-blue border-b-2 border-primary-blue'
                    : 'text-text-secondary hover:text-text-primary hover:bg-canvas'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Nhiệm vụ &amp; Khảo sát
              </button>
            </div>

            {tab === 'video' ? (
              <div className="p-5 sm:p-6">
                {outOfQuota ? (
                  <div className="text-center py-10 bg-canvas rounded-xl border border-border-subtle">
                    <Timer className="w-8 h-8 text-status-warning mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-text-primary">Đã hết lượt xem hôm nay</h3>
                    <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                      Bạn đã xem đủ {status.dailyCap} lượt. Quay lại vào ngày mai, hoặc kiếm thêm credit
                      qua tab Nhiệm vụ &amp; Khảo sát bên trên.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="relative rounded-xl border border-border-subtle overflow-hidden mb-5"
                      style={{ background: 'linear-gradient(135deg, #0b1220 0%, #111d33 55%, #0b1220 100%)' }}
                    >
                      <style>{`
                        @keyframes earnBar {
                          0%, 100% { transform: scaleY(0.35); }
                          50% { transform: scaleY(1); }
                        }
                      `}</style>
                      <div className="h-44 sm:h-56 flex items-end justify-center gap-1.5 pb-8 px-6">
                        {EQUALIZER_BARS.map((h, i) => (
                          <span
                            key={i}
                            className="w-2.5 rounded-t bg-gradient-to-t from-primary-blue/40 to-accent-cyan"
                            style={{
                              height: `${h * 70}%`,
                              animation: sessionId
                                ? `earnBar ${0.7 + (i % 5) * 0.18}s ease-in-out ${i * 0.06}s infinite`
                                : 'none',
                              transform: 'scaleY(0.35)',
                              opacity: sessionId ? 1 : 0.45,
                            }}
                          />
                        ))}
                      </div>
                      {!sessionId && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-primary-blue/20 border border-primary-blue/40 flex items-center justify-center mb-2">
                            <PlayCircle className="w-7 h-7 text-accent-cyan" />
                          </div>
                          <p className="text-[11px] font-mono text-text-muted">
                            SPONSOR STREAM • {status.minWatchSeconds}s
                          </p>
                        </div>
                      )}
                      {sessionId && (
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <div className="flex items-center justify-between text-[11px] font-mono text-accent-cyan mb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3" />
                              {secondsLeft > 0 ? 'Đang phát — thoát sớm sẽ mất thưởng' : 'Đã xem xong — nhận thưởng!'}
                            </span>
                            <span className="font-bold">
                              {secondsLeft > 0 ? `${secondsLeft}s` : '0s'}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary-blue to-accent-cyan transition-all duration-1000"
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {!sessionId ? (
                        <button
                          type="button"
                          onClick={handleStartWatch}
                          disabled={busy}
                          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan hover:from-primary-hover hover:to-accent-cyan/80 text-white text-sm font-extrabold shadow-lg shadow-primary-blue/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                          Bắt đầu xem — +{fmtUsd(status.perWatchUSD)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleClaim}
                          disabled={!canClaim}
                          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-extrabold shadow-lg shadow-status-success/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Coins className="w-4 h-4" />
                          )}
                          {secondsLeft > 0 ? `Chờ ${secondsLeft}s để nhận thưởng` : 'Nhận thưởng ngay'}
                        </button>
                      )}
                      <Link
                        to="/products"
                        className="sm:w-48 py-3.5 rounded-xl bg-canvas border border-border-subtle hover:border-primary-blue text-text-secondary hover:text-text-primary text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Tiêu credit ngay
                      </Link>
                    </div>

                    <p className="text-[11px] text-text-muted mt-3 leading-relaxed">
                      Bộ đếm giới hạn bởi server — không thể bỏ qua bằng cách tải lại trang hoặc chỉnh sửa
                      trình duyệt. Mỗi phiên xem chỉ được nhận thưởng đúng một lần.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                {status.offerwallUrl ? (
                  <>
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-canvas border border-border-subtle mb-4">
                      <ShieldCheck className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Nhiệm vụ do đối tác cung cấp uy tín (Torox, BitLabs…) vận hành. Hoàn thành nhiệm vụ,
                        credit sẽ tự động vào ví trong vài phút — hệ thống xác thực chữ ký postback, không
                        thể giả mạo.
                      </p>
                    </div>
                    <iframe
                      src={status.offerwallUrl}
                      title="Offerwall nhiệm vụ"
                      className="w-full h-[560px] rounded-xl border border-border-subtle bg-canvas"
                      referrerPolicy="no-referrer-when-downgrade"
                      loading="lazy"
                    />
                  </>
                ) : (
                  <div className="text-center py-10 bg-canvas rounded-xl border border-border-subtle">
                    <ListChecks className="w-8 h-8 text-text-muted mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-text-primary">Chưa có nhiệm vụ nào</h3>
                    <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                      Bảng nhiệm vụ đang được cấu hình. Trong lúc chờ đợi, hãy xem video tài trợ ở tab bên
                      cạnh để tích credit mỗi ngày.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-accent-cyan" />
                <h2 className="text-base font-bold text-text-primary">Lịch sử tích credit</h2>
              </div>
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Thời gian</th>
                        <th className="py-2.5 px-4">Nguồn</th>
                        <th className="py-2.5 px-4">Giá trị</th>
                        <th className="py-2.5 px-4 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="py-2.5 px-4 text-text-muted">
                            {new Date(h.createdAt).toLocaleString('en-US')}
                          </td>
                          <td className="py-2.5 px-4 font-sans font-medium text-text-primary">
                            {PROVIDER_LABELS[h.provider] || h.provider}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-text-primary">
                            {h.status === 'started' ? '—' : `${h.status === 'reversed' ? '-' : '+'}${fmtUsd(h.rewardUSD)}`}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                STATUS_STYLES[h.status]
                              }`}
                            >
                              {STATUS_LABELS[h.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-canvas rounded-xl border border-border-subtle">
                  <p className="text-xs text-text-muted">Chưa có giao dịch nào. Xem video đầu tiên để bắt đầu!</p>
                </div>
              )}
            </div>

            <div className="bg-surface border border-border-subtle rounded-2xl p-6">
              <h2 className="text-base font-bold text-text-primary mb-4">Điều kiện &amp; Quy tắc</h2>
              <ul className="space-y-3">
                <li className="flex gap-2.5">
                  <Wallet className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                  <span className="text-[11px] text-text-secondary leading-relaxed">
                    Credit chỉ dùng để mua và gia hạn tài khoản AI trong store — <b>không rút tiền mặt</b>.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Timer className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                  <span className="text-[11px] text-text-secondary leading-relaxed">
                    Tối đa <b>{status.dailyCap} lượt/ngày</b>, mỗi lượt cần xem đủ{' '}
                    <b>{status.minWatchSeconds} giây</b> (kiểm tra phía server).
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                  <span className="text-[11px] text-text-secondary leading-relaxed">
                    Phát hiện farm, VPN, script hoặc nhiều tài khoản cùng thiết bị → <b>thu hồi toàn bộ credit</b>.
                  </span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-border-subtle">
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Ví hiện tại của {user?.name || 'bạn'}:{' '}
                  <span className="font-mono font-bold text-status-success">
                    {formatPrice(user?.balanceVND || 0, user?.balanceUSD || 0)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
