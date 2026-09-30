import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Gift, Rocket } from 'lucide-react';
import { PromoBackdrop } from './PromoBackdrop';

interface PromoSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
}

const SLIDES: PromoSlide[] = [
  {
    id: 'flash',
    icon: <Flame className="w-5 h-5" />,
    title: 'FLASH SALE — Cursor Pro giảm 35% gói 12 tháng',
    subtitle: 'Áp dụng đến hết Chủ nhật. Kho thực tế hiển thị realtime, hết là hết.',
    cta: 'Săn deal ngay',
    href: '#catalog',
    gradient: 'from-[#EF4444]/20 via-[#F59E0B]/10 to-transparent',
  },
  {
    id: 'combo',
    icon: <Gift className="w-5 h-5" />,
    title: 'Combo Engineer: Claude 3.7 + Copilot — tặng 2 tuần dùng thử',
    subtitle: 'Mua gói 6 tháng combo, nhận thêm 14 ngày miễn phí tính từ ngày kích hoạt.',
    cta: 'Xem combo',
    href: '#catalog',
    gradient: 'from-[#8B5CF6]/20 via-[#0066FF]/10 to-transparent',
  },
  {
    id: 'referral',
    icon: <Rocket className="w-5 h-5" />,
    title: 'Giới thiệu bạn dev — nhận 100.000đ/lượt vào ví AI Pro',
    subtitle: 'Tiền thật, rút thật, cộng ngay khi bạn bè hoàn tất đơn đầu tiên.',
    cta: 'Nhận mã giới thiệu',
    href: '#calculator',
    gradient: 'from-[#00F0FF]/15 via-[#10B981]/10 to-transparent',
  },
];

export const PromoCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-4">
      <div
        className="relative rounded-2xl border border-border-subtle bg-surface overflow-hidden group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map((s) => (
            <div key={s.id} className="min-w-full relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
              <PromoBackdrop slideId={s.id} />
              <div className="relative px-5 py-4 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="p-2 rounded-xl bg-elevated border border-border-subtle text-accent-cyan">{s.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{s.title}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{s.subtitle}</p>
                  </div>
                </div>
                <a
                  href={s.href}
                  className="sm:ml-auto shrink-0 self-start sm:self-center px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-semibold transition-colors"
                >
                  {s.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          type="button"
          onClick={prev}
          aria-label="Promo trước"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Promo sau"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Chuyển tới promo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? 'w-5 bg-accent-cyan' : 'w-1.5 bg-white/25 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
