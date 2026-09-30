import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Gift,
  Terminal,
  Check,
} from 'lucide-react';
import { UserRole } from '@/types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/member/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (role === 'admin' && !adminCode.trim()) {
      setErrorMessage('Vui lòng nhập Mã Ủy Quyền Quản Trị Viên.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(name, email, password, role, adminCode);
      if (res.success) {
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/member/dashboard');
        }
      } else {
        setErrorMessage(res.message || 'Đăng ký không thành công.');
      }
    } catch {
      setErrorMessage('Có lỗi xảy ra trong quá trình đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-primary-blue/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[300px] bg-accent-cyan/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
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
          Tạo tài khoản mới
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Tặng ngay <span className="text-status-success font-semibold">$2</span> vào số dư ví cho thành viên mới!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-surface/90 border border-border-subtle backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-error animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Loại tài khoản
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'member'
                      ? 'bg-primary-blue/15 border-primary-blue text-white ring-1 ring-primary-blue'
                      : 'bg-canvas border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {role === 'member' && <Check className="w-3.5 h-3.5 text-accent-cyan" />}
                  <span>Thành viên Developer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'admin'
                      ? 'bg-status-error/15 border-status-error text-status-error ring-1 ring-status-error'
                      : 'bg-canvas border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {role === 'admin' && <Check className="w-3.5 h-3.5 text-status-error" />}
                  <span>Quản trị viên (Admin)</span>
                </button>
              </div>
            </div>

            {/* Admin Security Passcode field if admin chosen */}
            {role === 'admin' && (
              <div className="p-3 rounded-xl bg-status-error/5 border border-status-error/30">
                <label className="block text-[11px] font-semibold text-status-error uppercase mb-1">
                  Mã Ủy Quyền Quản Trị Viên (Root Key)
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Nhập mã ủy quyền quản trị viên"
                  className="w-full px-3 py-2 bg-canvas border border-status-error/40 rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-status-error"
                />
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Họ và Tên
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
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
                  placeholder="developer@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Xác nhận Mật khẩu
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-2 text-xs text-status-success">
              <Gift className="w-4 h-4 flex-shrink-0" />
              <span>Nhận ngay $2 nạp sẵn vào số dư tài khoản khi đăng ký thành công.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-sm font-bold shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Hoàn tất Đăng ký</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-subtle text-center">
            <p className="text-xs text-text-secondary">
              Đã có tài khoản AIPro?{' '}
              <Link to="/login" className="font-semibold text-primary-blue hover:text-accent-cyan transition-colors">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
