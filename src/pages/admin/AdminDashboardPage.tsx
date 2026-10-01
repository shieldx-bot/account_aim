import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const weeklyRevenue = [
    { day: 'Mon', amount: 340, height: '45%' },
    { day: 'Tue', amount: 488, height: '65%' },
    { day: 'Wed', amount: 600, height: '80%' },
    { day: 'Thu', amount: 456, height: '60%' },
    { day: 'Fri', amount: 756, height: '95%' },
    { day: 'Sat', amount: 840, height: '100%' },
    { day: 'Sun', amount: 592, height: '78%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
            Executive Command Dashboard
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Financial overview, automated VietQR reconciliation, and warehouse supply status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-status-error hover:bg-status-error/90 text-white text-xs font-bold transition-all shadow-lg shadow-status-error/20 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Resolve 2 pending orders</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2 font-sans">
            <span className="text-[11px] font-bold uppercase">Revenue today</span>
            <div className="w-8 h-8 rounded-lg bg-status-success/15 text-status-success flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-text-primary">$594.00</div>
          <span className="text-[11px] text-status-success font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24.8% vs yesterday</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2 font-sans">
            <span className="text-[11px] font-bold uppercase">Orders today</span>
            <div className="w-8 h-8 rounded-lg bg-primary-blue/15 text-primary-blue flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-text-primary">34 orders</div>
          <span className="text-[11px] text-accent-cyan mt-1 block">
            32 automated • 2 need manual matching
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border-subtle">
          <div className="flex items-center justify-between text-text-muted mb-2 font-sans">
            <span className="text-[11px] font-bold uppercase">Available stock</span>
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/15 text-accent-cyan flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-accent-cyan">485 slots</div>
          <span className="text-[11px] text-status-success mt-1 block">
            Enough to cover the next 14 days
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-status-error/30 bg-status-error/5">
          <div className="flex items-center justify-between text-text-muted mb-2 font-sans">
            <span className="text-[11px] font-bold uppercase text-status-error">Pending orders awaiting match</span>
            <div className="w-8 h-8 rounded-lg bg-status-error/20 text-status-error flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-status-error">2 orders</div>
          <span className="text-[11px] text-status-error/90 mt-1 block">
            1 amount mismatch • 1 memo mismatch
          </span>
        </div>
      </div>

      {/* Grid: 7-Day Revenue & Urgent Reconciliation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-border-subtle rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 font-sans">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase">Weekly Revenue Chart (USD)</h3>
              <p className="text-[11px] text-text-secondary">Last 7 days via VietQR, PayPal, and Crypto.</p>
            </div>
            <span className="text-xs font-mono font-bold text-status-success">Total: $4,072</span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-border-subtle">
            {weeklyRevenue.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  ${item.amount}
                </span>
                <div className="w-full bg-canvas rounded-t-lg h-36 flex items-end overflow-hidden">
                  <div
                    style={{ height: item.height }}
                    className="w-full bg-gradient-to-t from-primary-blue to-accent-cyan group-hover:from-accent-cyan group-hover:to-white transition-all rounded-t-lg"
                  />
                </div>
                <span className="text-[11px] text-text-muted font-bold">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Urgent Orders Queue */}
        <div className="bg-white border border-border-subtle rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 font-sans">
              <h3 className="text-sm font-bold text-status-error uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Order Matching Alerts</span>
              </h3>
              <Link to="/admin/orders" className="text-xs text-primary-blue hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-status-error">ORD-AI-1094</span>
                  <span className="text-[10px] text-text-muted">3 minutes ago</span>
                </div>
                <p className="text-text-primary text-[11px] font-sans">
                  Underpaid transfer: received <strong>$8.00</strong> (expected $9.96)
                </p>
                <div className="mt-2 flex justify-end">
                  <Link
                    to="/admin/orders"
                    className="px-2.5 py-1 rounded bg-status-error text-white font-bold text-[10px] uppercase font-sans"
                  >
                    Resolve now →
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-status-warning/10 border border-status-warning/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-status-warning">ORD-AI-1092</span>
                  <span className="text-[10px] text-text-muted">15 minutes ago</span>
                </div>
                <p className="text-text-primary text-[11px] font-sans">
                  Invalid syntax: customer wrote <em>&quot;Nguyen Van A chuyen tien&quot;</em>
                </p>
                <div className="mt-2 flex justify-end">
                  <Link
                    to="/admin/orders"
                    className="px-2.5 py-1 rounded bg-primary-blue text-white font-bold text-[10px] uppercase font-sans"
                  >
                    Assign order ID →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle text-text-muted text-[11px]">
            The bot system is automatically scanning the MBBank webhook every 1.5s.
          </div>
        </div>
      </div>
    </div>
  );
};
