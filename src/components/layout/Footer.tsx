import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Activity, MessageSquare, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface border-t border-border-subtle mt-20 text-xs text-text-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        {/* Top Guarantee Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 mb-10 border-b border-border-subtle/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-success/10 text-status-success">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Bàn Giao Tức Thì &lt; 30s</h4>
              <p className="text-text-muted mt-0.5">Tự động xuất License Vault và gửi email ngay khi nhận thanh toán.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-blue/10 text-primary-blue">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Bảo Hành 1-Đổi-1 Tự Động</h4>
              <p className="text-text-muted mt-0.5">Tự phục hồi tài khoản 60 giây không cần chờ nhân viên CSKH.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent-cyan/10 text-accent-cyan">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Cam Kết Uptime 99.9%</h4>
              <p className="text-text-muted mt-0.5">Kho tài khoản chính hãng ổn định cao, bảo mật mã hóa 256-bit.</p>
            </div>
          </div>
        </div>

        {/* Links Navigation Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Dịch Vụ AI</h5>
            <ul className="space-y-2">
              <li><Link to="/product/cursor-pro" className="hover:text-text-primary transition-colors">Cursor Pro 1-3 Tháng</Link></li>
              <li><Link to="/product/claude-pro" className="hover:text-text-primary transition-colors">Claude Pro Sonnet 3.7</Link></li>
              <li><Link to="/product/chatgpt-plus" className="hover:text-text-primary transition-colors">ChatGPT Plus GPT-4.5</Link></li>
              <li><Link to="/product/github-copilot" className="hover:text-text-primary transition-colors">GitHub Copilot Pro</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Tự Phục Vụ &amp; Tra Cứu</h5>
            <ul className="space-y-2">
              <li><Link to="/lookup" className="hover:text-text-primary transition-colors">Tra cứu đơn hàng qua OTP</Link></li>
              <li><Link to="/lookup" className="hover:text-text-primary transition-colors">Trung tâm bảo hành tự động</Link></li>
              <li><Link to="/docs" className="hover:text-text-primary transition-colors">Hướng dẫn kích hoạt IDE</Link></li>
              <li><Link to="/status" className="hover:text-text-primary transition-colors flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>Live System Status</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Chính Sách &amp; Pháp Lý</h5>
            <ul className="space-y-2">
              <li><Link to="/terms?tab=terms" className="hover:text-text-primary transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link to="/terms?tab=sla" className="hover:text-text-primary transition-colors">Cam kết chất lượng SLA 99.9%</Link></li>
              <li><Link to="/terms?tab=refund" className="hover:text-text-primary transition-colors">Chính sách bảo hành &amp; hoàn tiền</Link></li>
              <li><Link to="/terms?tab=privacy" className="hover:text-text-primary transition-colors">Chính sách bảo mật thông tin</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Hỗ Trợ Kỹ Thuật</h5>
            <p className="text-text-muted mb-3 leading-relaxed">Đội ngũ kỹ thuật viên trực tuyến 24/7 qua Telegram chuyên sâu cho dev.</p>
            <a
              href="https://t.me/aipro_support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 border border-[#229ED9]/30 font-medium transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kênh Telegram 24/7</span>
            </a>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-border-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-text-secondary">AIPro.dev</span>
            <span>&copy; 2026. Chuẩn thiết kế One-Way Corridor UX cho Lập trình viên.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/status" className="hover:text-text-primary transition-colors">Uptime 99.98%</Link>
            <span>&bull;</span>
            <Link to="/terms?tab=privacy" className="hover:text-text-primary transition-colors">No Cookies Spying</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
