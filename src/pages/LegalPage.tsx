import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, FileText, CheckCircle2, RefreshCw, Lock, Printer } from 'lucide-react';

type Tab = 'terms' | 'sla' | 'refund' | 'privacy';

export const LegalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) || 'terms';

  const setTab = (tab: Tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-24 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-border-subtle">
        <div>
          <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider block">
            Compliance &amp; Legal Center
          </span>
          <h1 className="text-3xl font-extrabold text-text-primary mt-1">
            Legal Center, SLA Commitments &amp; Consumer Protection
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Transparent policies to protect developer rights and comply with international payment standards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-2"
        >
          <Printer className="w-4 h-4 text-accent-cyan" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex rounded-xl bg-surface p-1.5 border border-border-subtle my-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('terms')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'terms' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          1. Terms of Service
        </button>
        <button
          onClick={() => setTab('sla')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'sla' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          2. 99.9% SLA Commitment
        </button>
        <button
          onClick={() => setTab('refund')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'refund' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          3. 100% Money-Back Policy
        </button>
        <button
          onClick={() => setTab('privacy')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'privacy' ? 'bg-primary-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          4. Data Security
        </button>
      </div>

      {/* Content Area */}
      <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-xs sm:text-sm text-text-secondary leading-relaxed space-y-6">
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">1. AgentLab Account Service Terms</h2>
            <p>
              AgentLab provides premium AI account licensing and activation solutions (Cursor Pro, Claude Pro, ChatGPT Plus, GitHub Copilot...) for individual software engineers and organizations.
            </p>
            <h3 className="text-base font-semibold text-text-primary pt-2">Rights and Obligations:</h3>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Users have full ownership of the account throughout the purchased term (1, 3, 6, or 12 months).</li>
              <li>The system commits to never interfering with, reading, or backing up any of your source code or conversation history.</li>
              <li>Delivered accounts are exclusive (Private 1-user) — shared slots that degrade request speed are strictly not used.</li>
            </ul>
          </div>
        )}

        {activeTab === 'sla' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">2. Service Level Agreement (SLA 99.9%)</h2>
            <p>
              We understand that a developer's time is their most valuable asset. That's why AgentLab sets the highest SLA standards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <h4 className="font-bold text-text-primary text-xs">⚡ Automatic Delivery &lt; 30 Seconds</h4>
                <p className="text-xs text-text-muted mt-1">100% of orders are released to the License Vault immediately after the payment is confirmed.</p>
              </div>
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <h4 className="font-bold text-text-primary text-xs">🔄 Recovery Within 60 Seconds</h4>
                <p className="text-xs text-text-muted mt-1">The automatic 1-to-1 replacement bot runs 24/7/365, extracting a brand-new account from the backup vault.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">3. 1-to-1 Exchange Warranty &amp; 100% Money-Back Policy</h2>
            <p>
              To maximize customer protection and comply with the buyer-protection standards of international payment providers (Visa / Mastercard / PayPal):
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong className="text-text-primary">Automatic 1-to-1 exchange warranty:</strong> Applies for the entire duration of the active plan if the account loses Pro access, has session errors, or is dropped from the workspace.</li>
              <li><strong className="text-text-primary">100% no-questions-asked money-back:</strong> Within the first 48 hours of purchase, if you are not satisfied or the system cannot provide a stable working account, we will refund 100% of the payment to the original account within 2 business hours.</li>
            </ul>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">4. Data Security Policy &amp; Zero-Collection Philosophy</h2>
            <p>
              AgentLab is built on a <strong className="text-text-primary">Zero Mandatory Sign-up</strong> philosophy:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>We only collect your email address to send invoices and License Vault information.</li>
              <li>All data transmitted on this website is encrypted with the highest 256-bit SSL standard.</li>
              <li>We do not sell, share, or track your cookies for third-party advertising purposes.</li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-canvas border border-border-subtle flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Accountable to a verified individual:</strong>{' '}
                This website is owned and operated by <strong className="text-text-primary">Jeff Su</strong> — Founder &amp; Operator,
                with a public identity verified via the official YouTube channel{' '}
                <a
                  href="https://www.youtube.com/@JeffSu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-cyan hover:underline font-mono"
                >
                  youtube.com/@JeffSu
                </a>
                . All transaction disputes are handled directly by the founder at{' '}
                <span className="font-mono text-text-primary">legal@agentlab.dev</span>. See also:{' '}
                <Link to="/about" className="text-accent-cyan hover:underline">Founder profile</Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
