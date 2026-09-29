import React from 'react';
import { Check, X, ShieldAlert, Sparkles, ShieldCheck } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    feature: 'Phương thức cấp phát bản quyền',
    aipro: 'Gán trực tiếp vào Email chính chủ hoặc cấp acc riêng 100%',
    blackMarket: 'Chia sẻ chung 1 tài khoản với 5 - 10 người lạ',
    aiproHighlight: true,
  },
  {
    feature: 'Tốc độ bàn giao sau thanh toán',
    aipro: 'Tự động trong < 30 giây qua Webhook VietQR MBBank',
    blackMarket: 'Chờ seller trả lời tin nhắn từ 2 đến 24 giờ',
    aiproHighlight: true,
  },
  {
    feature: 'Quy trình xử lý sự cố & bảo hành',
    aipro: 'Bot 1-đổi-1 tự động 24/7, cấp acc mới trong 30s',
    blackMarket: 'Hứa hẹn bảo hành nhưng thường bị block/chặn liên lạc',
    aiproHighlight: true,
  },
  {
    feature: 'Bảo mật Source Code & Lịch sử chat',
    aipro: 'Cách ly session 100%, không bị đọc trộm mã nguồn dự án',
    blackMarket: 'Mọi người dùng chung đều thấy code và chat history của nhau',
    aiproHighlight: true,
  },
  {
    feature: 'Nguồn gốc thanh toán & Rủi ro khóa nick',
    aipro: 'Thẻ doanh nghiệp hợp lệ, 0% rủi ro bị AI provider ban',
    blackMarket: 'Thẻ hack/lậu (BIN chùa), nguy cơ bị khóa tài khoản vĩnh viễn',
    aiproHighlight: true,
  },
  {
    feature: 'Phương thức thanh toán & Hóa đơn',
    aipro: 'Cổng quốc tế PayPal, Thẻ Visa / Mastercard, xuất biên lai JSON/PDF',
    blackMarket: 'Chuyển khoản cá nhân không giấy tờ hay bằng chứng',
    aiproHighlight: true,
  },
];

export const ComparisonTableSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Bảo Vệ Tài Nguyên &amp; Uy Tín Của Bạn</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          So sánh: AIPro.dev so với mua trôi nổi trên mạng
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary">
          Tại sao việc tiết kiệm vài chục nghìn ở chợ đen có thể khiến bạn mất toàn bộ mã nguồn dự án và bị khóa thiết bị?
        </p>
      </div>

      {/* Comparison Matrix Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="py-5 px-6 font-mono text-xs uppercase text-text-muted w-1/3">
                  Tiêu chí đối soát
                </th>
                <th className="py-5 px-6 bg-primary-blue/10 border-x border-primary-blue/30 w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm sm:text-base text-accent-cyan">
                      AIPro<span className="text-white">.dev</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-blue text-white text-[10px] font-bold">
                      Khuyên Dùng
                    </span>
                  </div>
                </th>
                <th className="py-5 px-6 font-mono text-xs uppercase text-text-muted w-1/3">
                  Chợ Đen / Group Facebook
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-canvas/30 transition-colors">
                  <td className="py-4 px-6 font-semibold text-text-primary font-sans">
                    {row.feature}
                  </td>

                  {/* AIPro column */}
                  <td className="py-4 px-6 bg-primary-blue/5 border-x border-primary-blue/20 text-text-primary font-medium">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-status-success/20 text-status-success flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{row.aipro}</span>
                    </div>
                  </td>

                  {/* Black Market column */}
                  <td className="py-4 px-6 text-text-muted">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-status-error/20 text-status-error flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{row.blackMarket}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
