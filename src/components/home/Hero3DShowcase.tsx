import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/hooks/useGsapContext';

/**
 * Hero3DShowcase — GSAP-driven "license card deck" floating behind the terminal.
 * Upgrade path: CSS keyframe float → GSAP 3D timeline (rotateY deal-splash +
 * staggered yoyo float) and rAF-throttled pointer tilt via gsap.quickTo()
 * (international practice: transform-only animation, single ticker, no setState
 * per mousemove → zero React re-renders while animating).
 */
export const Hero3DShowcase: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Pointer tilt — quickTo tweens interpolate toward the target each frame,
  // giving the deck inertia instead of a hard 1:1 follow.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || prefersReducedMotion()) return;
    const qx = gsap.quickTo(stageRef.current, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const qy = gsap.quickTo(stageRef.current, 'rotationX', { duration: 0.6, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      qx(px * 14);
      qy(py * -10);
    };
    const onLeave = () => { qx(0); qy(0); };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Entrance choreography + perpetual float (GSAP core only — no plugins needed).
  useLayoutEffect(() => {
    const cards = cardsRef.current?.children;
    if (!cards || cards.length === 0 || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        opacity: 0,
        rotationY: -70,
        z: -260,
        y: 60,
        duration: 1.1,
        ease: 'back.out(1.4)',
        stagger: 0.14,
        delay: 0.35,
        clearProps: 'opacity,rotationY,z,y',
      });
      // Independent yoyo floats so cards never sync up (organic motion rule #1).
      Array.from(cards).forEach((card, i) => {
        gsap.to(card as HTMLElement, {
          y: '-=14',
          duration: 2.4 + i * 0.45,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.6 + i * 0.3,
        });
      });
    }, sceneRef);
    return () => ctx.revert();
  }, []);

  const cards = [
    { label: 'CURSOR PRO', grad: 'from-[#0EA5E9]/25 to-[#0066FF]/10', rot: -14, tx: '-34%', ty: '-18%', z: 0, delay: '0s' },
    { label: 'CLAUDE 3.7', grad: 'from-[#D97757]/25 to-[#F59E0B]/10', rot: -4, tx: '-11%', ty: '-30%', z: 60, delay: '0.6s' },
    { label: 'CHATGPT PLUS', grad: 'from-[#10B981]/25 to-[#00D4FF]/14', rot: 7, tx: '14%', ty: '-22%', z: 30, delay: '1.2s' },
    { label: 'COPILOT', grad: 'from-[#8B5CF6]/25 to-[#0066FF]/10', rot: 16, tx: '36%', ty: '-10%', z: 10, delay: '1.8s' },
  ];

  return (
    <div
      ref={sceneRef}
      className="pointer-events-none absolute inset-x-0 top-2 h-[420px] [perspective:1200px] overflow-hidden -z-10 hidden md:block"
      aria-hidden="true"
    >
      <div
        ref={stageRef}
        className="relative w-full h-full [transform-style:preserve-3d] will-change-transform"
      >
        <div ref={cardsRef} className="contents">
        {cards.map((c) => (
          <div
            key={c.label}
            className="absolute left-1/2 top-1/2 w-[190px] h-[118px] rounded-2xl border border-border-subtle bg-gradient-to-br backdrop-blur-sm shadow-[0_13px_27px_-5px_rgba(50,50,93,0.2),0_8px_16px_-8px_rgba(0,0,0,0.14)] will-change-transform"
            style={{
              transform: `translate(${c.tx}, ${c.ty}) translateZ(${c.z}px) rotate(${c.rot}deg)`,
              backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(246,249,252,0.7))`,
            }}
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.grad} opacity-70`} />
            <div className="relative p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-widest text-text-muted uppercase">{c.label}</span>
                <span className="w-6 h-4 rounded bg-gradient-to-br from-[#00D4FF]/50 to-[#635BFF]/50 border border-white/60" />
              </div>
              <div>
                <div className="font-mono text-[10px] text-text-muted/70 tracking-wider">•••• •••• •••• 4290</div>
                <div className="mt-1 text-[9px] font-semibold text-[#0E7490]">PRO · AUTO-RENEW ON</div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};
