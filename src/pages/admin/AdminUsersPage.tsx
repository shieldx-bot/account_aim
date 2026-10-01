import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, usdToVnd } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/services/api';
import {
  Search,
  Loader2,
  RefreshCw,
} from 'lucide-react';

/** User row returned by GET /api/admin/users (PostgreSQL) */
interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  balanceVND: number;
  balanceUSD: number;
  tier: 'Standard' | 'VIP Dev' | 'Enterprise';
  phone?: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpentVND: number;
  status: 'active' | 'banned';
}

export const AdminUsersPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'member' | 'admin'>('all');

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllUsers(token);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load the member list from the database.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = selectedRole === 'all' || u.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, selectedRole]);

  // PATCH /api/admin/users/:id/role → PostgreSQL
  const handleToggleRole = async (u: AdminUserRow) => {
    if (!token) return;
    const nextRole: UserRole = u.role === 'admin' ? 'member' : 'admin';
    setBusyId(u.id);
    try {
      await adminApi.updateUserRole(token, u.id, nextRole);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
    } catch (err: any) {
      alert(err.message || 'Unable to change the role.');
    } finally {
      setBusyId(null);
    }
  };

  // POST /api/admin/users/:id/balance → PostgreSQL
  const handleAddBalance = async (u: AdminUserRow) => {
    if (!token) return;
    const amountUSD = 8; // $8 quick credit
    const amount = usdToVnd(amountUSD);
    setBusyId(u.id);
    try {
      await adminApi.addUserBalance(token, u.id, amount);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, balanceVND: x.balanceVND + amount } : x)));
    } catch (err: any) {
      alert(err.message || 'Unable to add balance.');
    } finally {
      setBusyId(null);
    }
  };

  // PATCH /api/admin/users/:id/status → PostgreSQL
  const handleToggleStatus = async (u: AdminUserRow) => {
    if (!token) return;
    const nextStatus = u.status === 'active' ? 'banned' : 'active';
    setBusyId(u.id);
    try {
      await adminApi.updateUserStatus(token, u.id, nextStatus);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x)));
    } catch (err: any) {
      alert(err.message || 'Unable to update the account status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
            Member Management &amp; Role Control
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Realtime data from the <span className="font-mono text-accent-cyan">public.users</span> table — PostgreSQL.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-3 py-2 rounded-xl bg-surface hover:bg-elevated border border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent-cyan ${loading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-border-subtle font-sans">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member name or email..."
            className="w-full pl-10 pr-4 py-2 bg-canvas border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-status-error font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'member', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                selectedRole === role
                  ? 'bg-status-error text-white font-bold'
                  : 'bg-canvas text-text-secondary hover:text-text-primary border border-border-subtle'
              }`}
            >
              {role === 'all' ? 'All' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Role / Tier</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Orders / Total Spent</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-text-muted font-sans">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading members from the database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-text-muted font-sans">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="py-4 px-4 font-sans">
                      <span className="font-bold text-text-primary block">{u.name}</span>
                      <span className="text-[11px] text-text-muted font-mono">{u.email}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            u.role === 'admin'
                              ? 'bg-status-error/20 text-status-error border border-status-error/30'
                              : 'bg-primary-blue/20 text-accent-cyan border border-primary-blue/30'
                          }`}
                        >
                          {u.role}
                        </span>
                        <span className="text-[10px] text-text-secondary">({u.tier})</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-status-success font-mono">
                      ${(u.balanceUSD ?? u.balanceVND / 25000).toFixed(2)}
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="text-text-primary font-semibold">{u.ordersCount} orders</span>
                      <span className="text-[10px] text-text-muted block">
                        ${(u.totalSpentVND / 25000).toFixed(2)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-status-error/15 text-status-error'
                        }`}
                      >
                        {u.status === 'active' ? 'Active' : 'Banned'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-sans">
                      <div className="inline-flex items-center gap-1.5">
                        {busyId === u.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-cyan" />}
                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleAddBalance(u)}
                          className="p-1.5 rounded-lg bg-canvas hover:bg-surface-subtle border border-border-subtle text-status-success hover:border-status-success text-[11px] font-semibold disabled:opacity-40"
                          title="Add $8 bonus credit (writes to DB)"
                        >
                          +$8
                        </button>

                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleToggleRole(u)}
                          className="p-1.5 rounded-lg bg-canvas hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-text-primary text-[11px] font-semibold disabled:opacity-40"
                          title="Change role (writes to DB)"
                        >
                          {u.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                        </button>

                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border text-[11px] font-semibold disabled:opacity-40 ${
                            u.status === 'active'
                              ? 'bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/20'
                              : 'bg-status-success/10 border-status-success/30 text-status-success'
                          }`}
                          title="Ban / Unban (writes to DB)"
                        >
                          {u.status === 'active' ? 'Ban' : 'Unban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
