import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { trackEvent } from '@/utils/telemetry';

const COMMANDS = [
  'ai-pro buy --tool=cursor-pro --delivery=instant',
  'ai-pro buy --tool=claude-3-7-sonnet --plan=3mo',
  'ai-pro check --order=AIPRO-94820 --verify-sla',
];

export const TerminalSimulator: React.FC = () => {
  const [commandIndex, setCommandIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentCommand = COMMANDS[commandIndex];
    const typingSpeed = isDeleting ? 30 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentCommand.length) {
          setDisplayedText(currentCommand.substring(0, displayedText.length + 1));
        } else {
          // Pause at full text
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(currentCommand.substring(0, displayedText.length - 1));
        } else {
          setIsDeleting(false);
          setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, commandIndex]);

  const handleCopy = () => {
    navigator.clipboard.writeText(COMMANDS[commandIndex]);
    setCopied(true);
    trackEvent('terminal_command_copied', { command: COMMANDS[commandIndex] });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl bg-[#0B0E14] border border-border-subtle shadow-[0_12px_36px_rgba(0,0,0,0.5)] overflow-hidden font-mono text-xs">
      {/* Top Bar with Mac buttons */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface/80 border-b border-border-subtle/70">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block"></span>
          <span className="text-text-muted text-[11px] ml-2">bash - ai-pro-cli v1.0.0</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface hover:bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-status-success" />
              <span className="text-status-success font-semibold">Copied! ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Command</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Typing Body */}
      <div className="p-4 flex items-center gap-2 text-text-primary">
        <span className="text-accent-cyan font-bold select-none">&gt;</span>
        <span className="text-text-primary">{displayedText}</span>
        <span className="w-2 h-4 bg-accent-cyan animate-pulse inline-block"></span>
      </div>
    </div>
  );
};
