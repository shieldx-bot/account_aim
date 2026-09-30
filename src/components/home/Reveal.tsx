import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/hooks/useGsapContext';

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollReveal — kept for backward compatibility with any consumer that
 * only needs the IntersectionObserver-style "visible once" flag.
 * Now powered by a ScrollTrigger `once` trigger so the whole landing uses
 * one animation engine (GSAP) instead of two competing systems.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = React.useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: `top ${Math.round((1 - threshold) * 100)}%`,
      once: true,
      onEnter: () => setVisible(true),
    });
    return () => st.kill();
  }, [threshold]);

  return { ref, visible };
}

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Direction the content travels in from. */
  from?: 'up' | 'down' | 'left' | 'right' | 'scale';
  /** Travel distance in px (ignored for `scale`). */
  distance?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Reveal — GSAP + ScrollTrigger entrance wrapper (international standard:
 * power3.out easing, ~0.8s duration, stagger-friendly, reduced-motion aware).
 *
 * The element is hidden via `gsap.set` (JS, not CSS class) so users with JS
 * disabled still see content after SSR-less fallback, and there is never a
 * flash-of-hidden-content because hiding happens in useLayoutEffect — before
 * the browser paints.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
  from = 'up',
  distance = 32,
  as = 'div',
}) => {
  const innerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { clearProps: 'all' });
      return;
    }

    const fromVars: gsap.TweenVars =
      from === 'up'
        ? { y: distance }
        : from === 'down'
          ? { y: -distance }
          : from === 'left'
            ? { x: distance }
            : from === 'right'
              ? { x: -distance }
              : { scale: 0.94 };

    gsap.set(el, { opacity: 0, ...fromVars });

    const ctx = gsap.context(() => {
      gsap.to(el, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.85,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, [delay, from, distance]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={innerRef} className={`will-change-transform ${className}`}>
      {children}
    </Tag>
  );
};
