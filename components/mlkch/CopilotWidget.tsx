import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot } from 'lucide-react';
import { formatRoiAmount, formatRoiAmountExact, SNAPSKILL_ROI_DIRECT, SNAPSKILL_ROI_INDIRECT, SNAPSKILL_ROI_TOTAL } from './data/snapSkillRoi';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const SNAPSKILL_ROI_REPLY =
  `SnapSkill Onboarding is tracking ${formatRoiAmount(SNAPSKILL_ROI_TOTAL)} in total annual direct and indirect ROI ` +
  `(${formatRoiAmountExact(SNAPSKILL_ROI_DIRECT)} direct savings and ${formatRoiAmountExact(SNAPSKILL_ROI_INDIRECT)} in staff time freed). ` +
  'With 113 nurses onboarded at a 96% completion rate, open the ROI breakdown on the dashboard for the conservative CFO-validated detail.';

const EXAMPLE_THREAD: ChatMessage[] = [
  {
    role: 'user',
    text: "What's the current ROI from SnapSkill Onboarding?",
  },
  {
    role: 'assistant',
    text: SNAPSKILL_ROI_REPLY,
  },
  {
    role: 'user',
    text: 'How many initiatives are currently active?',
  },
  {
    role: 'assistant',
    text: "There is 1 live initiative (SnapSkill Onboarding) and 4 in the planning pipeline for Q3 2026: the MSP Transition, SnapSkill Additional Modules, Cedars-Sinai Site Visit, and Conexiones. 5 more are in the AI Transformation Backlog.",
  },
];

const CopilotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [open]);

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 md:w-96 rounded-3xl overflow-hidden flex flex-col"
          style={{
            maxHeight: '520px',
            background:
              'linear-gradient(145deg, rgba(14,28,64,0.7) 0%, rgba(6,11,28,0.8) 100%)',
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Top specular line */}
          <div
            className="absolute top-0 left-6 right-6 h-px pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />

          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(56,189,248,0.12)',
                  border: '1px solid rgba(56,189,248,0.25)',
                }}
              >
                <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none tracking-tight">
                  OTTERWORKER I
                </p>
                <p className="text-[10px] text-white/35 mt-0.5">MLKCH · 12 Ventures</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full text-white/40 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 mlkch-scroll">
            {/* Context banner */}
            <div
              className="rounded-xl px-3.5 py-2.5 text-[11px] text-white/40 leading-relaxed"
              style={{
                background: 'rgba(56,189,248,0.05)',
                border: '1px solid rgba(56,189,248,0.12)',
              }}
            >
              Ask anything about MLKCH initiatives, metrics, and project status.
            </div>

            {EXAMPLE_THREAD.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(56,189,248,0.1)',
                      border: '1px solid rgba(56,189,248,0.2)',
                    }}
                  >
                    <Bot className="w-3 h-3 text-sky-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm text-white'
                      : 'rounded-tl-sm text-white/70'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(34,211,238,0.2))',
                          border: '1px solid rgba(56,189,248,0.2)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex-shrink-0 px-4 pb-4 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about any initiative…"
                className="flex-1 bg-transparent text-xs text-white placeholder-white/25 focus:outline-none"
              />
              <button
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity"
                style={{
                  background: inputValue
                    ? 'linear-gradient(135deg, #38bdf8, #22d3ee)'
                    : 'rgba(255,255,255,0.06)',
                  opacity: inputValue ? 1 : 0.4,
                }}
                onClick={() => setInputValue('')}
                disabled={!inputValue}
              >
                <Send className="w-3 h-3" style={{ color: inputValue ? '#060B14' : 'white' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="mlkch-intro mlkch-intro-copilot fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
        style={{
          background: open
            ? 'rgba(255,255,255,0.08)'
            : 'linear-gradient(135deg, #0ea5e9, #22d3ee)',
          border: open
            ? '1px solid rgba(255,255,255,0.15)'
            : '1px solid rgba(56,189,248,0.3)',
          boxShadow: open
            ? '0 8px 30px rgba(0,0,0,0.4)'
            : '0 0 0 4px rgba(14,165,233,0.12), 0 8px 30px rgba(14,165,233,0.35)',
        }}
      >
        {open ? (
          <X className="w-5 h-5 text-white/70" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </button>
    </>
  );
};

export default CopilotWidget;
