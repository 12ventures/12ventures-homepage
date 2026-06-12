import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import AnimatedMetricValue from './AnimatedMetricValue';
import type { ROIBreakdown } from './data/snapSkillRoi';
import { formatRoiAmount } from './data/snapSkillRoi';

interface ROIBreakdownModalProps {
  breakdown: ROIBreakdown;
  onClose: () => void;
}

const ACCENT = {
  text: '#2dd4bf',
  bg: 'rgba(45,212,191,0.08)',
  border: 'rgba(45,212,191,0.25)',
  glow: 'rgba(45,212,191,0.12)',
};

const ROIBreakdownModal: React.FC<ROIBreakdownModalProps> = ({ breakdown, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{
          background:
            'linear-gradient(145deg, rgba(20,45,90,0.5) 0%, rgba(6,11,28,0.7) 100%)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow:
            '0 40px 100px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 rounded-full transition-colors text-white/50 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 md:p-8 flex flex-col min-h-0">
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-2"
            style={{ color: ACCENT.text }}
          >
            ROI Breakdown
          </p>
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-6 pr-8">
            {breakdown.title}
          </h2>

          <div className="mlkch-scroll overflow-y-auto flex-1 min-h-0 space-y-1.5 pr-1">
            {breakdown.rows.map((row, i) => {
              const isSubtotal = row.variant === 'subtotal';
              const isTotal = row.variant === 'total';

              return (
                <div
                  key={`${row.label}-${i}`}
                  className="mlkch-roi-row flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                  style={{
                    animationDelay: `${i * 70}ms`,
                    background: isTotal
                      ? ACCENT.glow
                      : isSubtotal
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    border: isTotal
                      ? `1px solid ${ACCENT.border}`
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    className={`text-sm leading-snug ${
                      isTotal
                        ? 'font-bold text-white'
                        : isSubtotal
                        ? 'font-semibold text-white/75'
                        : 'text-white/55'
                    }`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`flex-shrink-0 tabular-nums ${
                      isTotal
                        ? 'text-lg font-black'
                        : isSubtotal
                        ? 'text-sm font-bold'
                        : 'text-sm font-semibold'
                    }`}
                    style={{ color: isTotal || isSubtotal ? ACCENT.text : 'rgba(255,255,255,0.7)' }}
                  >
                    {isTotal ? (
                      <AnimatedMetricValue value={row.value} />
                    ) : (
                      row.value
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="mt-5 pt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="min-w-0">
              {breakdown.sourceUrl && (
                <a
                  href={breakdown.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
                  style={{ color: ACCENT.text }}
                >
                  {breakdown.sourceLabel ?? 'Link to ROI source calculation'}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70" />
                </a>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">
                Annual total
              </span>
              <AnimatedMetricValue
                value={formatRoiAmount(breakdown.total)}
                className="text-2xl font-black"
                style={{ color: ACCENT.text }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIBreakdownModal;
