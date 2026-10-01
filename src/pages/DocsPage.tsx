import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Terminal, CheckSquare, Square, ThumbsUp, ThumbsDown } from 'lucide-react';

const GUIDES = [
  {
    id: 'cursor-pro',
    title: 'Cursor Pro Setup & Session Cookie Guide',
    steps: [
      {
        step: 1,
        title: 'Log out of the old account in Cursor',
        desc: 'Open Cursor > Click the Settings gear in the top-right corner > Select Sign Out for the current account.',
      },
      {
        step: 2,
        title: 'Log in with the provisioned account',
        desc: 'Click Sign In and enter the Email & Password from your License Vault. If the system asks for a 2FA code, open Google Authenticator or copy the 2FA Secret provided.',
      },
      {
        step: 3,
        title: 'Verify the Pro quota',
        desc: 'Go to Settings > Models > Check the "Pro Subscription Active: 500 Fast Requests" section. Enable the Claude 3.7 Sonnet and GPT-4o models to try them out.',
      },
    ],
  },
  {
    id: 'claude-pro',
    title: 'Accepting the Claude Team / Pro Invitation',
    steps: [
      {
        step: 1,
        title: 'Open your personal inbox',
        desc: 'Find the email titled "Anthropic has invited you to Claude Team / Pro" (check your Spam/Promotions folders too).',
      },
      {
        step: 2,
        title: 'Click "Accept Invitation"',
        desc: 'Press the confirmation button in the email to link directly to your existing Claude account without losing your previous chat history.',
      },
    ],
  },
  {
    id: 'github-copilot',
    title: 'Activating GitHub Copilot on VS Code & JetBrains',
    steps: [
      {
        step: 1,
        title: 'Install the GitHub Copilot extension',
        desc: 'Open the Extensions Marketplace on VS Code or the Plugin Marketplace on IntelliJ > Search for and install GitHub Copilot & GitHub Copilot Chat.',
      },
      {
        step: 2,
        title: 'Log in with the upgraded GitHub account',
        desc: 'Click the account icon in the bottom-left corner and choose "Sign in with GitHub" to activate your Copilot Pro license.',
      },
    ],
  },
];

export const DocsPage: React.FC = () => {
  const [activeGuideId, setActiveGuideId] = useState('cursor-pro');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const activeGuide = GUIDES.find((g) => g.id === activeGuideId) || GUIDES[0];

  const toggleCheck = (stepId: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-24 font-sans">
      <div className="mb-8">
        <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider block">
          Developer Documentation
        </span>
        <h1 className="text-3xl font-extrabold text-text-primary mt-1">
          Activation &amp; IDE Troubleshooting Documentation
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Step-by-step instructions to set up your license in Cursor, VS Code, and JetBrains as quickly as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Menu */}
        <div className="md:col-span-4 space-y-2">
          {GUIDES.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setActiveGuideId(g.id);
                setFeedback(null);
              }}
              className={`w-full p-3.5 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                activeGuideId === g.id
                  ? 'bg-primary-blue text-white shadow-sm'
                  : 'bg-surface hover:bg-elevated text-text-secondary border border-border-subtle'
              }`}
            >
              <span>{g.title}</span>
            </button>
          ))}
        </div>

        {/* Right Guide Content Area */}
        <div className="md:col-span-8 p-6 sm:p-8 rounded-2xl bg-surface border border-border-subtle space-y-6">
          <h2 className="text-xl font-bold text-text-primary">{activeGuide.title}</h2>

          <div className="space-y-4">
            {activeGuide.steps.map((st) => {
              const stepKey = `${activeGuide.id}-${st.step}`;
              const isChecked = checkedSteps[stepKey] || false;

              return (
                <div
                  key={st.step}
                  onClick={() => toggleCheck(stepKey)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked ? 'bg-status-success/5 border-status-success/30' : 'bg-canvas border-border-subtle'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button type="button" className="mt-0.5 text-text-muted hover:text-text-primary">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-status-success" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <h4 className={`text-xs font-bold ${isChecked ? 'text-status-success line-through' : 'text-text-primary'}`}>
                        Step {st.step}: {st.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">{st.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Widget */}
          <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-text-muted">Was this documentation helpful?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedback('yes')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  feedback === 'yes' ? 'bg-status-success text-white border-status-success' : 'bg-canvas border-border-subtle text-text-secondary'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Yes, very helpful
              </button>
              <button
                type="button"
                onClick={() => setFeedback('no')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  feedback === 'no' ? 'bg-status-error text-white border-status-error' : 'bg-canvas border-border-subtle text-text-secondary'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Not solved yet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
