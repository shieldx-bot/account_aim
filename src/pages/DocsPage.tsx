import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Terminal, CheckSquare, Square, ThumbsUp, ThumbsDown } from 'lucide-react';

const GUIDES = [
  {
    id: 'cursor-pro',
    title: 'Hướng Dẫn Cấu Hình Cursor Pro & Session Cookie',
    steps: [
      {
        step: 1,
        title: 'Đăng xuất tài khoản cũ trên Cursor',
        desc: 'Mở Cursor > Bấm vào bánh răng Cài đặt góc trên bên phải > Chọn Sign Out tài khoản hiện tại.',
      },
      {
        step: 2,
        title: 'Đăng nhập bằng tài khoản được cấp',
        desc: 'Bấm Sign In và điền Email & Mật khẩu từ License Vault của bạn. Nếu hệ thống yêu cầu mã 2FA, mở Google Authenticator hoặc copy mã 2FA Secret được cấp.',
      },
      {
        step: 3,
        title: 'Kiểm tra hạn ngạch Pro Quota',
        desc: 'Vào Settings > Models > Kiểm tra mục "Pro Subscription Active: 500 Fast Requests". Hãy bật mô hình Claude 3.7 Sonnet và GPT-4o để trải nghiệm.',
      },
    ],
  },
  {
    id: 'claude-pro',
    title: 'Hướng Dẫn Chấp Nhận Lời Mời Claude Team / Pro',
    steps: [
      {
        step: 1,
        title: 'Mở hòm thư cá nhân',
        desc: 'Tìm email có tiêu đề "Anthropic has invited you to Claude Team / Pro" (Kiểm tra cả hòm thư Spam/Promotions).',
      },
      {
        step: 2,
        title: 'Bấm "Accept Invitation"',
        desc: 'Nhấn vào nút xác nhận trong email để liên kết trực tiếp vào tài khoản Claude sẵn có của bạn mà không mất lịch sử chat cũ.',
      },
    ],
  },
  {
    id: 'github-copilot',
    title: 'Kích Hoạt GitHub Copilot Trên VS Code & JetBrains',
    steps: [
      {
        step: 1,
        title: 'Cài Extension GitHub Copilot',
        desc: 'Mở Extensions Marketplace trên VS Code hoặc Plugin Marketplace trên IntelliJ > Tìm và cài đặt GitHub Copilot & GitHub Copilot Chat.',
      },
      {
        step: 2,
        title: 'Đăng nhập tài khoản GitHub đã nâng cấp',
        desc: 'Bấm vào biểu tượng tài khoản góc trái dưới cùng và chọn "Sign in with GitHub" để kích hoạt bản quyền Copilot Pro.',
      },
    ],
  },
];

export const DocsPage: React.FC = () => {
  const [activeGuideId, setActiveGuideId] = useState('cursor-pro');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const activeGuide = GUIDES.find((g) => g.id === activeGuideId) || GUIDES[0];

  const toggleCheck = (stepId: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-24 font-sans">
      <div className="mb-8">
        <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider block">
          Developer Documentation
        </span>
        <h1 className="text-3xl font-extrabold text-text-primary mt-1">
          Tài Liệu Hướng Dẫn Kích Hoạt &amp; Xử Lý Lỗi IDE
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Từng bước cụ thể để lập trình viên cấu hình bản quyền vào Cursor, VS Code, JetBrains nhanh nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Menu */}
        <div className="md:col-span-4 space-y-2">
          {GUIDES.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setActiveGuideId(g.id);
                setFeedback(null);
              }}
              className={`w-full p-3.5 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                activeGuideId === g.id
                  ? 'bg-primary-blue text-white shadow-sm'
                  : 'bg-surface hover:bg-elevated text-text-secondary border border-border-subtle'
              }`}
            >
              <span>{g.title}</span>
            </button>
          ))}
        </div>

        {/* Right Guide Content Area */}
        <div className="md:col-span-8 p-6 sm:p-8 rounded-2xl bg-surface border border-border-subtle space-y-6">
          <h2 className="text-xl font-bold text-text-primary">{activeGuide.title}</h2>

          <div className="space-y-4">
            {activeGuide.steps.map((st) => {
              const stepKey = `${activeGuide.id}-${st.step}`;
              const isChecked = checkedSteps[stepKey] || false;

              return (
                <div
                  key={st.step}
                  onClick={() => toggleCheck(stepKey)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked ? 'bg-status-success/5 border-status-success/30' : 'bg-canvas border-border-subtle'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button type="button" className="mt-0.5 text-text-muted hover:text-text-primary">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-status-success" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <h4 className={`text-xs font-bold ${isChecked ? 'text-status-success line-through' : 'text-text-primary'}`}>
                        Bước {st.step}: {st.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">{st.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Widget */}
          <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-text-muted">Tài liệu này có hữu ích cho bạn không?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedback('yes')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  feedback === 'yes' ? 'bg-status-success text-black border-status-success' : 'bg-canvas border-border-subtle text-text-secondary'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Có, rất hữu ích
              </button>
              <button
                type="button"
                onClick={() => setFeedback('no')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  feedback === 'no' ? 'bg-status-error text-white border-status-error' : 'bg-canvas border-border-subtle text-text-secondary'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Chưa giải quyết được
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
