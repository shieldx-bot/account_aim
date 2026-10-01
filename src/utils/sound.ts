/**
 * Subtle payment success chime (AIPRO-110 / Spec Trang 3).
 * Generated in-browser via WebAudio — no audio asset needed, zero network cost.
 */
export function playSuccessChime(): void {
  try {
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    // Two short ascending tones: E5 -> A5, soft sine with quick decay.
    const notes: Array<[number, number]> = [
      [659.25, 0],       // E5 at t=0
      [880.0, 0.14],     // A5 at t+140ms
    ];

    for (const [freq, startOffset] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    }

    // Auto-close after the chime finishes to free hardware resources.
    setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 900);
  } catch {
    // Sound is a nice-to-have; never break checkout if audio is unavailable/blocked.
  }
}
