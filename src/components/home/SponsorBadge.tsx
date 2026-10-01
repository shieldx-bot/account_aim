import React from 'react';
import { Youtube, BadgeCheck, ExternalLink } from 'lucide-react';

const CHANNEL_URL = 'https://www.youtube.com/@AILABS-393';
// Real channel avatar (YouTube CDN) — verified 200 image/jpeg
const CHANNEL_AVATAR =
  'https://yt3.googleusercontent.com/8SwrFVJ9IBcanYAQNTGt78-2iDVHKD0BHWIOqN6v6r4uU2fSC5ihdb1ZYEX0hfHW9CV2FHfvdOA=s160-c-k-c0x00ffffff-no-rj';

/**
 * Official sponsor feature — AI LABS YouTube channel.
 * A prominent trust section (not a subtle badge): real channel avatar,
 * verified mark, and a direct "Watch on YouTube" CTA so visitors can
 * verify the media sponsorship themselves before purchasing.
 */
export const SponsorBadge: React.FC = () => {
  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8" aria-label="Official media sponsor">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#635BFF]/[0.06] via-surface to-[#FF0000]/[0.05] border border-border-subtle shadow-card-rest">
        {/* Soft ambient glows */}
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary-blue/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-[#FF0000]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center gap-6 px-6 sm:px-10 py-8">
          {/* Channel avatar with verified ring */}
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 group/avatar"
            aria-label="AI LABS YouTube channel"
          >
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#FF0000]/40 to-[#635BFF]/40 opacity-70 group-hover/avatar:opacity-100 transition-opacity" aria-hidden="true" />
            <img
              src={CHANNEL_AVATAR}
              alt="AI LABS channel avatar"
              width={72}
              height={72}
              loading="lazy"
              className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full object-cover border-2 border-white shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-canvas border border-border-subtle flex items-center justify-center" title="Verified channel">
              <BadgeCheck className="w-5 h-5 text-primary-blue" />
            </span>
          </a>

          {/* Copy block */}
          <div className="flex-1 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#0E7490]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse" aria-hidden="true" />
              Official Media Sponsor
            </span>
            <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
              Featured on{' '}
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-1 hover:text-primary-blue transition-colors"
              >
                AI LABS · YouTube
                <ExternalLink className="w-4 h-4 text-text-muted group-hover/link:text-primary-blue transition-colors" />
              </a>
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl">
              Independent reviews &amp; hands-on deep dives into the exact AI tools we distribute —
              watch the channel, then buy with confidence.
            </p>
          </div>

          {/* CTA */}
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(255,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Youtube className="w-5 h-5 fill-white" />
            <span>Watch on YouTube</span>
          </a>
        </div>
      </div>
    </section>
  );
};
