import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ordersApi } from '@/services/api';
import type { OrderItem } from '@/types';
import {
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  dispatched: { label: 'Delivered', cls: 'bg-status-success/15 text-status-success' },
  paid: { label: 'Paid', cls: 'bg-primary-blue/15 text-primary-blue' },
  pending: { label: 'Awaiting payment', cls: 'bg-status-warning/15 text-status-warning' },
  cancelled: { label: 'Cancelled', cls: 'bg-status-error/15 text-status-error' },
  refunded: { label: 'Refunded', cls: 'bg-text-muted/15 text-text-muted' },
};

export const MemberOrdersPage: React.FC = () => {
  const { token } = useAuth();
  const { formatPrice } = useApp();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dispatched' | 'pending'>('all');

  // Production: load the real order history from PostgreSQL via API
  useEffect(() => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    ordersApi
      .getMyOrders(token)
      .then((data) => {
        if (!cancelled) setOrders(data as OrderItem[]);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Unable to load order history from the server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        ord.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = selectedFilter === 'all' || ord.status === selectedFilter;
      return matchSearch && matchFilter;
    });
  }, [orders, searchTerm, selectedFilter]);

  const handleDownloadInvoice = (orderId: string) => {
    const json = JSON.stringify(
      orders.find((o) => o.orderId === orderId),
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${orderId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
          Order History &amp; Invoices
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Track all transactions made on the AgentLab platform.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface p-4 rounded-2xl border border-border-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID (ORD-AI-...) or product..."
            className="w-full pl-10 pr-4 py-2 bg-canvas border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'dispatched'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setSelectedFilter(filterKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === filterKey
                  ? 'bg-primary-blue text-white'
                  : 'bg-canvas text-text-secondary hover:text-text-primary border border-border-subtle'
              }`}
            >
              {filterKey === 'all' ? 'All orders' : 'Delivered'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Product &amp; Term</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-blue inline mr-2" />
                    <span className="text-xs text-text-muted">Loading order history from the server…</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <AlertCircle className="w-5 h-5 text-status-error inline mr-2" />
                    <span className="text-xs text-status-error">{error}</span>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const st = STATUS_LABEL[ord.status] ?? { label: ord.status, cls: 'bg-surface-subtle text-text-secondary' };
                  return (
                  <tr key={ord.orderId} className="hover:bg-canvas/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-accent-cyan">{ord.orderId}</td>
                    <td className="py-4 px-4 font-sans">
                      <span className="font-semibold text-text-primary block">{ord.productName}</span>
                      <span className="text-[11px] text-text-muted">
                        Term: {ord.planDurationMonths} months •{' '}
                        {ord.provisioningType === 'invite_email' ? 'Your own email' : 'Pre-provisioned account'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-text-muted">{new Date(ord.createdAt).toLocaleString('en-US')}</td>
                    <td className="py-4 px-4 uppercase text-text-secondary">{ord.paymentMethod}</td>
                    <td className="py-4 px-4 font-bold text-text-primary">
                      {formatPrice(ord.totalAmount, ord.totalUSD ?? ord.totalAmount / 25000)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{st.label}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(ord.orderId)}
                          className="p-1.5 rounded-lg bg-canvas hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                          title="Download JSON receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/order/success/${ord.orderId}`}
                          className="px-2.5 py-1.5 rounded-lg bg-primary-blue/15 hover:bg-primary-blue/25 text-primary-blue font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Open Vault</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-muted">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
