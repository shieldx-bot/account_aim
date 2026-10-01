import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useApp } from '@/context/AppContext';
import { SupportChatWidget } from '@/components/common/SupportChatWidget';
import { WifiOff, AlertCircle } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { isOnline, featureFlags } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-primary">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="w-full bg-status-error/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>You are losing Internet connection. Data may not be updated in real time.</span>
        </div>
      )}

      {/* Emergency Announcement Banner */}
      {featureFlags.announcementBanner && (
        <div className="w-full bg-status-warning/90 text-black px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{featureFlags.announcementBanner}</span>
        </div>
      )}

      {/* Sticky Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating customer-support chat (Grok AI) */}
      <SupportChatWidget />
    </div>
  );
};
