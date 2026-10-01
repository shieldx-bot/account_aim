import { getErrorBreadcrumbs } from './telemetry';

export interface DiagnosticBundle {
  clientTimestamp: string;
  appVersion: string;
  userAgent: string;
  screenResolution: string;
  language: string;
  isOnline: boolean;
  activePath: string;
  contextData?: Record<string, unknown>;
  recentErrors: ReturnType<typeof getErrorBreadcrumbs>;
}

export function generateSupportBundle(contextData: Record<string, unknown> = {}): DiagnosticBundle {
  return {
    clientTimestamp: new Date().toISOString(),
    appVersion: '1.0.0-PROD',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    activePath: typeof window !== 'undefined' ? window.location.pathname : '/',
    contextData,
    recentErrors: getErrorBreadcrumbs(),
  };
}

export function openTelegramSupport(orderId?: string, extraInfo: Record<string, unknown> = {}): void {
  const bundle = generateSupportBundle({ orderId, ...extraInfo });
  const message = [
    `🆘 [AgentLab Technical Support 24/7]`,
    orderId ? `Order ID: ${orderId}` : '',
    `Time: ${new Date().toLocaleString('en-US')}`,
    `Browser: ${bundle.userAgent.substring(0, 80)}...`,
    `Note: Customer needs technical/delivery assistance.`,
  ].filter(Boolean).join('\n');

  const encodedText = encodeURIComponent(message);
  const telegramUrl = `https://t.me/aipro_support?text=${encodedText}`;
  if (typeof window !== 'undefined') {
    window.open(telegramUrl, '_blank');
  }
}
