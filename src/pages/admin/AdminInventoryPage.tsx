import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Upload,
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';

interface MockAccountItem {
  id: string;
  tool: string;
  email: string;
  pass: string;
  pool: 'active' | 'buffer';
  status: 'available' | 'assigned' | 'compromised';
  addedAt: string;
}

const INITIAL_ACCOUNTS: MockAccountItem[] = [
  { id: 'ACC-01', tool: 'Cursor Pro', email: 'cursor.pro.batch91@gmail.com', pass: 'pX!9#vK2', pool: 'active', status: 'available', addedAt: '22/03/2026' },
  { id: 'ACC-02', tool: 'Cursor Pro', email: 'cursor.pro.batch92@gmail.com', pass: 'mQ7@zL91', pool: 'active', status: 'available', addedAt: '22/03/2026' },
  { id: 'ACC-03', tool: 'Cursor Pro', email: 'cursor.pro.buffer01@gmail.com', pass: 'bF2$xP89', pool: 'buffer', status: 'available', addedAt: '22/03/2026' },
  { id: 'ACC-04', tool: 'Claude Pro', email: 'claude.sonnet.pool1@gmail.com', pass: 'vN9#kL33', pool: 'active', status: 'available', addedAt: '22/03/2026' },
  { id: 'ACC-05', tool: 'ChatGPT Plus', email: 'gpt4o.canvas.acc1@gmail.com', pass: 'aB8*zT44', pool: 'active', status: 'available', addedAt: '22/03/2026' },
];

export const AdminInventoryPage: React.FC = () => {
  const [accounts, setAccounts] = useState<MockAccountItem[]>(INITIAL_ACCOUNTS);
  const [activePoolFilter, setActivePoolFilter] = useState<'all' | 'active' | 'buffer'>('all');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPool, setImportPool] = useState<'active' | 'buffer'>('active');

  const togglePassword = (id: string) => {
    setShowPassMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBulkImport = () => {
    if (!importText.trim()) return;
    const lines = importText.trim().split('\n');
    const newItems: MockAccountItem[] = lines.map((line, idx) => {
      const parts = line.split(',');
      return {
        id: `ACC-IMP-${Date.now()}-${idx}`,
        tool: parts[0]?.trim() || 'Cursor Pro',
        email: parts[1]?.trim() || `import_${idx}@gmail.com`,
        pass: parts[2]?.trim() || 'pass12345',
        pool: importPool,
        status: 'available',
        addedAt: '22/03/2026',
      };
    });

    setAccounts((prev) => [...newItems, ...prev]);
    setShowImportModal(false);
    setImportText('');
  };

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
            Quản Trị Kho Tài Khoản &amp; Tồn Kho Tự Động
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>Nhập Hàng Hàng Loạt (CSV / JSON)</span>
        </button>
      </div>

      {/* Stock Health Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-text-primary">Cursor Pro</span>
            <span className="text-status-success font-mono font-bold">42 Khả dụng</span>
          </div>
          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden mb-2">
            <div className="h-full bg-status-success w-3/4" />
          </div>
          <span className="text-[11px] text-text-muted">Kho Bán: 32 &bull; Kho Dự Phòng 1-Đổi-1: 10</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-text-primary">Claude Pro (Sonnet 3.7)</span>
            <span className="text-status-warning font-mono font-bold">5 Khả dụng</span>
          </div>
          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden mb-2">
            <div className="h-full bg-status-warning w-1/4" />
          </div>
          <span className="text-[11px] text-status-warning">⚠️ Cảnh báo tồn kho thấp (dưới mức 10)</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-subtle">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-text-primary">ChatGPT Plus (GPT-4.5)</span>
            <span className="text-status-success font-mono font-bold">25 Khả dụng</span>
          </div>
          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden mb-2">
            <div className="h-full bg-status-success w-2/3" />
          </div>
          <span className="text-[11px] text-text-muted">Kho Bán: 20 &bull; Kho Dự Phòng: 5</span>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
        <div className="p-4 bg-canvas/60 border-b border-border-subtle flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActivePoolFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activePoolFilter === 'all' ? 'bg-primary-blue text-white' : 'text-text-muted'
              }`}
            >
              Tất Cả ({accounts.length})
            </button>
            <button
              onClick={() => setActivePoolFilter('active')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activePoolFilter === 'active' ? 'bg-primary-blue text-white' : 'text-text-muted'
              }`}
            >
              Kho Bán Trực Tiếp
            </button>
            <button
              onClick={() => setActivePoolFilter('buffer')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activePoolFilter === 'buffer' ? 'bg-primary-blue text-white' : 'text-text-muted'
              }`}
            >
              Kho Dự Phòng 1-Đổi-1
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-canvas/80 text-[11px] font-semibold text-text-muted uppercase border-b border-border-subtle">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Công Cụ</th>
                <th className="p-4">Email Đăng Nhập</th>
                <th className="p-4">Mật Khẩu</th>
                <th className="p-4">Phân Loại Kho</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {accounts
                .filter((a) => activePoolFilter === 'all' || a.pool === activePoolFilter)
                .map((acc) => (
                  <tr key={acc.id} className="hover:bg-elevated/40">
                    <td className="p-4 font-mono font-bold text-text-primary">{acc.id}</td>
                    <td className="p-4 font-semibold text-text-primary">{acc.tool}</td>
                    <td className="p-4 font-mono text-text-primary select-all">{acc.email}</td>
                    <td className="p-4 font-mono">
                      <span className="mr-2">
                        {showPassMap[acc.id] ? acc.pass : '••••••••'}
                      </span>
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
                          Kho Bán
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 font-medium">
                          Kho Dự Phòng
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-status-success/15 text-status-success font-semibold">
                        Sẵn sàng
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() =>
                          setAccounts((prev) =>
                            prev.map((a) =>
                              a.id === acc.id ? { ...a, pool: a.pool === 'active' ? 'buffer' : 'active' } : a
                            )
                          )
                        }
                        className="text-xs text-primary-blue hover:underline mr-3"
                      >
                        Chuyển kho
                      </button>
                      <button
                        onClick={() => setAccounts((prev) => prev.filter((a) => a.id !== acc.id))}
                        className="text-xs text-status-error hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-surface border border-border-focus max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary">Nhập Hàng Hàng Loạt (Bulk Account Import)</h3>
            <p className="text-xs text-text-secondary">
              Nhập theo định dạng mỗi dòng 1 tài khoản: <code className="font-mono text-accent-cyan">Công cụ,Email,Mật khẩu</code>
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cursor Pro,cursor.batch101@gmail.com,password_strong_1&#10;Cursor Pro,cursor.batch102@gmail.com,password_strong_2"
              className="w-full p-3 rounded-xl bg-canvas border border-border-subtle font-mono text-xs text-text-primary focus:border-border-focus focus:outline-none"
            />

            <div className="flex items-center gap-4 text-xs">
              <span className="text-text-secondary">Nhập vào kho:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pool"
                  checked={importPool === 'active'}
                  onChange={() => setImportPool('active')}
                />
                <span>Kho Bán Trực Tiếp</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pool"
                  checked={importPool === 'buffer'}
                  onChange={() => setImportPool('buffer')}
                />
                <span>Kho Dự Phòng 1-Đổi-1</span>
              </label>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 h-10 rounded-xl bg-canvas border border-border-subtle text-xs font-semibold text-text-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkImport}
                className="flex-1 h-10 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold"
              >
                Thêm vào kho ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
