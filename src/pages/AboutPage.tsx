import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Youtube,
  BadgeCheck,
  Lock,
  FileCheck2,
  Eye,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-24 font-sans">
      {/* ===== Hero: Founder Identity ===== */}
      <div className="rounded-2xl bg-surface border border-border-subtle p-8 sm:p-10">
        <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider block">
          Founder &amp; Operator — Minh Bạch Danh Tính
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-blue to-accent-cyan flex items-center justify-center text-3xl font-extrabold text-white shrink-0">
            JS
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary flex flex-wrap items-center gap-2">
              Jeff Su
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/30 text-status-success text-[11px] font-bold">
                <BadgeCheck className="w-3.5 h-3.5" />
                Đã xác minh danh tính
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Nhà sáng lập &amp; người vận hành trực tiếp AIPro.dev. Toàn bộ hệ thống,
              kho tài khoản và quy trình hoàn tiền đều do tôi cá nhân chịu trách nhiệm
              trước pháp luật và trước khách hàng.
            </p>
            <a
              href="https://www.youtube.com/@JeffSu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#FF0033]/10 text-[#FF4D6A] hover:bg-[#FF0033]/20 border border-[#FF0033]/30 text-xs font-semibold transition-all"
            >
              <Youtube className="w-4 h-4" />
              Kênh YouTube chính thức: @JeffSu
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ===== Transaction Safety Assurance ===== */}
      <h2 className="text-xl font-bold text-text-primary mt-12 mb-1 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-status-success" />
        Giao Dịch Của Bạn Được Tôi Đảm Bảo An Toàn
      </h2>
      <p className="text-xs text-text-muted mb-6">
      Website được sở hữu và điều hành bởi một cá nhân có danh tính công khai, kiểm chứng được qua kênh YouTube chính chủ.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-blue/10 text-primary-blue">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Chủ sở hữu chịu trách nhiệm pháp lý</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• Người đại diện: <strong className="text-text-primary">Jeff Su</strong> (Founder &amp; Operator)</li>
            <li>• Trách nhiệm: Chủ trì mọi khiếu nại, hoàn tiền &amp; nghĩa vụ thuế theo quy định.</li>
            <li>• Đầu mối liên hệ trực tiếp: <Link to="/terms?tab=privacy" className="text-accent-cyan hover:underline">legal@aipro.dev</Link></li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-success/10 text-status-success">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Danh tính kiểm chứng công khai</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• Bạn có thể xác minh tôi là ai trước khi xuống tiền:</li>
            <li>
              • YouTube chính chủ:{' '}
              <a href="https://www.youtube.com/@JeffSu" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline font-mono">
                youtube.com/@JeffSu
              </a>
            </li>
            <li>• Mọi nội dung quảng bá về AIPro.dev đều đăng tải công khai tại đây.</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Thanh toán mã hóa &amp; không giữ thẻ</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• Kết nối SSL/TLS 256-bit — ổ khóa bảo mật hiển thị trên trình duyệt.</li>
            <li>• Tiền đi qua cổng trung gian ngân hàng/Stripe — chúng tôi không lưu dữ liệu thẻ.</li>
            <li>• Đối soát đơn hàng minh bạch, tra cứu được tại{' '}
              <Link to="/lookup" className="text-accent-cyan hover:underline">/lookup</Link>.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-warning/10 text-status-warning">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Cam kết hoàn tiền 100% trong 48h</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• Không hài lòng trong 48 giờ đầu → hoàn 100% về tài khoản nguồn.</li>
            <li>• Xử lý bởi chính Founder, không đùn đẩy qua bot CSKH.</li>
            <li>• Chi tiết tại{' '}
              <Link to="/terms?tab=refund" className="text-accent-cyan hover:underline">Chính sách hoàn tiền</Link>.
            </li>
          </ul>
        </div>
      </div>

      {/* ===== Verification strip ===== */}
      <div className="mt-10 p-5 rounded-2xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
          <span>
            Website này được đảm bảo an toàn giao dịch bởi <strong className="text-text-primary">Jeff Su</strong> —
            đã công bố danh tính người chịu trách nhiệm theo chuẩn thương mại điện tử.
          </span>
        </div>
        <Link
          to="/terms?tab=privacy"
          className="px-4 py-2 rounded-xl bg-primary-blue text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Xem Trung Tâm Pháp Lý
        </Link>
      </div>
    </div>
  );
};
