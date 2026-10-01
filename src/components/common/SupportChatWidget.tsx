import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! I'm the AgentLab consultation assistant. Ask me anything about our AI accounts, pricing, PayPal payment, delivery SLA or the 1-for-1 warranty — I answer instantly, 24/7.",
};

export const SupportChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m !== GREETING)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const body = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            body?.data?.reply ||
            body?.message ||
            'Sorry, I could not answer right now. Please try again or contact us on Telegram: https://t.me/aipro_support',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection error. Please try again or reach us on Telegram: https://t.me/aipro_support',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-primary-blue hover:bg-primary-hover text-white shadow-2xl shadow-primary-blue/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-status-success border-2 border-surface" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] h-[520px] max-h-[75vh] rounded-2xl bg-surface border border-border-subtle shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="px-4 py-3 bg-primary-blue text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">AgentLab Support · Grok AI</p>
                <p className="text-[10px] text-white/70 leading-tight">
                  Instant consultation · 24/7 · business-profile grounded
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMessages([GREETING])}
              title="Reset conversation"
              className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-canvas">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === 'user'
                      ? 'bg-primary-blue text-white rounded-br-md'
                      : 'bg-surface border border-border-subtle text-text-primary rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-surface border border-border-subtle flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-blue" />
                  <span className="text-[10px] text-text-muted">Grok is typing…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border-subtle bg-surface flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about pricing, payment, warranty…"
              disabled={isSending}
              className="flex-1 px-3 py-2 rounded-xl bg-canvas border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-blue disabled:opacity-60"
            />
            <button
              type="button"
              onClick={send}
              disabled={isSending || !input.trim()}
              className="w-9 h-9 rounded-xl bg-primary-blue hover:bg-primary-hover text-white flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
