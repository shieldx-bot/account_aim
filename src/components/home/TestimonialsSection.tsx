import React from 'react';
import { Star, CheckCircle2, Quote, Sparkles } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Trần Đức Minh',
    role: 'Tech Lead @ Fintech Solution',
    company: 'Fintech HN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    product: 'Cursor Pro AI IDE (1 Năm)',
    content:
      'Cả team 15 lập trình viên của mình đều đang dùng Cursor Pro qua AIPro. Tiết kiệm hơn 50% chi phí so với tự cà thẻ cá nhân, gán trực tiếp vào email công ty nên không lo leak code hay bị ban session.',
    rating: 5,
    verified: true,
  },
  {
    name: 'Nguyễn Hoàng Long',
    role: 'Senior Full-stack Developer',
    company: 'Remote US Team',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    product: 'Claude 3.7 Sonnet Pro',
    content:
      'Ấn tượng nhất là tốc độ bàn giao: vừa quét VietQR xong là thông tin account đã hiện sẵn trong Vault. Từng bị mất Pro 1 lần lúc nửa đêm, bấm Bot RMA tự động cấp acc mới sau 15 giây mà không cần gọi support.',
    rating: 5,
    verified: true,
  },
  {
    name: 'Lê Thảo My',
    role: 'AI Engineer & Researcher',
    company: 'AI Lab Saigon',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    product: 'ChatGPT Plus & o3-mini',
    content:
      'Claude Sonnet và OpenAI o3-mini giúp mình đẩy nhanh tốc độ nghiên cứu thuật toán gấp 3 lần. Dịch vụ ở đây cực kỳ chuyên nghiệp và uy tín, support kỹ thuật am hiểu về tool dev.',
    rating: 5,
    verified: true,
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs font-mono font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real Feedback from Developer Community</span>
        </div>
<h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          12,400+ Engineers & Tech Teams Trust
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary">
          Điểm đánh giá trung bình 4.9/5 trên toàn bộ hệ thống đơn hàng đã hoàn tất.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="p-7 rounded-3xl bg-surface border border-border-subtle hover:border-primary-blue/30 transition-all flex flex-col justify-between shadow-xl relative group"
          >
            <div>
              {/* Star rating */}
              <div className="flex items-center gap-1 text-status-warning mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-status-warning" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 italic">
                &quot;{t.content}&quot;
              </p>
            </div>

            {/* Author details */}
            <div className="pt-4 border-t border-border-subtle flex items-center gap-3">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover border border-primary-blue/40"
              />
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-text-primary truncate">{t.name}</h4>
                  {t.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-text-muted block truncate">{t.role}</span>
                <span>Đã mua: {t.product}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
