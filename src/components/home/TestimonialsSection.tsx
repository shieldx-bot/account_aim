import React from 'react';
import { Star, CheckCircle2, Quote, Sparkles } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Tran Duc Minh',
    role: 'Tech Lead @ Fintech Solution',
    company: 'Fintech HN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    product: 'Cursor Pro AI IDE (1 Year)',
    content:
      'My whole team of 15 developers uses Cursor Pro through AgentLab. It cuts costs by over 50% compared to putting charges on personal cards, and since it\'s assigned directly to our company email, there\'s no risk of code leaks or banned sessions.',
    rating: 5,
    verified: true,
  },
  {
    name: 'Nguyen Hoang Long',
    role: 'Senior Full-stack Developer',
    company: 'Remote US Team',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    product: 'Claude 3.7 Sonnet Pro',
    content:
      'The most impressive thing is the delivery speed: the moment I finished scanning VietQR, my account details were already sitting in the Vault. I once lost Pro access at midnight — I clicked the automated RMA bot and a new account was issued 15 seconds later, no support call needed.',
    rating: 5,
    verified: true,
  },
  {
    name: 'Le Thao My',
    role: 'AI Engineer & Researcher',
    company: 'AI Lab Saigon',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    product: 'ChatGPT Plus & o3-mini',
    content:
      'Claude Sonnet and OpenAI o3-mini helped me speed up my algorithm research threefold. The service here is extremely professional and trustworthy, with technical support that actually understands developer tools.',
    rating: 5,
    verified: true,
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div data-section-header className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs font-mono font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real Feedback from Developer Community</span>
        </div>
<h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          12,400+ Engineers & Tech Teams Trust
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary">
          Average rating of 4.9/5 across all completed orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="p-7 rounded-3xl bg-surface border border-border-subtle hover:border-primary-blue/30 transition-all flex flex-col justify-between shadow-xl relative group"
          >
            <div>
              {/* Star rating */}
              <div className="flex items-center gap-1 text-status-warning mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-status-warning" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 italic">
                &quot;{t.content}&quot;
              </p>
            </div>

            {/* Author details */}
            <div className="pt-4 border-t border-border-subtle flex items-center gap-3">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover border border-primary-blue/40"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(el.alt)}&backgroundColor=635BFF,00D4FF&fontFamily=Arial,Helvetica`;
                }}
              />
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-text-primary truncate">{t.name}</h4>
                  {t.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-text-muted block truncate">{t.role}</span>
                <span className="text-[11px] text-text-muted block truncate">Purchased: {t.product}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
