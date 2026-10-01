import React from 'react';
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Lock,
  Cpu,
  Server,
  Layers,
  Sparkles,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

export const BentoFeaturesSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div data-section-header className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/30 text-accent-cyan text-xs font-mono font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Enterprise-Grade Supply Infrastructure</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Why Top Engineers Choose AgentLab Over Floating Accounts?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary">
          Automated license distribution architecture eliminates 100% risk of account bans, source code leaks, and workflow disruption.
        </p>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Zero Ban Risk Engine (Span 2) */}
        <div className="md:col-span-2 p-7 rounded-3xl bg-surface border border-border-subtle hover:border-primary-blue/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-blue/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary-blue/20 transition-all" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-blue/15 text-primary-blue flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
<span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                0% Account Ban Risk
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                Independent Sessions & Enterprise-Standard Payment
              </h3>
            </div>
          </div>

<p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 max-w-xl">
              No cloned BIN/CC cards or cracked recycled accounts. All Cursor Pro, Claude and ChatGPT licenses are registered directly via partner enterprise payment gateways with transparent IP and invoicing.
            </p>

          {/* Interactive Visual Element: Clean Security Terminal */}
          <div className="p-3.5 rounded-2xl bg-canvas border border-border-subtle font-mono text-xs text-text-muted">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle text-[11px]">
              <span className="text-status-success flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Security Sandbox Verified</span>
              </span>
              <span className="text-text-muted">AES-256 GCM</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-text-secondary">
                &gt; Verifying session token integrity... <span className="text-status-success font-bold">[100% SECURE]</span>
              </div>
              <div className="text-text-secondary">
                &gt; Provider: Anthropic &amp; Cursor Tier 1 API Gateway Verified
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 30-Second Webhook Fulfillment Bot (Span 1) */}
        <div className="p-7 rounded-3xl bg-surface border border-border-subtle hover:border-accent-cyan/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 text-accent-cyan flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
            Fully Automatic
          </span>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            License Delivery &lt; 30 Seconds
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            MBBank webhook scans transactions every 1.5s. Once payment received, the system auto-grants access and opens the Vault delivery on screen.
          </p>
          <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between font-mono text-[11px] text-text-muted">
            <span>Average latency:</span>
            <span className="text-status-success font-bold">14.2 seconds</span>
          </div>
        </div>

        {/* Card 3: Self-Service RMA Bot (Span 1) */}
        <div className="p-7 rounded-3xl bg-surface border border-border-subtle hover:border-status-error/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-status-error/15 text-status-error flex items-center justify-center mb-4">
            <RefreshCw className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-status-error uppercase tracking-wider">
            Instant 1-for-1 Warranty
          </span>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            24/7 Auto RMA Bot
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            No waiting for CSKH on Zalo. If account loses Pro or has password issues, just enter order code and Bot auto-diagnoses and issues new account in 30s.
          </p>
          <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between font-mono text-[11px] text-text-muted">
            <span>Self-service resolution rate:</span>
            <span className="text-accent-cyan font-bold">96.8%</span>
          </div>
        </div>

        {/* Card 4: Enterprise Multi-Device & Privacy (Span 2) */}
        <div className="md:col-span-2 p-7 rounded-3xl bg-surface border border-border-subtle hover:border-primary-blue/40 transition-all relative overflow-hidden group shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-status-success/15 text-status-success flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-status-success uppercase tracking-wider">
                Absolute Source Code Security
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                Assign Permissions on Company-Owned Email
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 max-w-xl">
            Link your AI accounts freely to your company email or an existing personal email. You never share a profile or chat history with anyone else, fully protecting your trade secrets and your project's source code.
          </p>

          {/* Real workspace photography (downloaded locally from Unsplash) */}
          <div className="relative mt-2 mb-4 rounded-2xl overflow-hidden border border-border-subtle group/img">
            <img
              src="/images/bento-workspace.jpg"
              alt="Engineer's workstation with multiple code monitors"
              loading="lazy"
              decoding="async"
              className="w-full h-40 sm:h-48 object-cover opacity-80 saturate-[0.75] transition-transform duration-700 ease-out group-hover/img:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <span className="text-[10px] font-mono text-text-secondary bg-canvas/80 backdrop-blur px-2 py-1 rounded-lg border border-border-subtle">
                No shared profiles · Your machine, your history
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-center">
              <span className="text-[10px] text-text-muted block">Chat history</span>
              <span className="text-status-success font-bold">100% Private</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-center">
              <span className="text-[10px] text-text-muted block">Supported devices</span>
              <span className="text-accent-cyan font-bold">Mac / Win / Linux</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-center">
              <span className="text-[10px] text-text-muted block">SLA policy</span>
              <span className="text-primary-blue font-bold">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
