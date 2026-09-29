import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  location: string;
  product: string;
  duration: string;
  timeAgo: string;
  deliverySeconds: number;
}

const LIVE_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    location: 'Hà Nội',
    product: 'Cursor Pro AI IDE',
    duration: '1 năm',
    timeAgo: 'Vừa xong',
    deliverySeconds: 14,
  },
  {
    id: 'act-2',
    location: 'TP. Hồ Chí Minh',
    product: 'Claude 3.7 Sonnet Pro',
    duration: '3 tháng',
    timeAgo: '3 phút trước',
    deliverySeconds: 19,
  },
  {
    id: 'act-3',
    location: 'Đà Nẵng',
    product: 'ChatGPT Plus & o3-mini',
    duration: '1 tháng',
    timeAgo: '6 phút trước',
    deliverySeconds: 11,
  },
  {
    id: 'act-4',
    location: 'Tokyo (Dev VN)',
    product: 'GitHub Copilot Business',
    duration: '1 năm',
    timeAgo: '11 phút trước',
    deliverySeconds: 22,
  },
];

export const LiveActivityTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = LIVE_ACTIVITIES[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <div className="p-3 rounded-2xl bg-surface/90 border border-primary-blue/30 backdrop-blur-md shadow-lg shadow-primary-blue/5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success" />
          </span>
          <div className="truncate font-mono">
            <span className="text-text-muted">Kỹ sư tại </span>
            <strong className="text-text-primary font-bold">{current.location}</strong>
            <span className="text-text-muted"> vừa nhận </span>
            <span className="text-accent-cyan font-bold">{current.product}</span>
            <span className="text-text-muted"> ({current.duration})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-status-success bg-status-success/15 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" />
            <span>{current.deliverySeconds}s giao hàng</span>
          </span>
          <span className="text-[10px] text-text-muted font-mono">{current.timeAgo}</span>
        </div>
      </div>
    </div>
  );
};
