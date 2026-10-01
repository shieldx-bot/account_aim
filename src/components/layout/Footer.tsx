import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Activity, MessageSquare, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface border-t border-border-subtle mt-20 text-xs text-text-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        {/* Top Guarantee Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 mb-10 border-b border-border-subtle/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-success/10 text-status-success">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Instant Delivery &lt; 30s</h4>
              <p className="text-text-muted mt-0.5">License Vault auto-exported and emailed immediately upon payment confirmation.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-blue/10 text-primary-blue">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Auto 1-for-1 Warranty</h4>
              <p className="text-text-muted mt-0.5">Automatic account recovery within 60 seconds — no waiting for human support.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent-cyan/10 text-accent-cyan">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Uptime Commitment 99.9%</h4>
              <p className="text-text-muted mt-0.5">Stable official account inventory, 256-bit encryption.</p>
            </div>
          </div>
        </div>

        {/* Links Navigation Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">AI Services</h5>
            <ul className="space-y-2">
              <li><Link to="/product/cursor-pro" className="hover:text-text-primary transition-colors">Cursor Pro 1-3 Months</Link></li>
              <li><Link to="/product/claude-pro" className="hover:text-text-primary transition-colors">Claude Pro Sonnet 3.7</Link></li>
              <li><Link to="/product/chatgpt-plus" className="hover:text-text-primary transition-colors">ChatGPT Plus GPT-4.5</Link></li>
              <li><Link to="/product/github-copilot" className="hover:text-text-primary transition-colors">GitHub Copilot Pro</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Self-Service &amp; Lookup</h5>
            <ul className="space-y-2">
              <li><Link to="/lookup" className="hover:text-text-primary transition-colors">Order lookup via OTP</Link></li>
              <li><Link to="/lookup" className="hover:text-text-primary transition-colors">Automated warranty center</Link></li>
              <li><Link to="/docs" className="hover:text-text-primary transition-colors">IDE activation guide</Link></li>
              <li><Link to="/status" className="hover:text-text-primary transition-colors flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>Live System Status</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Policies &amp; Legal</h5>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-text-primary transition-colors">About the founder (Jeff Su)</Link></li>
              <li><Link to="/terms?tab=terms" className="hover:text-text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/terms?tab=sla" className="hover:text-text-primary transition-colors">99.9% SLA commitment</Link></li>
              <li><Link to="/terms?tab=refund" className="hover:text-text-primary transition-colors">Warranty &amp; refund policy</Link></li>
              <li><Link to="/terms?tab=privacy" className="hover:text-text-primary transition-colors">Privacy policy</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-text-primary text-sm mb-3">Technical Support</h5>
            <p className="text-text-muted mb-3 leading-relaxed">Technical engineering team online 24/7 via Telegram, specialized for developers.</p>
            <a
              href="https://t.me/aipro_support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 border border-[#229ED9]/30 font-medium transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Telegram Support Channel 24/7</span>
            </a>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-border-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-text-secondary">AgentLab</span>
              <span>&copy; 2026. One-Way Corridor UX Design Standard for Developers.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
              <span>
                Transactions guaranteed by{' '}
                <Link to="/about" className="text-text-primary font-semibold hover:underline">Jeff Su</Link>
                {' '}— Founder &amp; Operator (
                <a href="https://www.youtube.com/@JeffSu" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                  youtube.com/@JeffSu
                </a>
                )
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/status" className="hover:text-text-primary transition-colors">Uptime 99.98%</Link>
            <span>&bull;</span>
            <Link to="/terms?tab=privacy" className="hover:text-text-primary transition-colors">No Cookies Spying</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
