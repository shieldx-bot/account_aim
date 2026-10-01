import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Youtube,
  BadgeCheck,
  Lock,
  FileCheck2,
  Eye,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-24 font-sans">
      {/* ===== Hero: Founder Identity ===== */}
      <div className="rounded-2xl bg-surface border border-border-subtle p-8 sm:p-10">
        <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider block">
          Founder &amp; Operator — Verified Identity
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-blue to-accent-cyan flex items-center justify-center text-3xl font-extrabold text-white shrink-0">
            JS
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary flex flex-wrap items-center gap-2">
              Jeff Su
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/30 text-status-success text-[11px] font-bold">
                <BadgeCheck className="w-3.5 h-3.5" />
                Identity verified
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Founder &amp; hands-on operator of AgentLab. The entire system,
              account vault, and refund process are personally my legal and customer-facing responsibility.
            </p>
            <a
              href="https://www.youtube.com/@JeffSu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#FF0033]/10 text-[#CC0029] hover:bg-[#FF0033]/20 border border-[#FF0033]/30 text-xs font-semibold transition-all"
            >
              <Youtube className="w-4 h-4" />
              Official YouTube channel: @JeffSu
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        {/* Workspace photo — verified Unsplash asset (developer operations desk) */}
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=70"
          alt="AgentLab operations workspace"
          loading="lazy"
          className="mt-6 w-full h-40 sm:h-52 object-cover rounded-xl border border-border-subtle"
        />
      </div>

      {/* ===== Transaction Safety Assurance ===== */}
      <h2 className="text-xl font-bold text-text-primary mt-12 mb-1 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-status-success" />
        Your Transactions Are Guaranteed Safe by Me
      </h2>
      <p className="text-xs text-text-muted mb-6">
      This website is owned and operated by an individual with a public identity, verifiable via the official YouTube channel.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-blue/10 text-primary-blue">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Legally accountable owner</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• Representative: <strong className="text-text-primary">Jeff Su</strong> (Founder &amp; Operator)</li>
            <li>• Responsibility: Oversees all disputes, refunds &amp; tax obligations per regulations.</li>
            <li>• Direct contact: <Link to="/terms?tab=privacy" className="text-accent-cyan hover:underline">legal@agentlab.dev</Link></li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-success/10 text-status-success">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Publicly verifiable identity</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• You can verify who I am before you pay:</li>
            <li>
              • Official YouTube channel:{' '}
              <a href="https://www.youtube.com/@JeffSu" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline font-mono">
                youtube.com/@JeffSu
              </a>
            </li>
            <li>• All AgentLab promotional content is published publicly here.</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Encrypted payments &amp; no card storage</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• SSL/TLS 256-bit connection — the security lock shown in your browser.</li>
            <li>• Money flows through a PayPal/bank intermediary — we never store card data.</li>
            <li>• Transparent order reconciliation, verifiable at{' '}
              <Link to="/lookup" className="text-accent-cyan hover:underline">/lookup</Link>.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-warning/10 text-status-warning">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">100% refund commitment within 48h</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <li>• Not satisfied within the first 48 hours → 100% refund to the original account.</li>
            <li>• Handled by the Founder directly — no customer-support bot runaround.</li>
            <li>• Details at{' '}
              <Link to="/terms?tab=refund" className="text-accent-cyan hover:underline">Refund Policy</Link>.
            </li>
          </ul>
        </div>
      </div>

      {/* ===== Verification strip ===== */}
      <div className="mt-10 p-5 rounded-2xl bg-canvas border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
          <span>
            This website's transaction safety is guaranteed by <strong className="text-text-primary">Jeff Su</strong> —
            the responsible party's identity has been disclosed per e-commerce standards.
          </span>
        </div>
        <Link
          to="/terms?tab=privacy"
          className="px-4 py-2 rounded-xl bg-primary-blue text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          View Legal Center
        </Link>
      </div>
    </div>
  );
};
