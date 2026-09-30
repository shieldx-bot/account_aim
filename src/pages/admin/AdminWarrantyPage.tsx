import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { warrantyApi } from '@/services/api';

/** Ticket row returned by GET /api/admin/warranty (table warranty_tickets) */
interface WarrantyTicketRow {
  id: string;
  orderId: string;
  customerEmail: string;
  tool: string;
  reason: string;
  attempts: number;
  slaLeftMinutes: number;
  status: 'agent_pending' | 'resolved' | 'bot_handled' | string;
  createdAt: string;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN');
};

export const AdminWarrantyPage: React.FC = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<WarrantyTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await warrantyApi.getTickets(token);
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải phiếu khiếu nại từ database.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // PATCH /api/admin/warranty/:id/resolve → UPDATE PostgreSQL (trích buffer pool đổi mới)
  const handleApproveOverride = async (ticketId: string) => {
    if (!token) return;
    setBusyId(ticketId);
    try {
      await warrantyApi.resolveTicket(token, ticketId);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t)));
    } catch (err: any) {
      alert(err.message || 'Không thể duyệt phiếu. Kiểm tra buffer pool còn tài khoản khả dụng không.');
    } finally {
      setBusyId(null);
    }
  };

  const urgentCount = tickets.filter(
    (t) => t.status === 'agent_pending' && t.slaLeftMinutes <= 10
  ).length;
  const nearestUrgent = tickets
    .filter((t) => t.status === 'agent_pending')
    .sort((a, b) => a.slaLeftMinutes - b.slaLeftMinutes)[0];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <Link to="/admin/orders" className="hover:text-text-primary">Admin Console</Link>
            <span>/</span>
            <span className="text-text-primary font-bold">SLA &amp; Warranty Escalation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-status-warning" />
            Trung Tâm Xử Lý Bảo Hành &amp; Giám Sát Khiếu Nại SLA
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="p-2 rounded-lg bg-surface border border-border-subtle text-text-muted hover:text-text-primary"
            title="Tải lại từ Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/orders"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Đơn Hàng
          </Link>
          <Link
            to="/admin/inventory"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Kho Tài Khoản
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold my-6">
          ⚠️ {error} — kiểm tra kết nối backend PostgreSQL.
        </div>
      )}

      {/* SLA Breach Alert Banner (live count from DB) */}
      {urgentCount > 0 && (
        <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 my-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-status-warning shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-text-primary">
                Có {urgentCount} khiếu nại sắp chạm mốc cam kết SLA (&lt; 10 phút)
              </h4>
              <p className="text-[11px] text-text-secondary">
                Đơn #{nearestUrgent?.orderId?.slice(0, 8).toUpperCase()} đang chờ nhân viên duyệt cấp đặc cách.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-10 rounded-2xl bg-surface border border-border-subtle text-center text-text-muted text-xs">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Đang tải phiếu khiếu nại từ database...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface border border-border-subtle text-center text-text-muted text-xs">
            🎉 Không có khiếu nại nào đang mở. Hệ thống bảo hành hoạt động bình thường.
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className={`p-6 rounded-2xl bg-surface border transition-colors ${
                t.status === 'agent_pending' ? 'border-status-warning/50' : 'border-border-subtle'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/50 mb-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-text-primary text-sm">{t.id.slice(0, 8).toUpperCase()}</span>
                  <span className="font-mono text-accent-cyan">Đơn: {t.orderId.slice(0, 8).toUpperCase()}</span>
                  <span className="text-text-muted">• {t.tool}</span>
                  <span className="text-text-muted">• {formatDateTime(t.createdAt)}</span>
                </div>
                <div>
                  {t.status === 'agent_pending' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-status-warning text-black flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Cần xử lý gấp ({t.slaLeftMinutes}m left)
                    </span>
                  )}
                  {t.status === 'resolved' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-status-success/15 text-status-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã duyệt đổi mới
                    </span>
                  )}
                  {t.status === 'bot_handled' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-canvas text-text-muted flex items-center gap-1">
                      Bot xử lý tự động
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-text-secondary mb-4">
                <p><strong className="text-text-primary">Khách hàng:</strong> {t.customerEmail}</p>
                <p className="mt-1"><strong className="text-text-primary">Mô tả sự cố:</strong> {t.reason}</p>
                <p className="mt-1"><strong className="text-text-primary">Số lần đổi:</strong> {t.attempts}</p>
              </div>

              {t.status === 'agent_pending' && (
                <div className="flex items-center gap-3 pt-3 border-t border-border-subtle/50">
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => handleApproveOverride(t.id)}
                    className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {busyId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>⚡ Duyệt Cấp 1 Tài Khoản Mới Từ Buffer Pool</span>
                  </button>
                  <a
                    href={`mailto:${t.customerEmail}`}
                    className="px-4 py-2 rounded-xl bg-canvas hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#229ED9]" />
                    <span>Phản hồi qua Email</span>
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
