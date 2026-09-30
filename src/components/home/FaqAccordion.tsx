import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'After payment, how and when do I receive my account?',
    a: 'Immediately after the system receives payment (1.5-3s via PayPal or Visa Card), you will be automatically redirected to the "License Vault" on the website displaying all Email, Password, Token, and 2FA Code. At the same time, a secure backup copy will be sent directly to your email within under 30 seconds.',
  },
  {
    q: 'What is the difference between the "Primary Upgrade" package and "Ready Account"?',
    a: '"Primary Upgrade" activates the Pro/Team package directly on your personal email, preserving 100% of your old chat and project history. "Ready Account" is a newly created exclusive account (Private 1-user) delivered immediately within 10 seconds.',
  },
  {
    q: 'How does the automatic 1-for-1 warranty policy work?',
    a: 'If your account encounters an issue during use, simply go to "Order Lookup", select the reason for the problem, and press "⚡ Activate account renewal in 60s". The Bot system will automatically extract a new account from the reserve warehouse and deliver it immediately on screen without waiting for staff.',
  },
  {
    q: 'Does the system collect or store my personal passwords?',
    a: "Absolutely not. AIPro.dev adheres to the Zero Mandatory Sign-up philosophy. You don't need to create a password to make a purchase. For the primary upgrade package, we only send an upgrade invitation (Invite Link) to your mailbox, never requesting your email password.",
  },
  {
    q: 'What payment methods do you support?',
    a: 'We support the world\'s leading secure international PayPal payment gateway: You can pay directly with Visa, Mastercard, AMEX (via PayPal gateway without needing a PayPal account), or pay via PayPal Wallet and PayPal Pay Later installment plan (0% interest rate).',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-16">
      <div data-section-header className="text-center mb-10">
        <h2 className="text-2xl font-bold text-text-primary">Developer FAQs</h2>
        <p className="text-xs text-text-secondary mt-1">100% transparency on delivery mechanism, licensing, and SLA commitments.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl bg-surface border border-border-subtle overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-elevated/40 transition-colors"
              >
                <span className="text-xs sm:text-sm font-semibold text-text-primary">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-accent-cyan' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs text-text-secondary leading-relaxed border-t border-border-subtle/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
