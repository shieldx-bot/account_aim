import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  ArrowUpRight,
  Send,
  Eye,
  EyeOff,
  Terminal,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/services/api';

/**
 * Admin order row - shape returned by GET /api/admin/orders (PostgreSQL)
 */
interface AdminOrderRow {
  orderId: string;
  userId?: string | null;
  guestEmail?: string | null;
  userEmail?: string | null;
  productName: string;
  planDurationMonths: number;
  targetEmail?: string | null;
  totalVND: number;
  paymentMethod: string;
  paymentGatewayRef?: string | null;
  status: string;
  createdAt: string;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('en-US');
};

export const AdminOrdersPage: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [stats, setStats] = useState<{ revenueToday: number; ordersPending: number } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mismatch' | 'dispatched' | 'pending'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [maskPrivacy, setMaskPrivacy] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        adminApi.getAllOrders(token, { limit: 200 }),
        adminApi.getStats(token),
      ]);
      setOrders(ordersRes.data || []);
      setStats(statsRes);
    } catch (err: any) {
      setError(err.message || 'Unable to load orders from the database.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Orders needing manual reconciliation = paid but not yet dispatched
  const isMismatch = (o: AdminOrderRow) => o.status === 'paid';

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const email = o.guestEmail || o.userEmail || '';
      const matchSearch =
        !search ||
        o.orderId.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        o.productName.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'mismatch' && isMismatch(o)) ||
        (statusFilter === 'dispatched' && o.status === 'dispatched') ||
        (statusFilter === 'pending' && o.status === 'pending');

      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // Manual approval override -> PATCH /api/admin/orders/:orderId/status (writes to PostgreSQL)
  const handleManualApprove = async (orderId: string) => {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      await adminApi.updateOrderStatus(token, orderId, 'dispatched', 'Admin approved via manual order matching');
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: 'dispatched' } : o)));
      setSelectedOrder((prev) => (prev && prev.orderId === orderId ? { ...prev, status: 'dispatched' } : prev));
    } catch (err: any) {
      alert(err.message || 'Unable to update the order. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Export CSV (from live DB data)
  const handleExportCSV = () => {
    const headers = 'ID,Time,Email,Product,Term,Amount,Gateway,Status\n';
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.orderId}","${formatDateTime(o.createdAt)}","${o.guestEmail || o.userEmail || ''}","${
            o.productName
          }",${o.planDurationMonths},${o.totalVND},"${o.paymentMethod}","${o.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aipro-orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-20 font-sans">
      {/* Top Admin Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <Link to="/" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <span className="text-accent-cyan">Admin Console</span>
            <span>/</span>
            <span className="text-text-primary font-bold">Orders &amp; Webhooks</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary mt-1 flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-accent-cyan" />
            Orders &amp; Webhook Reconciliation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-surface border border-border-subtle text-text-muted hover:text-text-primary"
            title="Reload data from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/inventory"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Account Inventory
          </Link>
          <Link
            to="/admin/warranty"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            SLA &amp; Warranty Monitoring
          </Link>

          <button
            type="button"
            onClick={() => setMaskPrivacy(!maskPrivacy)}
            className="p-2 rounded-lg bg-surface border border-border-subtle text-text-muted hover:text-text-primary"
            title="Show/hide sensitive data"
          >
            {maskPrivacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold mb-6">
          ⚠️ {error} — check the PostgreSQL backend connection.
        </div>
      )}

      {/* KPI METRIC CARDS ROW (live from /api/admin/stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted font-medium">Revenue Today</span>
          <div className="text-2xl font-extrabold font-mono text-text-primary mt-1">
            {stats ? `$${(stats.revenueToday / 25000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '…'}
          </div>
          <span className="text-[11px] text-text-muted mt-1 inline-block">Paid/dispatched orders today</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted font-medium">Pending / Needs Approval</span>
          <div className="text-2xl font-extrabold font-mono text-status-warning mt-1">
            {orders.filter(isMismatch).length} Orders
          </div>
          <span className="text-[11px] text-status-warning mt-1 inline-block">Awaiting admin order matching</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted font-medium">Total Orders Awaiting Payment</span>
          <div className="text-2xl font-extrabold font-mono text-text-primary mt-1">
            {stats ? `${stats.ordersPending} Orders` : '…'}
          </div>
          <span className="text-[11px] text-text-muted mt-1 inline-block">Pending status in the DB</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted font-medium">Data Source</span>
          <div className="flex items-center gap-2 text-sm font-bold text-status-success mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse inline-block"></span>
            <span>PostgreSQL Live</span>
          </div>
          <span className="text-[11px] text-text-muted mt-1 inline-block">{orders.length} orders loaded last fetch</span>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-subtle mb-6">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all' ? 'bg-primary-blue text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('mismatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              statusFilter === 'mismatch' ? 'bg-status-warning text-white font-bold' : 'text-status-warning hover:bg-status-warning/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Action ({orders.filter(isMismatch).length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('dispatched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'dispatched' ? 'bg-status-success/20 text-status-success' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Dispatched
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'pending' ? 'bg-canvas text-text-primary border border-border-subtle' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Awaiting Transfer
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Email, Product..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-canvas border border-border-subtle text-xs text-text-primary focus:border-border-focus focus:outline-none"
          />
        </div>
      </div>

      {/* ORDERS INTERACTIVE TABLE */}
      <div className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-canvas/80 text-[11px] font-semibold text-text-muted uppercase border-b border-border-subtle">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Time</th>
                <th className="p-4">Customer (Email)</th>
                <th className="p-4">License Plan</th>
                <th className="p-4">Gateway</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading orders from the database...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-text-muted">
                    No orders match the current filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const email = order.guestEmail || order.userEmail || '—';
                  return (
                    <tr
                      key={order.orderId}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-elevated/50 transition-colors cursor-pointer ${
                        isMismatch(order) ? 'bg-status-warning/5 border-l-2 border-l-status-warning' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-text-primary">{order.orderId.slice(0, 8).toUpperCase()}</td>
                      <td className="p-4 text-text-muted">{formatDateTime(order.createdAt)}</td>
                      <td className="p-4 font-mono text-text-primary">
                        {maskPrivacy ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : email}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-text-primary">{order.productName}</span>{' '}
                        <span className="text-text-muted">({order.planDurationMonths} Months)</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-canvas border border-border-subtle">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 font-mono">
                        <span className="text-text-primary font-bold">${(order.totalVND / 25000).toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        {order.status === 'dispatched' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        )}
                        {order.status === 'paid' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-status-warning text-white flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Paid, awaiting delivery
                          </span>
                        )}
                        {order.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-canvas text-text-muted border border-border-subtle flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Awaiting transfer
                          </span>
                        )}
                        {(order.status === 'cancelled' || order.status === 'refunded') && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-status-error/10 text-status-error border border-status-error/30 flex items-center gap-1 w-fit">
                            {order.status === 'cancelled' ? 'Cancelled' : 'Refunded'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isMismatch(order) ? (
                          <button
                            type="button"
                            disabled={updatingId === order.orderId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManualApprove(order.orderId);
                            }}
                            className="px-2.5 py-1 rounded bg-primary-blue hover:bg-primary-hover disabled:opacity-50 text-white text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            {updatingId === order.orderId && <Loader2 className="w-3 h-3 animate-spin" />}
                            Match & dispatch now
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-text-muted hover:text-text-primary text-[11px] underline"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAIL SLIDE-OVER DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-surface border-l border-border-subtle p-6 h-full overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <span className="text-xs font-mono text-accent-cyan block">Order Details</span>
                <h3 className="text-xl font-bold text-text-primary break-all">{selectedOrder.orderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-canvas border border-border-subtle text-text-muted hover:text-text-primary text-xs"
              >
                Close ✕
              </button>
            </div>

            {/* Quick Actions Panel */}
            {isMismatch(selectedOrder) && (
              <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 space-y-3">
                <div className="flex items-center gap-2 text-status-warning text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Awaiting Match Approval / Delivery</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Payment has been recorded in the database but not yet delivered. Approve to pull an account from inventory and deliver it to the customer immediately.
                </p>
                <button
                  type="button"
                  disabled={updatingId === selectedOrder.orderId}
                  onClick={() => handleManualApprove(selectedOrder.orderId)}
                  className="w-full h-10 rounded-xl bg-primary-blue hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Manual match &amp; dispatch now</span>
                </button>
              </div>
            )}

            {/* Payload Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                <span className="text-text-muted block text-[11px]">Delivery email:</span>
                <span className="font-mono text-text-primary">{selectedOrder.targetEmail || selectedOrder.guestEmail || selectedOrder.userEmail || '—'}</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                <span className="text-text-muted block text-[11px]">Product &amp; term:</span>
                <span className="font-mono text-accent-cyan font-bold">
                  {selectedOrder.productName} — {selectedOrder.planDurationMonths} months — ${(selectedOrder.totalVND / 25000).toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                <span className="text-text-muted block text-[11px]">Payment reference:</span>
                <span className="font-mono text-text-primary">{selectedOrder.paymentGatewayRef || 'None'}</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                <span className="text-text-muted block text-[11px]">Order created at:</span>
                <span className="font-mono text-text-primary">{formatDateTime(selectedOrder.createdAt)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex gap-2">
              <Link
                to={`/delivery/${selectedOrder.orderId}`}
                className="flex-1 h-10 rounded-xl bg-canvas hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Open Delivery Page</span>
              </Link>
              <a
                href={`mailto:${selectedOrder.guestEmail || selectedOrder.userEmail || ''}`}
                className="flex-1 h-10 rounded-xl bg-canvas hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send License Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
