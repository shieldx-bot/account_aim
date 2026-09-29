import React, { useState, useMemo } from 'react';
import { User, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  Ban,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  Filter,
  UserCheck,
  Mail,
} from 'lucide-react';

interface MockUserEntry extends User {
  ordersCount: number;
  totalSpentVND: number;
  status: 'active' | 'banned';
}

const INITIAL_USERS: MockUserEntry[] = [
  {
    id: 'usr-member-8829',
    email: 'alex.dev@gmail.com',
    name: 'Alex Nguyễn',
    role: 'member',
    balanceVND: 650000,
    balanceUSD: 25.5,
    tier: 'VIP Dev',
    createdAt: '2025-01-15',
    ordersCount: 3,
    totalSpentVND: 1647000,
    status: 'active',
  },
  {
    id: 'usr-member-3312',
    email: 'jane.fullstack@outlook.com',
    name: 'Jane Trần',
    role: 'member',
    balanceVND: 120000,
    balanceUSD: 4.8,
    tier: 'Standard',
    createdAt: '2025-02-10',
    ordersCount: 1,
    totalSpentVND: 249000,
    status: 'active',
  },
  {
    id: 'usr-member-5521',
    email: 'minh.techlead@vng.com',
    name: 'Minh Lê (TechLead)',
    role: 'member',
    balanceVND: 2400000,
    balanceUSD: 96.0,
    tier: 'Enterprise',
    createdAt: '2024-12-05',
    ordersCount: 8,
    totalSpentVND: 5490000,
    status: 'active',
  },
  {
    id: 'usr-admin-0001',
    email: 'admin@aipro.dev',
    name: 'Root Operator',
    role: 'admin',
    balanceVND: 99999999,
    balanceUSD: 4000.0,
    tier: 'Enterprise',
    createdAt: '2024-11-01',
    ordersCount: 0,
    totalSpentVND: 0,
    status: 'active',
  },
];

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<MockUserEntry[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'member' | 'admin'>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = selectedRole === 'all' || u.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, selectedRole]);

  const handleToggleRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextRole: UserRole = u.role === 'admin' ? 'member' : 'admin';
          return { ...u, role: nextRole };
        }
        return u;
      })
    );
  };

  const handleAddBalance = (userId: string) => {
    const amount = 200000;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, balanceVND: u.balanceVND + amount } : u))
    );
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'banned' : 'active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
            Quản Lý Thành Viên &amp; Phân Quyền
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Theo dõi người dùng đăng ký, điều chỉnh số dư ví, nâng cấp VIP và quản trị Role.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0d0f14] p-4 rounded-2xl border border-border-subtle font-sans">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc email thành viên..."
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
              {role === 'all' ? 'Tất cả' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0d0f14] border border-border-subtle rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border-subtle text-text-muted uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Thành Viên</th>
                <th className="py-3.5 px-4">Role / Cấp bậc</th>
                <th className="py-3.5 px-4">Số Dư Ví</th>
                <th className="py-3.5 px-4">Tổng Đơn / Chi Tiêu</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredUsers.map((u) => (
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
                    {u.balanceVND.toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="py-4 px-4 font-mono">
                    <span className="text-text-primary font-semibold">{u.ordersCount} đơn</span>
                    <span className="text-[10px] text-text-muted block">
                      {u.totalSpentVND.toLocaleString('vi-VN')} ₫
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
                      {u.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right font-sans">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddBalance(u.id)}
                        className="p-1.5 rounded-lg bg-canvas hover:bg-canvas-subtle border border-border-subtle text-status-success hover:border-status-success text-[11px] font-semibold"
                        title="Nạp thưởng +200k"
                      >
                        +200k ₫
                      </button>

                      <button
                        onClick={() => handleToggleRole(u.id)}
                        className="p-1.5 rounded-lg bg-canvas hover:bg-canvas-subtle border border-border-subtle text-text-secondary hover:text-text-primary text-[11px] font-semibold"
                        title="Đổi vai trò"
                      >
                        {u.role === 'admin' ? 'Hạ Member' : 'Lên Admin'}
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`p-1.5 rounded-lg border text-[11px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/20'
                            : 'bg-status-success/10 border-status-success/30 text-status-success'
                        }`}
                        title="Khóa / Mở khóa"
                      >
                        {u.status === 'active' ? 'Khóa' : 'Mở'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
