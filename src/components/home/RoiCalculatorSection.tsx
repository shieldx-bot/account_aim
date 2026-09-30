import React, { useState } from 'react';
import { Calculator, TrendingUp, Sparkles, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const RoiCalculatorSection: React.FC = () => {
  const { formatPrice } = useApp();
  const [dailyHours, setDailyHours] = useState(6);
  const [hourlyRateVND, setHourlyRateVND] = useState(250000); // 250,000 VND/h (~$10/h)

  // Productivity math
  // Developer saves ~35% coding time on boilerplate, refactoring, debug & tests
  const workingDaysPerMonth = 22;
  const hoursSavedPerMonth = Math.round(dailyHours * workingDaysPerMonth * 0.35);
  const monthlyValueVND = hoursSavedPerMonth * hourlyRateVND;
  const proCostVND = 249000;
  const netProfitVND = monthlyValueVND - proCostVND;
  const roiMultiplier = Math.round(monthlyValueVND / proCostVND);

  return (
    <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-surface to-surface-subtle border border-primary-blue/30 relative overflow-hidden shadow-2xl">
        {/* Glow ambient */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-blue/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-accent-cyan/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Sliders & Controls */}
          <div data-section-header className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-mono font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive ROI Calculator</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Calculate the Value AI Pro Accounts Bring You
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Based on a real-world survey of over 10,000 developers using Cursor Pro and Claude 3.7 Sonnet to automate unit testing, debugging, and boilerplate code generation.
            </p>

            {/* Slider 1: Daily coding hours */}
            <div className="space-y-2 bg-canvas/60 p-4 rounded-2xl border border-border-subtle">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-text-secondary">Your daily coding hours:</span>
                <span className="font-mono text-sm font-bold text-accent-cyan">{dailyHours} hrs/day</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-primary-blue h-2 bg-surface rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
<span>2 hrs</span>
                  <span>6 hrs (Default)</span>
                  <span>12 hrs</span>
              </div>
            </div>

            {/* Slider 2: Hourly Rate */}
            <div className="space-y-2 bg-canvas/60 p-4 rounded-2xl border border-border-subtle">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-text-secondary">Income / Hourly value:</span>
                <span className="font-mono text-sm font-bold text-status-success">
                  {hourlyRateVND.toLocaleString('vi-VN')} ₫/hr (~${(hourlyRateVND / 25000).toFixed(0)}/hr)
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={800000}
                step={25000}
                value={hourlyRateVND}
                onChange={(e) => setHourlyRateVND(Number(e.target.value))}
                className="w-full accent-status-success h-2 bg-surface rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>100K ₫ (~$4)</span>
                <span>300K ₫ (~$12)</span>
                <span>800K ₫ (~$32)</span>
              </div>
            </div>
          </div>

          {/* Right Column: ROI Output Card */}
          <div className="lg:col-span-5 bg-canvas/90 border border-primary-blue/40 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
            <span className="text-[11px] font-mono text-accent-cyan uppercase tracking-wider block mb-1">
              Estimated Monthly ROI
            </span>
            <div className="flex items-baseline gap-2 mb-6">
<span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                  +{hoursSavedPerMonth} Hours
                </span>
                <span className="text-xs text-text-muted">hours saved/month</span>
            </div>

            <div className="space-y-3 font-mono text-xs border-y border-border-subtle py-4 my-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Economic value gained:</span>
                <span className="font-bold text-status-success">
                  +{monthlyValueVND.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex justify-between items-center">
<span className="text-text-secondary">AI Pro account cost:</span>
                  <span className="text-text-muted line-through">$10/mo</span>
                  <span className="font-bold text-text-primary">$7.47/mo</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                <span className="text-text-primary font-bold">Net time profit:</span>
                <span className="font-extrabold text-accent-cyan text-sm">
                  +{netProfitVND.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-blue/15 border border-primary-blue/30 text-center mb-5">
              <span className="text-xs text-text-secondary">ROI ratio:</span>
              <div className="text-xl font-extrabold text-accent-cyan font-mono mt-0.5">
                {roiMultiplier}x Return on Investment (ROI)
              </div>
            </div>

            <a
              href="#catalog"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40 transition-all text-center"
            >
              <span>Xem các gói tài khoản &amp; Nhận ngay trong 30s</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
