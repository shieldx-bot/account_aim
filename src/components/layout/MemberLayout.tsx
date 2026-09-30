import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { usdToVnd } from '@/types';
import { CartDrawer } from '@/components/cart/CartDrawer';
import {
  LayoutDashboard,
  KeyRound,
  ShoppingBag,
  ShieldAlert,
  UserCheck,
  LogOut,
  Store,
  Wallet,
  PlusCircle,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Terminal,
} from 'lucide-react';

export const MemberLayout: React.FC = () => {
  const { user, logout, addBalance } = useAuth();
  const { formatPrice } = useApp();
  const { openCart, totalCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmountUSD, setTopUpAmountUSD] = useState(8);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConfirmTopUp = () => {
    // USD is the single source of truth; VND fields are derived for legacy payloads.
    addBalance(usdToVnd(topUpAmountUSD), topUpAmountUSD);
    setShowTopUpModal(false);
  };

  const navItems = [
    {
      to: '/member/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      to: '/member/subscriptions',
      label: 'My AI Account',
      icon: KeyRound,
      badge: '3',
    },
    {
      to: '/cart',
      label: 'Shopping Cart',
      icon: ShoppingBag,
      badge: totalCount > 0 ? String(totalCount) : undefined,
    },
    {
      to: '/member/orders',
      label: 'Purchase History',
      icon: ShoppingBag,
    },
    {
      to: '/member/warranty',
      label: 'Returns & Warranty',
      icon: ShieldAlert,
    },
    {
      to: '/member/profile',
      label: 'Settings & Wallet',
      icon: UserCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex">
      {/* Top-up Simulation Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-primary-blue/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-base font-bold text-text-primary">Nạp số dư ví AIPro</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Select a top-up package to pay via VietQR instantly. Balance will be added to the account immediately.
            </p>
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[4, 8, 20].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmountUSD(amt)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    topUpAmountUSD === amt
                      ? 'bg-primary-blue/20 border-primary-blue text-white font-bold ring-1 ring-primary-blue'
                      : 'bg-canvas border-border-subtle text-text-secondary hover:border-primary-blue/50'
                  }`}
                >
                  <span className="block text-xs font-mono">${amt.toFixed(2)}</span>
                  <span className="text-[10px] text-text-muted mt-0.5 block">
                    Top up credit
                  </span>
                </button>
              ))}
            </div>
            <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle mb-5 flex items-center justify-between">
              <span className="text-xs text-text-secondary">Số tiền nạp:</span>
              <span className="font-mono text-base font-bold text-accent-cyan">
                ${topUpAmountUSD.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold hover:bg-surface-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTopUp}
                className="flex-1 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-lg shadow-primary-blue/20"
              >
                ⚡ Confirm Top Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface border-r border-border-subtle z-20">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border-subtle">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-blue to-accent-cyan flex items-center justify-center shadow-md">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-mono text-base font-bold tracking-tight text-white">
              AIPro<span className="text-accent-cyan">.dev</span>
            </span>
          </Link>
          <span className="px-2 py-0.5 rounded-md bg-primary-blue/15 text-accent-cyan text-[10px] font-bold uppercase tracking-wider font-mono">
            Member
          </span>
        </div>

        {/* User Quick Card in Sidebar */}
        <div className="p-4 m-3 rounded-xl bg-canvas border border-border-subtle">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-primary-blue/40"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-text-primary truncate">{user?.name || 'Alex Dev'}</h4>
              <span className="inline-flex items-center gap-1 text-[11px] text-accent-cyan font-medium">
                <Sparkles className="w-3 h-3" />
                <span>{user?.tier || 'VIP Dev'}</span>
              </span>
            </div>
          </div>

          {/* Wallet Balance box */}
          <div className="p-2.5 rounded-lg bg-surface border border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted block uppercase">Wallet Balance</span>
              <span className="font-mono text-xs font-bold text-status-success">
                {formatPrice(user?.balanceVND || 0, user?.balanceUSD || 0)}
              </span>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="p-1.5 rounded-md bg-primary-blue/10 hover:bg-primary-blue/20 text-primary-blue transition-colors"
              title="Nạp tiền"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/25'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-accent-cyan/20 text-accent-cyan text-[10px] font-bold">
                    {item.badge}
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
          >
            <Store className="w-4 h-4 text-accent-cyan" />
            <span>View Main Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-text-primary">
                Khu vực Thành viên <span className="text-text-muted font-normal">• AIPro Developer Hub</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Single-currency badge: USD only */}
            <span className="px-2.5 py-1 rounded-lg bg-canvas border border-border-subtle text-accent-cyan text-xs font-mono font-bold">
              USD $
            </span>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 rounded-xl bg-canvas hover:bg-surface-subtle border border-border-subtle hover:border-primary-blue text-text-secondary hover:text-text-primary transition-all group"
              title="Xem giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4 text-accent-cyan group-hover:scale-110 transition-transform" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-blue text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-[0_0_8px_rgba(0,102,255,0.6)] animate-pulse">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Quick Balance Button */}
            <button
              onClick={() => setShowTopUpModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-xs font-bold hover:bg-status-success/20 transition-all font-mono"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{formatPrice(user?.balanceVND || 0, user?.balanceUSD || 0)}</span>
              <span className="text-[10px] bg-status-success/20 px-1 rounded font-sans">+Nạp</span>
            </button>

            {/* User Dropdown Preview */}
            <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-primary-blue/40"
              />
              <span className="hidden md:inline text-xs font-semibold text-text-primary">
                {user?.name?.split(' ')[0] || 'Alex'}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm pt-16">
            <div className="bg-surface border-b border-border-subtle p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
                        isActive ? 'bg-primary-blue text-white' : 'text-text-secondary hover:bg-surface-subtle'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-accent-cyan/20 text-accent-cyan text-xs">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              <div className="pt-4 border-t border-border-subtle flex gap-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-canvas border border-border-subtle text-center text-xs font-semibold"
                >
                  Cửa hàng chính
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-status-error/15 text-status-error text-center text-xs font-semibold"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Child Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer />
    </div>
  );
};
