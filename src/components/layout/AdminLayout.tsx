import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Zap,
  Boxes,
  ShieldAlert,
  Users,
  LogOut,
  Store,
  Terminal,
  Activity,
  Menu,
  X,
  AlertTriangle,
  Radio,
  Package,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Overview & Revenue',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/products',
      label: 'Product management',
      icon: Package,
    },
    {
      to: '/admin/orders',
      label: 'Transaction reconciliation',
      icon: Zap,
      alert: '2',
    },
    {
      to: '/admin/inventory',
      label: 'Inventory management',
      icon: Boxes,
    },
    {
      to: '/admin/warranty',
      label: 'SLA & Bot Monitoring',
      icon: ShieldAlert,
    },
    {
      to: '/admin/users',
      label: 'Member management',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-text-primary flex">
      {/* Desktop Operator Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-border-subtle z-20">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border-subtle bg-white">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-status-error/20 border border-status-error/40 flex items-center justify-center text-status-error">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-black tracking-widest uppercase text-text-primary">
                OPERATOR<span className="text-status-error">_OS</span>
              </span>
              <span className="text-[9px] text-text-muted font-mono tracking-tight">AgentLab Root Console</span>
            </div>
          </Link>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-error/15 text-status-error text-[10px] font-mono font-bold">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Operator Profile Card */}
        <div className="p-3.5 m-3 rounded-xl bg-canvas border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-status-error/10 border border-status-error/30 flex items-center justify-center text-status-error font-bold font-mono">
              ROOT
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-text-primary truncate">{user?.name || 'Root Admin'}</h4>
              <span className="text-[10px] text-status-error font-mono font-semibold block">
                Privilege: SUPER_ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    isActive
                      ? 'bg-primary-blue/10 text-primary-blue font-bold'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span className="font-sans font-semibold">{item.label}</span>
                </div>
                {item.alert && (
                  <span className="px-1.5 py-0.2 rounded bg-status-error/20 text-status-error text-[10px] font-bold">
                    {item.alert}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-border-subtle space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-accent-cyan hover:bg-surface transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>View Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>End Root Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-text-muted">
              <span className="text-text-primary font-bold">AgentLab Administration</span>
              <span>/</span>
              <span className="text-accent-cyan">Cluster-VN-01</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border-subtle font-mono text-xs">
              <Activity className="w-3.5 h-3.5 text-status-success" />
              <span className="text-text-secondary">Webhook Gateway:</span>
              <span className="text-status-success font-bold">ACTIVE (0ms lag)</span>
            </div>

            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Go to Storefront
            </Link>
          </div>
        </header>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-sm pt-16">
            <div className="bg-white border-b border-border-subtle p-4 space-y-2 font-mono">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-primary-blue/10 text-primary-blue' : 'text-text-secondary hover:bg-surface-subtle'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
              <div className="pt-4 border-t border-border-subtle flex gap-2 font-sans">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-canvas border border-border-subtle text-center text-xs font-semibold"
                >
                  Storefront
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 rounded-xl bg-status-error/15 text-status-error text-center text-xs font-semibold"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
