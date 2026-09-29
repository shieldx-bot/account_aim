import React from 'react';
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Lock,
  Cpu,
  Server,
  Layers,
  Sparkles,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

export const BentoFeaturesSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/30 text-accent-cyan text-xs font-mono font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hạ Tầng Cung Ứng Chuẩn Enterprise</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Vì sao các kỹ sư hàng đầu chọn AIPro thay vì acc trôi nổi?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary">
          Kiến trúc phân phối license tự động loại bỏ 100% rủi ro bị khóa tài khoản, rò rỉ mã nguồn và gián đoạn công việc.
        </p>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Zero Ban Risk Engine (Span 2) */}
        <div className="md:col-span-2 p-7 rounded-3xl bg-surface border border-border-subtle hover:border-primary-blue/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-blue/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary-blue/20 transition-all" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-blue/15 text-primary-blue flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                0% Rủi Ro Khóa Tài Khoản
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                Độc lập Session &amp; Thanh toán Doanh nghiệp Chuẩn Chỉ
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 max-w-xl">
            Không sử dụng thẻ hack (BIN/CC chùa) hay tài khoản crack lậu. Toàn bộ license Cursor Pro, Claude và ChatGPT được đăng ký trực tiếp qua cổng thanh toán pháp nhân đối tác với IP và hóa đơn minh bạch.
          </p>

          {/* Interactive Visual Element: Clean Security Terminal */}
          <div className="p-3.5 rounded-2xl bg-canvas border border-border-subtle font-mono text-xs text-text-muted">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle text-[11px]">
              <span className="text-status-success flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Security Sandbox Verified</span>
              </span>
              <span className="text-text-muted">AES-256 GCM</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-text-secondary">
                &gt; Verifying session token integrity... <span className="text-status-success font-bold">[100% SECURE]</span>
              </div>
              <div className="text-text-secondary">
                &gt; Provider: Anthropic &amp; Cursor Tier 1 API Gateway Verified
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 30-Second Webhook Fulfillment Bot (Span 1) */}
        <div className="p-7 rounded-3xl bg-surface border border-border-subtle hover:border-accent-cyan/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 text-accent-cyan flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
            Tự Động 100%
          </span>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            Giao License &lt; 30 Giây
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            Webhook ngân hàng MBBank quét giao dịch 1.5s/lần. Tiền vào là hệ thống tự động gán quyền và mở Vault bàn giao ngay trên màn hình.
          </p>
          <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between font-mono text-[11px] text-text-muted">
            <span>Latency trung bình:</span>
            <span className="text-status-success font-bold">14.2 giây</span>
          </div>
        </div>

        {/* Card 3: Self-Service RMA Bot (Span 1) */}
        <div className="p-7 rounded-3xl bg-surface border border-border-subtle hover:border-status-error/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-status-error/15 text-status-error flex items-center justify-center mb-4">
            <RefreshCw className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-status-error uppercase tracking-wider">
            Bảo Hành 1-Đổi-1 Tức Thì
          </span>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            Bot Đổi Trả Tự Động 24/7
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            Không cần chờ CSKH trả lời Zalo. Nếu tài khoản mất Pro hay lỗi mật khẩu, chỉ cần nhập mã đơn hàng là Bot tự chẩn đoán và cấp tài khoản mới trong 30s.
          </p>
          <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between font-mono text-[11px] text-text-muted">
            <span>Tỷ lệ tự giải quyết:</span>
            <span className="text-accent-cyan font-bold">96.8%</span>
          </div>
        </div>

        {/* Card 4: Enterprise Multi-Device & Privacy (Span 2) */}
        <div className="md:col-span-2 p-7 rounded-3xl bg-surface border border-border-subtle hover:border-primary-blue/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-status-success/15 text-status-success flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-status-success uppercase tracking-wider">
                Bảo Mật Mã Nguồn Tuyệt Đối
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                Gán Quyền Trên Email Chính Chủ Công Ty
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 max-w-xl">
            Tự do liên kết tài khoản AI vào email công ty hoặc email cá nhân có sẵn. Bạn không phải dùng chung profile hay lịch sử chat với người khác, bảo vệ trọn vẹn bí mật kinh doanh và source code của dự án.
          </p>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-center">
              <span className="text-[10px] text-text-muted block">Lịch sử chat</span>
              <span className="text-status-success font-bold">100% Private</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-center">
              <span className="text-[10px] text-text-muted block">Thiết bị hỗ trợ</span>
              <span className="text-accent-cyan font-bold">Mac / Win / Linux</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-center">
              <span className="text-[10px] text-text-muted block">Chính sách SLA</span>
              <span className="text-primary-blue font-bold">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
