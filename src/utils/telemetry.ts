/**
 * Centralized Telemetry, Observability & Analytics Layer
 * Dispatches standard events to dataLayer (GA4 / GTM / PostHog) and buffers error breadcrumbs for Sentry / Datadog
 */

export interface TelemetryPayload {
  [key: string]: unknown;
}

export interface ErrorBreadcrumb {
  timestamp: string;
  context: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// In-memory circular buffer for the last 30 error breadcrumbs (used in CSKH diagnostic export)
const errorBreadcrumbsBuffer: ErrorBreadcrumb[] = [];
const MAX_BREADCRUMBS = 30;

export function trackEvent(eventName: string, payload: TelemetryPayload = {}): void {
  const eventData = {
    event: eventName,
    ...payload,
    timestamp: new Date().toISOString(),
  };

  // Safe dispatch to window.dataLayer if present
  if (typeof window !== 'undefined') {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(eventData);
  }

  // Developer mode logging
  if (import.meta.env.DEV) {
    console.log(`📡 [Telemetry: ${eventName}]`, payload);
  }
}

export function logErrorBreadcrumb(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  const breadcrumb: ErrorBreadcrumb = {
    timestamp: new Date().toISOString(),
    context,
    message,
    metadata,
  };

  errorBreadcrumbsBuffer.push(breadcrumb);
  if (errorBreadcrumbsBuffer.length > MAX_BREADCRUMBS) {
    errorBreadcrumbsBuffer.shift();
  }

  console.error(`🚨 [ErrorBreadcrumb @ ${context}]:`, message, metadata);
}

export function getErrorBreadcrumbs(): ErrorBreadcrumb[] {
  return [...errorBreadcrumbsBuffer];
}
