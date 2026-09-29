import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export const MemberWarrantyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
            Chính sách Bảo hành &amp; Đổi trả Tự động
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Cam kết 100% thời gian bảo hành cho toàn bộ tài khoản AI Pro. Đổi tài khoản mới trong 30 giây.
          </p>
        </div>
        <Link
          to="/lookup"
          className="px-5 py-2.5 rounded-xl bg-status-error hover:bg-status-error/90 text-white text-xs font-bold shadow-lg shadow-status-error/25 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>Kích hoạt Bot Đổi Mới Ngay</span>
        </Link>
      </div>

      {/* SLA 99.9% Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface to-surface-subtle border border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-success/15 text-status-success flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Bảo hành 1-đổi-1</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Đổi mới lập tức nếu tài khoản bị mất quyền Pro, lỗi token hoặc sai mật khẩu.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 text-accent-cyan flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Xử lý tự động &lt; 30s</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Hệ thống Bot kiểm tra tự động và cấp phát tài khoản mới không cần chờ CSKH.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-blue/15 text-primary-blue flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Hoàn tiền 100%</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Nếu nhà cung cấp đóng dịch vụ hoặc không thể khắc phục trong vòng 24 giờ.
            </p>
          </div>
        </div>
      </div>

      {/* Past RMA History */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-text-primary mb-2">Nhật ký Đổi trả gần nhất của bạn</h3>
        <p className="text-xs text-text-secondary mb-5">Danh sách các yêu cầu đổi mới đã được Bot giải quyết thành công.</p>

        <div className="p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-accent-cyan">RMA-AI-99214</span>
              <span className="px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-[10px] font-bold">
                ✓ Đã hoàn tất đổi mới
              </span>
            </div>
            <p className="text-text-secondary font-sans text-xs">
              Sản phẩm: <strong>Cursor Pro AI IDE</strong> • Lý do: <em>Tài khoản bị nhà cung cấp revoke session</em>
            </p>
            <span className="text-[11px] text-text-muted">Thời gian xử lý bot: 12 giây</span>
          </div>

          <Link
            to="/lookup"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-semibold text-text-primary hover:border-primary-blue transition-colors text-center"
          >
            Xem chi tiết tra cứu
          </Link>
        </div>
      </div>
    </div>
  );
};
