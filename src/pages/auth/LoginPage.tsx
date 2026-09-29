import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAs, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/member/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(email, password);
      if (res.success) {
        // Redirection will be handled by useEffect
      } else {
        setErrorMessage(res.message || 'Email hoặc mật khẩu không chính xác.');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'member' | 'admin') => {
    loginAs(role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/member/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-blue/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-accent-cyan/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Top brand bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-blue to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-blue/25 group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono text-xl font-bold tracking-tight text-white">
            AIPro<span className="text-accent-cyan">.dev</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Đăng nhập hệ thống
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Quản lý tài khoản AI Pro, gia hạn tự động và giám sát bảo hành SLA 24/7.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Quick Demo Switcher Card */}
        <div className="mb-6 p-4 rounded-2xl bg-surface/80 border border-primary-blue/30 backdrop-blur-md shadow-xl shadow-primary-blue/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan">
              Truy cập nhanh chế độ Test / Demo
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickLogin('member')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-canvas hover:bg-canvas-subtle border border-border-subtle hover:border-primary-blue text-xs font-semibold text-text-primary transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5 text-primary-blue" />
              <span>Login Member</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-status-error/10 hover:bg-status-error/20 border border-status-error/30 text-xs font-semibold text-status-error transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-status-error" />
              <span>Login Admin</span>
            </button>
          </div>
        </div>

        {/* Main Login Form Card */}
        <div className="bg-surface/90 border border-border-subtle backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-error animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Địa chỉ Email
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@gmail.com hoặc admin@aipro.dev"
                  className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Mật khẩu
                </label>
                <a href="#forgot" className="text-xs text-primary-blue hover:text-accent-cyan transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-canvas border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border-subtle bg-canvas text-primary-blue focus:ring-primary-blue/20"
                />
                <span>Ghi nhớ phiên đăng nhập (30 ngày)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-sm font-bold shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Đăng nhập vào Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-subtle text-center">
            <p className="text-xs text-text-secondary">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-primary-blue hover:text-accent-cyan transition-colors">
                Đăng ký tài khoản mới ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Security pledge footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            <span>Mã hóa AES-256</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            <span>Cam kết bảo hành 1-1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
