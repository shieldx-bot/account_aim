import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/hooks/useGsapContext';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollProgress — thin gradient bar pinned to the very top of the viewport.
 * scaleX is driven directly by ScrollTrigger progress (scrub), so it stays in
 * perfect sync with the scrollbar even during momentum/inertial scrolling.
 */
export const ScrollProgress: React.FC = () => {
  const barRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-primary-blue via-accent-cyan to-[#8B5CF6] shadow-[0_0_12px_rgba(0,212,255,0.25)]"
      style={{ transform: 'scaleX(0)' }}
    />
  );
};

interface HeroTimelineProps {
  /** Root element of the hero section; children are targeted via data attributes. */
  rootRef: React.RefObject<HTMLElement>;
}

/**
 * useHeroTimeline — staged entrance choreography for the above-the-fold hero.
 * Order follows international landing-page practice:
 *   announcement pill → headline (per-line) → subtitle → CTAs → terminal → stats
 * Each step overlaps the previous one (~90% of standard "cascade" timing).
 */
export function useHeroTimeline({ rootRef }: HeroTimelineProps) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      // Skip animation but make sure nothing is left hidden.
      gsap.set(root.querySelectorAll('[data-hero]'), { clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.1,
      });

      tl.from('[data-hero="pill"]', { y: -18, opacity: 0, duration: 0.5 })
        .from(
          '[data-hero="headline"] .hero-line',
          { y: 42, opacity: 0, duration: 0.75, stagger: 0.12, ease: 'power4.out' },
          '-=0.25',
        )
        .from('[data-hero="subtitle"]', { y: 20, opacity: 0, duration: 0.6 }, '-=0.45')
        .from('[data-hero="cta"] > *', { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.35')
        .from('[data-hero="terminal"]', { y: 48, opacity: 0, scale: 0.97, duration: 0.9 }, '-=0.3')
        .from('[data-hero="stats"] > *', { y: 12, opacity: 0, duration: 0.45, stagger: 0.08 }, '-=0.5');
    }, rootRef);

    return () => ctx.revert();
  }, [rootRef]);
}

/**
 * useHeroParallax — aurora blobs / photo layer drift at different speeds while
 * the user scrolls through the hero (classic depth cue, GPU-friendly: only
 * transform properties are animated).
 */
export function useHeroParallax({ rootRef }: HeroTimelineProps) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((layer) => {
        const speed = parseFloat(layer.dataset.parallax || '0.2');
        gsap.to(layer, {
          yPercent: speed * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [rootRef]);
}
