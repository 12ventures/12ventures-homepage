import React, { useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import type { Initiative, InitiativeSection } from './data/initiatives';

interface InitiativeModalProps {
  initiative: Initiative;
  onClose: () => void;
}

const SECTION_ACCENT: Record<InitiativeSection, { text: string; glow: string; border: string; bg: string }> = {
  live:    { text: '#2dd4bf', glow: 'rgba(45,212,191,0.15)',  border: 'rgba(45,212,191,0.25)',  bg: 'rgba(45,212,191,0.08)' },
  next:    { text: '#38bdf8', glow: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.25)',  bg: 'rgba(56,189,248,0.08)' },
  backlog: { text: '#94a3b8', glow: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.2)',  bg: 'rgba(100,116,139,0.06)' },
};

const STATUS_LABELS: Record<Initiative['status'], string> = {
  active: 'Live',
  planning: 'Planning',
  backlog: 'Backlog',
};

const InitiativeModal: React.FC<InitiativeModalProps> = ({ initiative, onClose }) => {
  const accent = SECTION_ACCENT[initiative.section];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Frosted backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl rounded-3xl overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, rgba(20,45,90,0.5) 0%, rgba(6,11,28,0.7) 100%)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow:
            '0 40px 100px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 0.5px rgba(255,255,255,0.04)',
        }}
      >
        {/* Top specular highlight */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          }}
        />

        {/* Accent glow from corner */}
        <div
          className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: accent.glow, filter: 'blur(40px)' }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 rounded-full transition-colors text-white/50 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 md:p-8">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5 pr-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full"
                  style={{
                    background: accent.bg,
                    color: accent.text,
                    border: `1px solid ${accent.border}`,
                  }}
                >
                  {STATUS_LABELS[initiative.status]}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                {initiative.title}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-white/55 leading-relaxed mb-6">
            {initiative.description}
          </p>

          {/* Metrics grid */}
          {initiative.metrics && initiative.metrics.length > 0 && (
            <div className="mb-6">
              <p
                className="text-[10px] font-bold tracking-widest uppercase mb-3"
                style={{ color: accent.text }}
              >
                Key Metrics
              </p>
              <div className="grid grid-cols-2 gap-2">
                {initiative.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <p
                      className="text-base font-black leading-none mb-1"
                      style={{ color: accent.text }}
                    >
                      {m.value}
                    </p>
                    <p className="text-[11px] text-white/40">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-items */}
          {initiative.subItems && initiative.subItems.length > 0 && (
            <div className="mb-6">
              <p
                className="text-[10px] font-bold tracking-widest uppercase mb-3"
                style={{ color: accent.text }}
              >
                Work Items
              </p>
              <ul className="space-y-2">
                {initiative.subItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: accent.text }}
                    />
                    <span className="text-sm text-white/60">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {initiative.tags && initiative.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <Tag className="w-3 h-3 text-white/20" />
              {initiative.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2.5 py-1 rounded-full text-white/40"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitiativeModal;
