import React from 'react';

const COMPANIES = [
  { name: 'VNG Corporation', tag: 'Tech Giant' },
  { name: 'FPT Software', tag: 'Global IT' },
  { name: 'Viettel Solutions', tag: 'Enterprise' },
  { name: 'One Mount Group', tag: 'Ecosystem' },
  { name: 'Grab Vietnam R&D', tag: 'Tech Unicorn' },
  { name: 'MoMo Fintech', tag: 'Payment' },
  { name: 'VNPT Digital', tag: 'Telecom' },
  { name: 'Shopee Engineering', tag: 'E-commerce' },
];

export const CompanyTrustMarquee: React.FC = () => {
  return (
    <div className="w-full py-10 border-y border-border-subtle/60 bg-surface/30 backdrop-blur-sm overflow-hidden my-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted font-mono">
          Được các kỹ sư phần mềm &amp; Tech Lead tại các công ty hàng đầu tin dùng
        </p>
      </div>

      <div className="relative flex overflow-x-hidden">
        {/* Infinite CSS horizontal marquee */}
        <div className="flex animate-marquee whitespace-nowrap gap-8 items-center">
          {[...COMPANIES, ...COMPANIES].map((comp, idx) => (
            <div
              key={`${comp.name}-${idx}`}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-canvas/60 border border-border-subtle hover:border-primary-blue/40 transition-all cursor-default group"
            >
              <div className="w-2 h-2 rounded-full bg-accent-cyan/70 group-hover:bg-accent-cyan group-hover:scale-125 transition-all" />
              <span className="text-xs sm:text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors font-mono tracking-tight">
                {comp.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted font-sans">
                {comp.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
