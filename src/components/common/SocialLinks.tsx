import React from 'react';
import { Youtube, MessageCircle, Mail, Globe, PlaySquare, ThumbsUp } from 'lucide-react';
import type { CreatorSocial } from '@/data/creatorProfile';

const iconMap: Record<CreatorSocial['icon'], React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  tiktok: PlaySquare,
  facebook: ThumbsUp,
  telegram: MessageCircle,
  email: Mail,
  website: Globe,
};

interface Props {
  socials: CreatorSocial[];
  variant?: 'inline' | 'cards';
}

/**
 * Dải biểu tượng liên kết mạng xã hội của nhà sáng lập.
 * - variant "inline": hàng icon nhỏ (dùng trong Footer).
 * - variant "cards": thẻ lớn kèm handle (dùng trong trang About).
 */
export const SocialLinks: React.FC<Props> = ({ socials, variant = 'inline' }) => {
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {socials.map((s) => {
          const Icon = iconMap[s.icon];
          return (
            <a
              key={s.label}
              href={s.url}
              target={s.url.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border-subtle hover:border-accent-cyan/60 hover:shadow-[0_0_16px_rgba(0,240,255,0.15)] transition-all group"
            >
              <span className="p-2 rounded-lg bg-primary-blue/10 text-accent-cyan group-hover:bg-primary-blue/20 transition-colors">
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text-primary">{s.label}</span>
                <span className="text-[11px] font-mono text-text-muted truncate">{s.handle}</span>
              </span>
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {socials.map((s) => {
        const Icon = iconMap[s.icon];
        return (
          <a
            key={s.label}
            href={s.url}
            target={s.url.startsWith('mailto:') ? undefined : '_blank'}
            rel="noreferrer"
            title={`${s.label} · ${s.handle}`}
            aria-label={s.label}
            className="p-2 rounded-lg bg-surface border border-border-subtle text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/50 transition-all"
          >
            <Icon className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};
