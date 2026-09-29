import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, FileText, CheckCircle2, RefreshCw, Lock, Printer } from 'lucide-react';

type Tab = 'terms' | 'sla' | 'refund' | 'privacy';

export const LegalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) || 'terms';

  const setTab = (tab: Tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-24 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-border-subtle">
        <div>
          <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider block">
            Compliance &amp; Legal Center
          </span>
          <h1 className="text-3xl font-extrabold text-text-primary mt-1">
            Trung Tâm Pháp Lý, Cam Kết SLA &amp; Bảo Vệ Người Tiêu Dùng
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Quy định minh bạch nhằm bảo vệ quyền lợi lập trình viên và tuân thủ các chuẩn mực thanh toán quốc tế.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-2"
        >
          <Printer className="w-4 h-4 text-accent-cyan" />
          <span>In / Xuất PDF</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex rounded-xl bg-surface p-1.5 border border-border-subtle my-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('terms')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'terms' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          1. Điều Khoản Dịch Vụ
        </button>
        <button
          onClick={() => setTab('sla')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'sla' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          2. Cam Kết SLA 99.9%
        </button>
        <button
          onClick={() => setTab('refund')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'refund' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          3. Chính Sách Hoàn Tiền 100%
        </button>
        <button
          onClick={() => setTab('privacy')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'privacy' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          4. Bảo Mật Dữ Liệu
        </button>
      </div>

      {/* Content Area */}
      <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-xs sm:text-sm text-text-secondary leading-relaxed space-y-6">
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">1. Điều Khoản Cung Cấp Dịch Vụ Tài Khoản AI Pro</h2>
            <p>
              AIPro.dev cung cấp giải pháp phân phối bản quyền và kích hoạt tài khoản AI cao cấp (Cursor Pro, Claude Pro, ChatGPT Plus, GitHub Copilot...) cho kỹ sư phần mềm cá nhân và tổ chức.
            </p>
            <h3 className="text-base font-semibold text-text-primary pt-2">Quyền hạn và Nghĩa vụ:</h3>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Người dùng có quyền sở hữu trọn vẹn tài khoản trong suốt kỳ hạn đã mua (1, 3, 6 hoặc 12 tháng).</li>
              <li>Hệ thống cam kết không can thiệp, không đọc, không sao lưu bất kỳ đoạn mã nguồn hoặc lịch sử hội thoại nào của khách hàng.</li>
              <li>Tài khoản bàn giao là tài khoản độc quyền (Private 1-user), tuyệt đối không chia sẻ slot dùng chung làm suy giảm tốc độ request.</li>
            </ul>
          </div>
        )}

        {activeTab === 'sla' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">2. Cam Kết Mức Độ Dịch Vụ (Service Level Agreement - SLA 99.9%)</h2>
            <p>
              Chúng tôi hiểu thời gian của Lập trình viên là tài sản quý giá nhất. Vì vậy, AIPro.dev thiết lập các tiêu chuẩn SLA cao nhất:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <h4 className="font-bold text-text-primary text-xs">⚡ Bàn Giao Tự Động &lt; 30 Giây</h4>
                <p className="text-xs text-text-muted mt-1">100% đơn hàng sau khi ngân hàng xác nhận tiền sẽ xuất License Vault ngay lập tức.</p>
              </div>
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <h4 className="font-bold text-text-primary text-xs">🔄 Phục Hồi Lỗi Trong 60 Giây</h4>
                <p className="text-xs text-text-muted mt-1">Bot tự động 1-đổi-1 hoạt động 24/7/365 trích xuất tài khoản mới tinh từ kho dự phòng.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">3. Chính Sách Bảo Hành 1-Đổi-1 &amp; Hoàn Tiền 100%</h2>
            <p>
              Để bảo vệ quyền lợi tối đa cho khách hàng và tuân thủ các quy chuẩn bảo vệ người mua của các tổ chức thẻ quốc tế (Visa / Mastercard / Stripe):
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong className="text-text-primary">Bảo hành 1-đổi-1 tự động:</strong> Áp dụng trong suốt thời gian gói dịch vụ còn hiệu lực nếu tài khoản bị mất quyền Pro, bị lỗi session hoặc out workspace.</li>
              <li><strong className="text-text-primary">Hoàn tiền 100% không lý do:</strong> Trong vòng 48 giờ đầu tiên kể từ lúc mua, nếu khách hàng không hài lòng hoặc hệ thống không thể cung cấp tài khoản hoạt động ổn định, chúng tôi sẽ hoàn trả 100% số tiền về tài khoản ngân hàng nguồn trong vòng 2 giờ làm việc.</li>
            </ul>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">4. Chính Sách Bảo Mật Dữ Liệu &amp; Triết Lý Không Thu Thập</h2>
            <p>
              AIPro.dev xây dựng theo triết lý <strong className="text-text-primary">Zero Mandatory Sign-up</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Chúng tôi chỉ thu thập duy nhất địa chỉ Email của khách hàng để gửi hóa đơn và thông tin License Vault.</li>
              <li>Toàn bộ thông tin truyền tải trên website được mã hóa bằng tiêu chuẩn SSL 256-bit cao cấp nhất.</li>
              <li>Không bán, không chia sẻ và không theo dõi cookies của khách hàng cho mục đích quảng cáo bên thứ ba.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
