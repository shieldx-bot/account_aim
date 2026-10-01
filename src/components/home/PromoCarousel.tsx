import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Flame, Gift, Rocket } from 'lucide-react';
import { prefersReducedMotion } from '@/hooks/useGsapContext';
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
    title: 'FLASH SALE — Cursor Pro 35% off on the 12-month plan',
    subtitle: 'Ends this Sunday. Live warehouse stock, once it\'s gone it\'s gone.',
    cta: 'Grab the deal',
    href: '#catalog',
    gradient: 'from-[#EF4444]/20 via-[#F59E0B]/10 to-transparent',
  },
  {
    id: 'combo',
    icon: <Gift className="w-5 h-5" />,
    title: 'Engineer Combo: Claude 3.7 + Copilot — 2-week free trial included',
    subtitle: 'Buy the 6-month combo and get 14 extra days free, counted from activation day.',
    cta: 'View the combo',
    href: '#catalog',
    gradient: 'from-[#8B5CF6]/20 via-[#635BFF]/10 to-transparent',
  },
  {
    id: 'referral',
    icon: <Rocket className="w-5 h-5" />,
    title: 'Refer a fellow dev — earn $4 per referral into your AgentLab wallet',
    subtitle: 'Real money, real withdrawals, credited as soon as your friend completes their first order.',
    cta: 'Get my referral code',
    href: '#calculator',
    gradient: 'from-[#00D4FF]/15 via-[#10B981]/10 to-transparent',
  },
];

export const PromoCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  // GSAP slide transition: spring-like power3.out with a subtle content lift,
  // replacing the plain CSS translateX tween.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    gsap.to(track, { xPercent: -index * 100, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
  }, [index]);

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
        <div ref={trackRef} className="flex will-change-transform" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map((s) => (
            <div key={s.id} className="min-w-full relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
              <PromoBackdrop slideId={s.id} />
              <div data-promo-content className="relative px-5 py-4 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
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
          aria-label="Previous promo"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-elevated/90 border border-border-subtle text-text-secondary hover:text-primary-blue shadow-card-rest opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next promo"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-elevated/90 border border-border-subtle text-text-secondary hover:text-primary-blue shadow-card-rest opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to promo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? 'w-5 bg-accent-cyan' : 'w-1.5 bg-text-primary/20 hover:bg-text-primary/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
