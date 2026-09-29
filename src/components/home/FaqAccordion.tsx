import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Sau khi thanh toán xong, tôi nhận tài khoản bằng cách nào và trong bao lâu?',
    a: 'Ngay sau khi hệ thống nhận thanh toán (1.5 - 3s qua PayPal hoặc Thẻ Visa), bạn sẽ được chuyển hướng tự động đến "License Vault" trên website hiển thị toàn bộ Email, Mật khẩu, Token và Mã 2FA. Đồng thời, một bản sao lưu bảo mật sẽ được gửi thẳng vào Email của bạn trong vòng dưới 30 giây.',
  },
  {
    q: 'Gói "Nâng cấp chính chủ" và "Tài khoản cấp sẵn" khác nhau như thế nào?',
    a: '"Nâng cấp chính chủ" là kích hoạt gói Pro/Team trực tiếp trên Email cá nhân của bạn, giữ nguyên 100% lịch sử chat và dự án cũ. "Tài khoản cấp sẵn" là tài khoản tạo mới độc quyền (Private 1-user) bàn giao ngay trong 10 giây.',
  },
  {
    q: 'Chính sách bảo hành 1-đổi-1 tự động hoạt động như thế nào?',
    a: 'Nếu tài khoản gặp lỗi trong quá trình sử dụng, bạn chỉ cần vào mục "Tra cứu đơn hàng", chọn lý do sự cố và nhấn "⚡ Kích hoạt đổi mới tài khoản trong 60s". Hệ thống Bot sẽ tự động trích xuất tài khoản mới từ kho dự phòng và bàn giao ngay trên màn hình mà không cần chờ đợi nhân viên.',
  },
  {
    q: 'Hệ thống có thu thập hoặc lưu trữ mật khẩu cá nhân của tôi không?',
    a: 'Tuyệt đối không. AIPro.dev tuân thủ triết lý Zero Mandatory Sign-up. Bạn không cần tạo mật khẩu để mua hàng. Đối với gói nâng cấp chính chủ, chúng tôi chỉ gửi lời mời nâng cấp (Invite Link) vào hòm thư của bạn, hoàn toàn không yêu cầu cung cấp mật khẩu hòm thư.',
  },
  {
    q: 'Tôi có thể thanh toán bằng phương thức nào?',
    a: 'Chúng tôi hỗ trợ cổng thanh toán quốc tế PayPal an toàn hàng đầu thế giới: Bạn có thể thanh toán trực tiếp bằng Thẻ Visa, Mastercard, AMEX (qua cổng PayPal mà không cần tạo tài khoản PayPal), hoặc thanh toán qua Ví PayPal và trả góp PayPal Pay Later (0% Lãi suất).',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-text-primary">Câu Hỏi Thường Gặp Của Lập Trình Viên</h2>
        <p className="text-xs text-text-secondary mt-1">Minh bạch 100% về cơ chế bàn giao, bản quyền và cam kết SLA.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl bg-surface border border-border-subtle overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-elevated/40 transition-colors"
              >
                <span className="text-xs sm:text-sm font-semibold text-text-primary">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-accent-cyan' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs text-text-secondary leading-relaxed border-t border-border-subtle/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
