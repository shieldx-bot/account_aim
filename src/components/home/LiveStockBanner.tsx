import React from 'react';
import { useApp } from '@/context/AppContext';
import { Shield, RefreshCw, Zap, Server, Clock } from 'lucide-react';

export const LiveStockBanner: React.FC = () => {
  const { products, isLoadingProducts } = useApp();

  const totalStock = products.reduce((acc, p) => acc + (p.stockCount || 0), 0);
  const activeProductsCount = products.length;

  return (
    <div className="w-full my-6 p-4 rounded-2xl bg-gradient-to-r from-surface via-surface to-canvas border border-border-subtle shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Live Warehouse Telemetry */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-status-success"></span>
        </span>
        <div className="text-xs">
          <span className="font-semibold text-text-primary">
            Kho Bản Quyền Tự Động:{' '}
          </span>
          <span className="text-status-success font-mono font-bold">
            {isLoadingProducts ? '...' : `${totalStock} tài khoản`}
          </span>{' '}
          <span className="text-text-muted">
            thuộc {activeProductsCount} danh mục AI cao cấp sẵn sàng bàn giao &lt; 30 giây.
          </span>
        </div>
      </div>

      {/* SLA Guarantees */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary self-start md:self-auto shrink-0">
        <div className="flex items-center gap-1.5 bg-canvas/60 px-2.5 py-1 rounded-lg border border-border-subtle">
          <Zap className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-mono text-[11px]">SLA &lt; 30s</span>
        </div>
        <div className="flex items-center gap-1.5 bg-canvas/60 px-2.5 py-1 rounded-lg border border-border-subtle">
          <Shield className="w-3.5 h-3.5 text-status-success" />
          <span className="font-mono text-[11px]">Bảo hành 1-đổi-1</span>
        </div>
        <div className="flex items-center gap-1.5 bg-canvas/60 px-2.5 py-1 rounded-lg border border-border-subtle">
          <RefreshCw className="w-3.5 h-3.5 text-primary-blue" />
          <span className="font-mono text-[11px]">Bot RMA 60s</span>
        </div>
      </div>
    </div>
  );
};
