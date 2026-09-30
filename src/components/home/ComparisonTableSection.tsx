import React from 'react';
import { Check, X, ShieldAlert, Sparkles, ShieldCheck } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    feature: 'Licensing method',
    aipro: 'Direct assignment to primary email or 100% private account',
    blackMarket: 'Shared account with 5-10 strangers',
    aiproHighlight: true,
  },
  {
    feature: 'Delivery speed after payment',
    aipro: 'Automatic within < 30 seconds via VietQR MBBank Webhook',
    blackMarket: 'Seller reply wait time 2 to 24 hours',
    aiproHighlight: true,
  },
  {
    feature: 'Issue handling & warranty process',
    aipro: '1-for-1 automated bot 24/7, new account issued within 30s',
    blackMarket: 'Promised warranty but often blocked / communication cut off',
    aiproHighlight: true,
  },
  {
    feature: 'Source code & chat history security',
    aipro: '100% session isolation, no project source code theft',
    blackMarket: 'Everyone shares the same account, all code and chat history visible',
    aiproHighlight: true,
  },
  {
    feature: 'Payment origin & account lock risk',
    aipro: 'Valid business card, 0% risk of AI provider ban',
    blackMarket: 'Hacked/shared cards (BIN chúa), permanent account lock risk',
    aiproHighlight: true,
  },
  {
    feature: 'Payment method & invoice',
    aipro: 'International gateway PayPal, Visa/Mastercard, JSON/PDF receipt issued',
    blackMarket: 'Personal transfer, no paperwork or proof',
    aiproHighlight: true,
  },
];

export const ComparisonTableSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
<div data-section-header className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Protect Your Assets & Reputation</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Comparing AIPro.dev vs Black Market Purchases
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary">
          Why saving a few tens of thousands on the black market could risk your entire project source code and device bans.
        </p>
      </div>

      {/* Comparison Matrix Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="py-5 px-6 font-mono text-xs uppercase text-text-muted w-1/3">
                  Audit Criteria
                </th>
                <th className="py-5 px-6 bg-primary-blue/10 border-x border-primary-blue/30 w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm sm:text-base text-accent-cyan">
                      AIPro<span className="text-white">.dev</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-blue text-white text-[10px] font-bold">
                      Recommended
                    </span>
                  </div>
                </th>
                <th className="py-5 px-6 font-mono text-xs uppercase text-text-muted w-1/3">
                  Black Market / Facebook Groups
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-canvas/30 transition-colors">
                  <td className="py-4 px-6 font-semibold text-text-primary font-sans">
                    {row.feature}
                  </td>

                  {/* AIPro column */}
                  <td className="py-4 px-6 bg-primary-blue/5 border-x border-primary-blue/20 text-text-primary font-medium">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-status-success/20 text-status-success flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{row.aipro}</span>
                    </div>
                  </td>

                  {/* Black Market column */}
                  <td className="py-4 px-6 text-text-muted">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-status-error/20 text-status-error flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{row.blackMarket}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
