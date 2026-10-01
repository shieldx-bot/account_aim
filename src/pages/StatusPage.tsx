import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Mail,
  Rss,
  Webhook,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  BarChart2,
  Shield,
  Server,
  Database,
  Zap,
  Globe,
  Lock,
  Activity,
  Monitor,
  Bell,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  Image as ImageIcon,
  ExternalLink as ExternalLinkIcon,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Share2,
  Bookmark,
  Star,
  Cpu,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ServiceHealthComponent } from '@/types';
import { statusApi } from '@/services/api';

const STATUS_COLORS = {
  operational: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/20', dot: 'bg-status-success', badge: 'bg-status-success/15 text-status-success border-status-success/20', light: 'bg-status-success/5' },
  degraded_performance: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/20', dot: 'bg-status-warning', badge: 'bg-status-warning/15 text-status-warning border-status-warning/20', light: 'bg-status-warning/5' },
  partial_outage: { bg: 'bg-status-error/10', text: 'text-status-error', border: 'border-status-error/20', dot: 'bg-status-error', badge: 'bg-status-error/15 text-status-error border-status-error/20', light: 'bg-status-error/5' },
  major_outage: { bg: 'bg-status-error/20', text: 'text-status-error', border: 'border-status-error/40', dot: 'bg-status-error animate-pulse', badge: 'bg-status-error/20 text-status-error border-status-error/40', light: 'bg-status-error/10' },
};

const STATUS_LABELS = {
  operational: 'Operational',
  degraded_performance: 'Degraded performance',
  partial_outage: 'Partial outage',
  major_outage: 'Major outage',
};

const CATEGORY_CONFIG = {
  ai_providers: { label: 'AgentLabviders', icon: Cpu, color: 'text-primary-blue', bg: 'bg-primary-blue/10', image: 'https://images.unsplash.com/photo-1677442136019-21780ecbd995?w=120&h=80&fit=crop' },
  payment_gateways: { label: 'Payment Gateways', icon: Globe, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', image: 'https://images.unsplash.com/photo-1556742049-0cf9d78d7b8a?w=120&h=80&fit=crop' },
  fulfillment_bot: { label: 'Automation Systems', icon: Zap, color: 'text-status-success', bg: 'bg-status-success/10', image: 'https://images.unsplash.com/photo-1485827404663-1c2c9a5e5c4e?w=120&h=80&fit=crop' },
  core_infrastructure: { label: 'Core Infrastructure', icon: Server, color: 'text-status-warning', bg: 'bg-status-warning/10', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=120&h=80&fit=crop' },
};

export const StatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [expandedMaintenance, setExpandedMaintenance] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await statusApi.getStatusPage();
      setStatusData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Real-time SSE subscription
  useEffect(() => {
    if (!realTimeEnabled) return;

    const es = statusApi.subscribe(
      (data) => {
        if (data.type === 'heartbeat' || data.type === 'connected') {
          setLastUpdated(new Date());
          // Refresh data every 30 seconds
          loadStatus();
        } else if (data.type === 'status_change') {
          setLastUpdated(new Date());
          loadStatus();
        }
      },
      (err) => {
        console.error('SSE error:', err);
        setRealTimeEnabled(false);
      }
    );

    eventSourceRef.current = es;

    return () => {
      es.close();
    };
  }, [realTimeEnabled, loadStatus]);

  // Auto-refresh fallback every 60 seconds
  useEffect(() => {
    if (!autoRefresh || realTimeEnabled) return;
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, realTimeEnabled, loadStatus]);

  const handleRefresh = useCallback(() => {
    loadStatus();
  }, [loadStatus]);

  const overallStatus = useMemo(() => {
    if (!statusData?.components) return 'operational';
    const allComponents: ServiceHealthComponent[] = Object.values(statusData.components as Record<string, ServiceHealthComponent[]>).flat();
    const statuses = allComponents.map(c => c.status);
    if (statuses.includes('major_outage')) return 'major_outage';
    if (statuses.includes('partial_outage')) return 'partial_outage';
    if (statuses.includes('degraded_performance')) return 'degraded_performance';
    return 'operational';
  }, [statusData]);

  const filteredComponents = useMemo(() => {
    if (!statusData?.components) return {};
    const query = searchQuery.toLowerCase();
    const componentsMap = statusData.components as Record<string, ServiceHealthComponent[]>;
    return Object.entries(componentsMap).reduce((acc: Record<string, ServiceHealthComponent[]>, [category, components]) => {
      const filtered = components.filter((c: ServiceHealthComponent) => 
        (activeFilter === 'all' || c.status === activeFilter) &&
        (c.name.toLowerCase().includes(query) || category.toLowerCase().includes(query))
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {} as Record<string, ServiceHealthComponent[]>);
  }, [statusData, activeFilter, searchQuery]);

  const overallColors = STATUS_COLORS[overallStatus];

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-blue animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading system status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-status-error mx-auto mb-4" />
            <p className="text-status-error font-medium mb-2">Failed to load data</p>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 font-sans">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-blue" />
              AgentLab System Status
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Real-time performance, uptime and incident monitoring for all AgentLab services
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {realTimeEnabled ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-status-success" />
                  <span>Realtime</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-status-error" />
                  <span>Offline</span>
                </>
              )}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                  : 'bg-surface border border-border-subtle text-text-secondary'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl bg-surface border border-border-subtle text-sm font-medium text-text-primary hover:bg-canvas hover:border-primary-blue/50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className={`relative p-6 sm:p-8 rounded-2xl ${overallColors.bg} ${overallColors.border} border overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/5 via-transparent to-accent-cyan/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${overallColors.bg} ${overallColors.border} border flex-shrink-0`}>
                {overallStatus === 'operational' && <CheckCircle2 className={`w-8 h-8 ${overallColors.text} stroke-[2.5]`} />}
                {overallStatus === 'degraded_performance' && <AlertTriangle className={`w-8 h-8 ${overallColors.text} stroke-[2.5]`} />}
                {(overallStatus === 'partial_outage' || overallStatus === 'major_outage') && <XCircle className={`w-8 h-8 ${overallColors.text} stroke-[2.5]`} />}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                  {overallStatus === 'operational' && 'All Systems Operational'}
                  {overallStatus === 'degraded_performance' && 'System Experiencing Degraded Performance'}
                  {overallStatus === 'partial_outage' && 'System Experiencing a Partial Outage'}
                  {overallStatus === 'major_outage' && 'System Experiencing a Major Outage'}
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  {overallStatus === 'operational'
                    ? 'All services are running normally. No incidents reported.'
                    : 'Some services are experiencing issues. See details below.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 text-right sm:flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Activity className="w-3.5 h-3.5" />
                <span>Updated: <span className="font-mono text-text-primary">{lastUpdated.toLocaleString('en-US')}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>90-day uptime: <strong className="font-mono text-status-success">{statusData?.overall?.uptimePercent?.toFixed(2)}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subscription Bar */}
      <section className="mb-8 p-4 sm:p-6 rounded-2xl bg-surface border border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Subscribe to Incident Notifications
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setShowSubscribeModal(true)} className="px-3 py-2 rounded-xl bg-primary-blue/10 border border-primary-blue/20 text-primary-blue text-sm font-medium hover:bg-primary-blue/20 transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button className="px-3 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors flex items-center gap-2">
              <Rss className="w-4 h-4" />
              RSS Feed
            </button>
            <button className="px-3 py-2 rounded-xl bg-text-muted/10 border border-border-subtle text-text-secondary text-sm font-medium hover:bg-text-muted/20 transition-colors flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhook
            </button>
            <a href="/api/status" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-text-muted/10 border border-border-subtle text-text-secondary text-sm font-medium hover:bg-text-muted/20 transition-colors flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Status API
            </a>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-text-muted" />
          {['all', 'operational', 'degraded_performance', 'partial_outage', 'major_outage'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-primary-blue text-white'
                  : 'bg-surface border border-border-subtle text-text-secondary hover:bg-canvas'
              }`}
            >
              {filter === 'all' ? 'All' : STATUS_LABELS[filter as keyof typeof STATUS_LABELS]}
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Monitor className="w-6 h-6 text-primary-blue" />
          <h2 className="text-xl font-bold text-text-primary">Service Component Status</h2>
          <span className="text-sm text-text-muted">({Object.values(filteredComponents).flat().length} components)</span>
        </div>

        <div className="space-y-6">
          {Object.entries(filteredComponents).map(([category, services]) => {
            const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || { label: category, icon: Server, color: 'text-text-primary', bg: 'bg-text-muted/10', image: '' };
            const Icon = config.icon;
            return (
              <div key={category} className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
                <div className="relative h-20 overflow-hidden">
                  <img src={config.image} alt={config.label} className="w-full h-full object-cover opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent" />
                  <div className="relative px-5 py-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${config.bg} ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{config.label}</h3>
                      <p className="text-xs text-text-muted">{services.length} components</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border-subtle/50">
                  {services.map((svc, idx) => {
                    const colors = STATUS_COLORS[svc.status];
                    return (
                      <div key={`${category}-${idx}`} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-text-primary truncate">{svc.name}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1.5">
                            <span className="font-mono text-status-success font-medium">{svc.uptimePercent.toFixed(2)}% uptime (90 days)</span>
                            {svc.latency_ms && (
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {svc.latency_ms}ms
                              </span>
                            )}
                            {svc.requests_per_second && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {svc.requests_per_second.toFixed(1)} RPS
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge} border flex items-center gap-1.5`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            {STATUS_LABELS[svc.status]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Incident History */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-6">
          <Activity className="w-6 h-6" />
          Incident History (Last 90 Days)
        </h2>
        <div className="space-y-4">
          {statusData?.incidents?.length === 0 ? (
            <div className="p-8 text-center text-text-muted rounded-2xl bg-surface border border-border-subtle">
              <CheckCircle2 className="w-12 h-12 mx-auto text-status-success/50 mb-3" />
              <p className="font-medium">No incidents in the last 90 days</p>
              <p className="text-sm mt-1">All services are running stably</p>
            </div>
          ) : (
            statusData?.incidents?.map((incident: any) => {
              const isExpanded = expandedIncident === incident.id;
              return (
                <div key={incident.id} className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
                  <button
                    onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                    className="w-full p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:bg-canvas/30 transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${incident.impact === 'minor' ? 'bg-status-warning/10' : 'bg-status-error/10'}`}>
                        {incident.impact === 'minor' ? <AlertTriangle className="w-5 h-5 text-status-warning" /> : <XCircle className="w-5 h-5 text-status-error" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">{incident.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                          <span className="font-mono">{new Date(incident.started_at).toLocaleString('en-US')}</span>
                          <span>•</span>
                          <span className="font-mono">{new Date(incident.resolved_at).toLocaleString('en-US')}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${incident.impact === 'minor' ? 'bg-status-warning/10 text-status-warning' : 'bg-status-error/10 text-status-error'}`}>
                            {incident.impact === 'minor' ? 'Minor impact' : 'Major impact'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-status-success/10 text-status-success">
                            {incident.status === 'resolved' ? 'Resolved' : incident.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border-subtle p-5 bg-canvas/30">
                      <p className="text-sm text-text-secondary mb-4">{incident.description}</p>
                      <div className="space-y-3">
                        {incident.updates?.map((update: any, idx: number) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2.5 h-2.5 rounded-full border-2 border-surface ${
                                update.status === 'resolved' ? 'bg-status-success' :
                                update.status === 'identified' ? 'bg-status-warning' : 'bg-primary-blue'
                              }`} />
                              {idx < incident.updates.length - 1 && <div className="w-0.5 h-full bg-border-subtle/50 mt-1" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 text-xs mb-1">
                                <span className="font-mono text-text-muted">{new Date(update.created_at).toLocaleString('en-US')}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-blue/10 text-primary-blue">
                                  {update.status}
                                </span>
                              </div>
                              <p className="text-sm text-text-secondary">{update.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Scheduled Maintenance */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6" />
          Scheduled Maintenance
        </h2>
        <div className="space-y-4">
          {statusData?.maintenance?.length === 0 ? (
            <div className="p-8 text-center text-text-muted rounded-2xl bg-surface border border-border-subtle">
              <Calendar className="w-12 h-12 mx-auto text-primary-blue/50 mb-3" />
              <p className="font-medium">No maintenance scheduled</p>
            </div>
          ) : (
            statusData?.maintenance?.map((maint: any) => {
              const isExpanded = expandedMaintenance === maint.id;
              return (
                <div key={maint.id} className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
                  <button
                    onClick={() => setExpandedMaintenance(isExpanded ? null : maint.id)}
                    className="w-full p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:bg-canvas/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary-blue/10">
                        <Calendar className="w-5 h-5 text-primary-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">{maint.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                          <span className="font-mono">{new Date(maint.scheduled_for).toLocaleString('en-US')}</span>
                          <span>→</span>
                          <span className="font-mono">{new Date(maint.scheduled_until).toLocaleString('en-US')}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-blue/10 text-primary-blue">
                            {maint.status === 'scheduled' ? 'Scheduled' : maint.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border-subtle p-5 bg-canvas/30">
                      <p className="text-sm text-text-secondary mb-3">{maint.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {maint.affected_components?.map((comp: any, i: number) => (
                          <span key={i} className="px-2 py-1 rounded-lg text-xs bg-surface border border-border-subtle text-text-secondary">
                            {comp.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="pt-8 border-t border-border-subtle">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-text-secondary">
          <div>
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              About This Status Page
            </h4>
            <p className="leading-relaxed">
              This page provides real-time information about the operational status of AgentLab services.
              Data is refreshed automatically every 30 seconds over a real-time connection. Uptime is calculated based on the last 90 days of operation.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <ExternalLinkIcon className="w-4 h-4" />
              Useful Resources
            </h4>
            <ul className="space-y-1">
              <li><a href="/docs" className="hover:text-primary-blue transition-colors">API Docs &amp; Guides</a></li>
              <li><a href="/terms" className="hover:text-primary-blue transition-colors">Terms of Service &amp; SLA</a></li>
              <li><a href="/api/status" target="_blank" rel="noopener" className="hover:text-primary-blue transition-colors">Status API (JSON)</a></li>
              <li><a href="mailto:support@agentlab.dev" className="hover:text-primary-blue transition-colors">Contact Technical Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              AgentLab Commitments
            </h4>
            <ul className="space-y-1 text-xs">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> 99.9% SLA Uptime</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> Lifetime 1-to-1 exchange warranty</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> 24/7 support via Telegram</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> Money-back if delivery fails</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border-subtle text-center text-xs text-text-muted">
          <p>AgentLab - Official premium AI accounts, lifetime warranty, 24/7 SLA</p>
          <p className="mt-1">© 2024 AgentLab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default StatusPage;