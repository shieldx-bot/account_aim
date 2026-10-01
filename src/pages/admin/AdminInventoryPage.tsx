import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { inventoryApi } from '@/services/api';

/** Inventory row returned by GET /api/admin/inventory (table inventory_accounts) */
interface AccountRow {
  id: string;
  tool: string;
  productId?: string | null;
  email: string;
  pass: string;
  pool: 'active' | 'buffer';
  status: 'available' | 'assigned' | 'compromised';
  assignedOrderId?: string | null;
  addedAt: string;
}

interface StockSummary {
  tool: string;
  activeAvailable: number;
  bufferAvailable: number;
  total: number;
}

export const AdminInventoryPage: React.FC = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [activePoolFilter, setActivePoolFilter] = useState<'all' | 'active' | 'buffer'>('all');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPool, setImportPool] = useState<'active' | 'buffer'>('active');
  const [importing, setImporting] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getAccounts(token);
      setAccounts(res.accounts || []);
      setStockSummary(res.stockSummary || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load account inventory from the database.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const togglePassword = (id: string) => {
    setShowPassMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // POST /api/admin/inventory/bulk -> INSERT into PostgreSQL
  const handleBulkImport = async () => {
    if (!token || !importText.trim()) return;
    const lines = importText.trim().split('\n');
    const items = lines
      .map((line) => {
        const parts = line.split(',');
        return {
          tool: parts[0]?.trim() || '',
          email: parts[1]?.trim() || '',
          pass: parts[2]?.trim() || '',
        };
      })
      .filter((i) => i.tool && i.email && i.pass);

    if (items.length === 0) {
      alert('No valid lines found. Format per line: Tool,Email,Password');
      return;
    }

    setImporting(true);
    try {
      await inventoryApi.bulkImport(token, items, importPool);
      setShowImportModal(false);
      setImportText('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Bulk import failed.');
    } finally {
      setImporting(false);
    }
  };

  // PATCH /api/admin/inventory/:id/pool -> UPDATE in PostgreSQL
  const handleMovePool = async (acc: AccountRow) => {
    if (!token) return;
    setBusyId(acc.id);
    try {
      await inventoryApi.movePool(token, acc.id);
      setAccounts((prev) =>
        prev.map((a) => (a.id === acc.id ? { ...a, pool: a.pool === 'active' ? 'buffer' : 'active' } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Unable to move the account to another pool.');
    } finally {
      setBusyId(null);
    }
  };

  // DELETE /api/admin/inventory/:id -> DELETE in PostgreSQL
  const handleDelete = async (acc: AccountRow) => {
    if (!token) return;
    if (!confirm(`Permanently delete account ${acc.email} from the database?`)) return;
    setBusyId(acc.id);
    try {
      await inventoryApi.deleteAccount(token, acc.id);
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
    } catch (err: any) {
      alert(err.message || 'Unable to delete the account.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredAccounts = accounts.filter((a) => activePoolFilter === 'all' || a.pool === activePoolFilter);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-20 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <Link to="/admin/orders" className="hover:text-text-primary">Admin Console</Link>
            <span>/</span>
            <span className="text-text-primary font-bold">Inventory Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary mt-1 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary-blue" />
            Account Inventory &amp; Automated Stock Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchInventory}
            className="p-2 rounded-lg bg-surface border border-border-subtle text-text-muted hover:text-text-primary"
            title="Reload from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import (CSV / JSON)</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold my-6">
          ⚠️ {error} — check the PostgreSQL backend connection.
        </div>
      )}

      {/* Stock Health Gauges (live GROUP BY tool from DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {loading ? (
          <div className="sm:col-span-3 p-8 rounded-2xl bg-surface border border-border-subtle text-center text-text-muted text-xs">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Aggregating stock from the database...
          </div>
        ) : stockSummary.length === 0 ? (
          <div className="sm:col-span-3 p-8 rounded-2xl bg-surface border border-border-subtle text-center text-text-muted text-xs">
            Inventory is empty — click "Bulk Import" to add the first account.
          </div>
        ) : (
          stockSummary.map((s) => {
            const available = s.activeAvailable + s.bufferAvailable;
            const lowStock = available < 10;
            const pct = Math.min(100, Math.round((available / Math.max(s.total, 1)) * 100));
            return (
              <div key={s.tool} className="p-5 rounded-2xl bg-surface border border-border-subtle">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-text-primary">{s.tool}</span>
                  <span className={`font-mono font-bold ${lowStock ? 'text-status-warning' : 'text-status-success'}`}>
                    {available} Available
                  </span>
                </div>
                <div className="w-full h-2 bg-canvas rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${lowStock ? 'bg-status-warning' : 'bg-status-success'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-[11px] ${lowStock ? 'text-status-warning' : 'text-text-muted'}`}>
                  {lowStock
                    ? '⚠️ Low stock warning (below 10)'
                    : `Sales Pool: ${s.activeAvailable} • 1-for-1 Backup Pool: ${s.bufferAvailable}`}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
        <div className="p-4 bg-canvas/60 border-b border-border-subtle flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'active', 'buffer'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePoolFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  activePoolFilter === p ? 'bg-primary-blue text-white' : 'text-text-muted'
                }`}
              >
                {p === 'all'
                  ? `All (${accounts.length})`
                  : p === 'active'
                  ? 'Sales Pool'
                  : '1-for-1 Backup Pool'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-canvas/80 text-[11px] font-semibold text-text-muted uppercase border-b border-border-subtle">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Tool</th>
                <th className="p-4">Login Email</th>
                <th className="p-4">Password</th>
                <th className="p-4">Pool</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading account inventory from the database...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-text-muted">
                    No accounts in this pool yet.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-elevated/40">
                    <td className="p-4 font-mono font-bold text-text-primary">{acc.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4 font-semibold text-text-primary">{acc.tool}</td>
                    <td className="p-4 font-mono text-text-primary select-all">{acc.email}</td>
                    <td className="p-4 font-mono">
                      <span className="mr-2">{showPassMap[acc.id] ? acc.pass : '••••••••'}</span>
                      <button
                        onClick={() => togglePassword(acc.id)}
                        className="text-text-muted hover:text-text-primary"
                      >
                        {showPassMap[acc.id] ? <EyeOff className="w-3.5 h-3.5 inline" /> : <Eye className="w-3.5 h-3.5 inline" />}
                      </button>
                    </td>
                    <td className="p-4">
                      {acc.pool === 'active' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-primary-blue/10 text-primary-blue border border-primary-blue/30 font-medium">
                          Sales Pool
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 font-medium">
                          Backup Pool
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {acc.status === 'available' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-status-success/15 text-status-success font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Available
                        </span>
                      )}
                      {acc.status === 'assigned' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-canvas text-text-muted border border-border-subtle font-semibold">
                          Assigned to order
                        </span>
                      )}
                      {acc.status === 'compromised' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-status-error/15 text-status-error font-semibold flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Compromised
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {busyId === acc.id && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-2 text-accent-cyan" />}
                      <button
                        disabled={busyId === acc.id}
                        onClick={() => handleMovePool(acc)}
                        className="text-xs text-primary-blue hover:underline mr-3 disabled:opacity-40"
                      >
                        Move pool
                      </button>
                      <button
                        disabled={busyId === acc.id}
                        onClick={() => handleDelete(acc)}
                        className="text-xs text-status-error hover:underline disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-surface border border-border-focus max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary">Bulk Import (Bulk Account Import)</h3>
            <p className="text-xs text-text-secondary">
              Enter one account per line in the format:{' '}
              <code className="font-mono text-accent-cyan">Tool,Email,Password</code>. Data is written directly
              to the <span className="font-mono">inventory_accounts</span> table.
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'Cursor Pro,cursor.batch101@gmail.com,password_strong_1\nCursor Pro,cursor.batch102@gmail.com,password_strong_2'}
              className="w-full p-3 rounded-xl bg-canvas border border-border-subtle font-mono text-xs text-text-primary focus:border-border-focus focus:outline-none"
            />

            <div className="flex items-center gap-4 text-xs">
              <span className="text-text-secondary">Import into pool:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="pool" checked={importPool === 'active'} onChange={() => setImportPool('active')} />
                <span>Sales Pool</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="pool" checked={importPool === 'buffer'} onChange={() => setImportPool('buffer')} />
                <span>1-for-1 Backup Pool</span>
              </label>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 h-10 rounded-xl bg-canvas border border-border-subtle text-xs font-semibold text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={importing}
                className="flex-1 h-10 rounded-xl bg-primary-blue hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add to inventory now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
