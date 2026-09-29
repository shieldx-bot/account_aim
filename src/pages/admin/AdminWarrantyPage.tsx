import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MessageSquare,
  RefreshCw,
  Search,
} from 'lucide-react';

interface MockDisputeTicket {
  id: string;
  orderId: string;
  customerEmail: string;
  tool: string;
  reason: string;
  attempts: number;
  slaLeftMinutes: number;
  status: 'agent_pending' | 'resolved' | 'bot_handled';
  createdAt: string;
}

const INITIAL_TICKETS: MockDisputeTicket[] = [
  {
    id: 'DISP-101',
    orderId: 'AIPRO-94820',
    customerEmail: 'alex.dev@gmail.com',
    tool: 'Cursor Pro',
    reason: 'Đã đổi 2 lần trong 24h - Yêu cầu cấp tài khoản mới do out gói Pro lần 3',
    attempts: 2,
    slaLeftMinutes: 8,
    status: 'agent_pending',
    createdAt: '22/03/2026 15:10:00',
  },
  {
    id: 'DISP-102',
    orderId: 'AIPRO-94815',
    customerEmail: 'dung.ai@viettel.vn',
    tool: 'Claude Pro',
    reason: 'Bot tự động cấp tài khoản mới thành công (60s)',
    attempts: 1,
    slaLeftMinutes: 0,
    status: 'bot_handled',
    createdAt: '22/03/2026 14:02:11',
  },
];

export const AdminWarrantyPage: React.FC = () => {
  const [tickets, setTickets] = useState<MockDisputeTicket[]>(INITIAL_TICKETS);

  const handleApproveOverride = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    alert('Đã cấp 1 tài khoản mới từ Buffer Pool và gửi thông tin đến khách hàng qua Email!');
  };

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

      {/* SLA Breach Alert Banner */}
      <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 my-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-status-warning shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-text-primary">Có 1 khiếu nại sắp chạm mốc cam kết SLA (&lt; 10 phút)</h4>
            <p className="text-[11px] text-text-secondary">Đơn #AIPRO-94820 đang chờ nhân viên duyệt cấp đặc cách.</p>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.map((t) => (
          <div
            key={t.id}
            className={`p-6 rounded-2xl bg-surface border transition-colors ${
              t.status === 'agent_pending' ? 'border-status-warning/50' : 'border-border-subtle'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/50 mb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-text-primary text-sm">{t.id}</span>
                <span className="font-mono text-accent-cyan">Đơn: {t.orderId}</span>
                <span className="text-text-muted">&bull; {t.tool}</span>
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
            </div>

            {t.status === 'agent_pending' && (
              <div className="flex items-center gap-3 pt-3 border-t border-border-subtle/50">
                <button
                  type="button"
                  onClick={() => handleApproveOverride(t.id)}
                  className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Duyệt Cấp 1 Tài Khoản Mới Từ Buffer Pool</span>
                </button>
                <a
                  href="https://t.me/aipro_support"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-canvas hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span>Chat Telegram với khách</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
