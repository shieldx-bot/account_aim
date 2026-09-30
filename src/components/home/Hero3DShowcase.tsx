import React, { useEffect, useRef, useState } from 'react';

/**
 * Hero3DShowcase — CSS-3D "license card deck" floating behind the terminal.
 * Pure CSS transform-3d (no three.js) → zero extra bundle weight.
 * Cards parallax subtly with pointer movement for a natural, alive feel.
 */
export const Hero3DShowcase: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -8, y: px * 10 });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const cards = [
    { label: 'CURSOR PRO', grad: 'from-[#0EA5E9]/25 to-[#0066FF]/10', rot: -14, tx: '-34%', ty: '-18%', z: 0, delay: '0s' },
    { label: 'CLAUDE 3.7', grad: 'from-[#D97757]/25 to-[#F59E0B]/10', rot: -4, tx: '-11%', ty: '-30%', z: 60, delay: '0.6s' },
    { label: 'CHATGPT PLUS', grad: 'from-[#10B981]/25 to-[#00F0FF]/10', rot: 7, tx: '14%', ty: '-22%', z: 30, delay: '1.2s' },
    { label: 'COPILOT', grad: 'from-[#8B5CF6]/25 to-[#0066FF]/10', rot: 16, tx: '36%', ty: '-10%', z: 10, delay: '1.8s' },
  ];

  return (
    <div
      ref={sceneRef}
      className="pointer-events-none absolute inset-x-0 top-2 h-[420px] [perspective:1200px] overflow-hidden -z-10 hidden md:block"
      aria-hidden="true"
    >
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            className="absolute left-1/2 top-1/2 w-[190px] h-[118px] rounded-2xl border border-white/10 bg-gradient-to-br backdrop-blur-sm animate-heroFloat shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
            style={{
              transform: `translate(${c.tx}, ${c.ty}) translateZ(${c.z}px) rotate(${c.rot}deg)`,
              animationDelay: c.delay,
              backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.04), transparent)`,
            }}
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.grad} opacity-70`} />
            <div className="relative p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase">{c.label}</span>
                <span className="w-6 h-4 rounded bg-gradient-to-br from-accent-cyan/40 to-primary-blue/40 border border-white/20" />
              </div>
              <div>
                <div className="font-mono text-[10px] text-white/40 tracking-wider">•••• •••• •••• 4290</div>
                <div className="mt-1 text-[9px] font-semibold text-accent-cyan/80">PRO · AUTO-RENEW ON</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
