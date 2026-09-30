import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/hooks/useGsapContext';

const COMPANIES = [
  { name: 'VNG Corporation', tag: 'Tech Giant' },
  { name: 'FPT Software', tag: 'Global IT' },
  { name: 'Viettel Solutions', tag: 'Enterprise' },
  { name: 'One Mount Group', tag: 'Ecosystem' },
  { name: 'Grab Vietnam R&D', tag: 'Tech Unicorn' },
  { name: 'MoMo Fintech', tag: 'Payment' },
  { name: 'VNPT Digital', tag: 'Telecom' },
  { name: 'Shopee Engineering', tag: 'E-commerce' },
];

export const CompanyTrustMarquee: React.FC = () => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // GSAP ticker marquee — replaces the CSS `animate-marquee` so the strip
  // slows down (not freezes) on hover and fades at both edges via mask-image.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;

    const wrapWidth = () => track.scrollWidth / 2; // duplicated list → half = 1 loop
    const baseSpeed = 60; // px/s
    let currentSpeed = baseSpeed;
    let x = 0;
    let last = performance.now();

    const onEnter = () => { currentSpeed = baseSpeed * 0.3; };
    const onLeave = () => { currentSpeed = baseSpeed; };

    track.addEventListener('mouseenter', onEnter);
    track.addEventListener('mouseleave', onLeave);

    const tick = gsap.ticker.add((time) => {
      const dt = Math.min(time - last, 64) / 1000; // clamp tab-switch spikes
      last = time;
      x -= currentSpeed * dt;
      const w = wrapWidth();
      if (w > 0 && x <= -w) x += w;
      gsap.set(track, { x });
    });

    return () => {
      gsap.ticker.remove(tick);
      track.removeEventListener('mouseenter', onEnter);
      track.removeEventListener('mouseleave', onLeave);
      gsap.set(track, { clearProps: 'transform' });
    };
  }, []);

  return (
    <div className="w-full py-10 border-y border-border-subtle/60 bg-surface/30 backdrop-blur-sm overflow-hidden my-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted font-mono">
          Trusted by software engineers & Tech Leads at leading companies
        </p>
      </div>

      <div className="relative flex overflow-x-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {/* Infinite horizontal marquee driven by GSAP ticker */}
        <div ref={trackRef} className="flex whitespace-nowrap gap-8 items-center will-change-transform">
          {[...COMPANIES, ...COMPANIES].map((comp, idx) => (
            <div
              key={`${comp.name}-${idx}`}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-canvas/60 border border-border-subtle hover:border-primary-blue/40 transition-all cursor-default group"
            >
              <div className="w-2 h-2 rounded-full bg-accent-cyan/70 group-hover:bg-accent-cyan group-hover:scale-125 transition-all" />
              <span className="text-xs sm:text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors font-mono tracking-tight">
                {comp.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted font-sans">
                {comp.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
