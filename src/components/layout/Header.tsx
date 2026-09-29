import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Terminal,
  Shield,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  KeyRound,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';

export const Header: React.FC = () => {
  const { currency, setCurrency, formatPrice } = useApp();
  const { user, isAuthenticated, logout } = useAuth();
  const { openCart, totalCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isCheckout = location.pathname.startsWith('/checkout');

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full h-16 glass-nav transition-all">
      <div className="max-w-[1240px] h-full mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border-subtle group-hover:border-accent-cyan group-hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all">
            <span className="font-mono font-bold text-accent-cyan text-sm">&gt;_</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-lg tracking-tight text-text-primary group-hover:text-white flex items-center gap-1.5">
              AIPro<span className="text-primary-blue group-hover:text-accent-cyan transition-colors">.dev</span>
            </span>
          </div>
        </Link>

        {/* If on checkout page, show minimal security badge */}
        {isCheckout ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-status-success/30 text-status-success text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>SSL 256-bit Secure Checkout</span>
          </div>
        ) : (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
              <Link to="/products" className="hover:text-text-primary transition-colors">
                AI Accounts
              </Link>
              <Link to="/docs" className="hover:text-text-primary transition-colors">
                Setup Guides
              </Link>
              <Link to="/status" className="hover:text-text-primary transition-colors">
                System Status
              </Link>
              <Link to="/terms" className="hover:text-text-primary transition-colors">
                SLA Warranty
              </Link>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border-subtle text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setCurrency('VND')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    currency === 'VND'
                      ? 'bg-primary-blue text-white font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  VND
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    currency === 'USD'
                      ? 'bg-primary-blue text-white font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  USD
                </button>
              </div>

              {/* Order Lookup Ghost Button */}
              <Link
                to="/lookup"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-primary bg-surface hover:bg-elevated border border-border-subtle hover:border-border-focus rounded-lg transition-all"
              >
                <Search className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Order Lookup</span>
              </Link>

              {/* Shopping Cart Button with Dynamic Badge */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-primary-blue text-text-secondary hover:text-text-primary transition-all group"
                title="View cart"
              >
                <ShoppingBag className="w-4 h-4 text-accent-cyan group-hover:scale-110 transition-transform" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-blue text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-[0_0_8px_rgba(0,102,255,0.6)] animate-pulse">
                    {totalCount}
                  </span>
                )}
              </button>

              {/* Authentication Actions */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border-subtle transition-all"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover border border-primary-blue/40"
                    />
                    <div className="hidden sm:block text-left">
                      <span className="block text-xs font-bold text-text-primary leading-none truncate max-w-[100px]">
                        {user.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[10px] font-mono leading-none ${
                          user.role === 'admin' ? 'text-status-error font-bold' : 'text-accent-cyan'
                        }`}
                      >
                        {user.role === 'admin' ? 'ADMIN' : user.tier}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-border-subtle rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-border-subtle mb-1">
                        <span className="text-xs font-bold text-text-primary block truncate">{user.name}</span>
                        <span className="text-[11px] text-text-muted font-mono block truncate">{user.email}</span>
                        {user.role === 'member' && (
                          <div className="mt-1 text-[11px] font-mono text-status-success font-semibold">
                            Ví: {formatPrice(user.balanceVND, user.balanceUSD)}
                          </div>
                        )}
                      </div>

                      {user.role === 'admin' ? (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-status-error hover:bg-status-error/10 transition-colors"
                          >
                            <Terminal className="w-4 h-4" />
                            <span>Operator Dashboard</span>
                          </Link>
                          <Link
                            to="/admin/orders"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Transaction Reconciliation</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/member/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-accent-cyan hover:bg-primary-blue/10 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Member Portal</span>
                          </Link>
                          <Link
                            to="/member/subscriptions"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                            <span>My Accounts</span>
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-border-subtle" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary-blue hover:bg-primary-hover rounded-xl shadow-md shadow-primary-blue/25 transition-all"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer />
    </header>
  );
};
