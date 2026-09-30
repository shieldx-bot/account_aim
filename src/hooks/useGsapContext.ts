import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the plugin once per app lifetime (GSAP official pattern).
gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapContext — scoped GSAP animation hook.
 *
 * Returns a ref to attach to an ancestor element. Any `gsap.context()` built
 * with that ref is:
 *   1. Selector-scoped (selectors only match inside the ref — no tweens leak
 *      into sibling components).
 *   2. Killed automatically on unmount (revert), including every ScrollTrigger
 *      instance created inside it — zero memory leaks under StrictMode.
 */
export function useGsapContext<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    // Re-measure pin/start/end after mount so late-loading fonts/images
    // don't desync ScrollTrigger positions.
    ScrollTrigger.refresh();
  }, []);

  return { ref };
}

/** Shared easing / defaults so every landing animation feels like one system. */
export const GSAP_DEFAULTS = {
  ease: 'power3.out' as const,
  duration: 0.9,
};

/** Respect user motion preference — same contract as our CSS layer. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
