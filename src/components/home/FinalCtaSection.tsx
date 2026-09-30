import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, ArrowRight, Terminal, Sparkles } from 'lucide-react';

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-primary-blue/20 via-surface to-accent-cyan/15 border border-primary-blue/40 shadow-2xl text-center">
        {/* Real photography backdrop (downloaded locally from Unsplash) */}
        <img
          src="/images/cta-team.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.12] saturate-[0.6]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-transparent to-background/70 pointer-events-none" />
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary-blue/25 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-accent-cyan/30 text-accent-cyan text-xs font-mono font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Activate Your Account Today</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Ready to double your programming speed?
          </h2>

          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Gain access to the world's most powerful AI models (Claude 3.7 Sonnet, OpenAI o3-mini, Cursor Pro) in under 30 seconds.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#catalog"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-sm font-bold shadow-xl shadow-primary-blue/30 hover:shadow-primary-blue/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Explore Pro Packages Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/lookup"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-surface hover:bg-canvas border border-border-subtle hover:border-primary-blue/50 text-text-secondary hover:text-text-primary text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4 text-accent-cyan" />
              <span>Order Lookup / Returns</span>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              <span>Lifetime 1-for-1 warranty</span>
            </span>
            <span>&bull;</span>
            <span>Instant delivery &lt; 30s via VietQR</span>
            <span>&bull;</span>
            <span>24/7 technical support</span>
          </div>
        </div>
      </div>
    </section>
  );
};
