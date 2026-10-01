import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [cmdInput, setCmdInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'agentlab:~$ curl -I ${window.location.origin}' + (typeof window !== 'undefined' ? window.location.pathname : '/404'),
    'HTTP/2 404 Not Found',
    'Error: The requested route does not exist on this server.',
    "Type 'help' to see available navigation commands or click below.",
  ]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cmdInput.trim().toLowerCase();
    if (!cmd) return;

    const newHistory = [...history, `agentlab:~$ ${cmdInput}`];

    if (cmd === 'help') {
      newHistory.push(
        'Available commands:',
        '  home      - Return to homepage (/)',
        '  catalog   - View AI catalog (/#catalog)',
        '  lookup    - Go to order lookup page (/lookup)',
        '  status    - View system health status (/status)',
        '  docs      - Open developer setup guides (/docs)',
        '  clear     - Clear terminal screen'
      );
    } else if (cmd === 'home' || cmd === 'cd /') {
      navigate('/');
      return;
    } else if (cmd === 'lookup') {
      navigate('/lookup');
      return;
    } else if (cmd === 'status') {
      navigate('/status');
      return;
    } else if (cmd === 'docs') {
      navigate('/docs');
      return;
    } else if (cmd === 'clear') {
      setHistory(['agentlab:~$ [Terminal cleared]']);
      setCmdInput('');
      return;
    } else {
      newHistory.push(`bash: command not found: ${cmd}. Type 'help' for suggestions.`);
    }

    setHistory(newHistory);
    setCmdInput('');
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 py-16 font-mono text-xs">
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle shadow-2xl space-y-4">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="text-text-muted text-[11px] ml-2">bash - 404 Route Not Found</span>
          </div>
          <Link to="/" className="text-primary-blue hover:underline text-[11px] flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to home
          </Link>
        </div>

        {/* History Output */}
        <div className="space-y-1.5 text-text-secondary leading-relaxed py-2">
          {history.map((line, idx) => (
            <div
              key={idx}
              className={line.startsWith('HTTP/2 404') ? 'text-status-error font-bold' : line.startsWith('agentlab:') ? 'text-text-primary' : ''}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Interactive Prompt Input */}
        <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2 border-t border-border-subtle/60">
          <span className="text-accent-cyan font-bold select-none">&gt;</span>
          <input
            type="text"
            autoFocus
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Type 'home', 'lookup', or 'help'..."
            className="flex-1 bg-transparent text-text-primary focus:outline-none text-xs font-mono"
          />
        </form>
      </div>
    </div>
  );
};
