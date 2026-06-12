import React from 'react';
import AnimatedMetricValue from './AnimatedMetricValue';

interface MetricCardProps {
  label: string;
  value: string;
  accent?: 'teal' | 'sky' | 'purple' | 'green';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const ACCENT_COLORS: Record<NonNullable<MetricCardProps['accent']>, { text: string; glow: string; border: string; bg: string }> = {
  teal:   { text: '#2dd4bf', glow: 'rgba(45,212,191,0.18)',  border: 'rgba(45,212,191,0.2)',  bg: 'rgba(45,212,191,0.06)' },
  sky:    { text: '#38bdf8', glow: 'rgba(56,189,248,0.18)',  border: 'rgba(56,189,248,0.2)',  bg: 'rgba(56,189,248,0.06)' },
  purple: { text: '#a78bfa', glow: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.2)', bg: 'rgba(167,139,250,0.06)' },
  green:  { text: '#4ade80', glow: 'rgba(74,222,128,0.18)',  border: 'rgba(74,222,128,0.2)',  bg: 'rgba(74,222,128,0.06)' },
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  accent = 'sky',
  icon,
  onClick,
}) => {
  const colors = ACCENT_COLORS[accent];
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`relative rounded-2xl px-5 py-4 overflow-hidden ${
        interactive ? 'cursor-pointer transition-all duration-200 hover:scale-[1.01]' : ''
      }`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              (e.currentTarget as HTMLElement).style.border = `1px solid ${colors.border}`;
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)';
            }
          : undefined
      }
    >
      {/* Accent glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 10% 100%, ${colors.glow}, transparent 70%)`,
        }}
      />

      {/* Value + icon row */}
      <div className="relative flex items-center justify-between gap-2">
        <AnimatedMetricValue
          value={value}
          className="text-3xl font-black leading-none tracking-tight"
          style={{ color: colors.text }}
        />
        {icon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
          >
            <span style={{ color: colors.text }}>{icon}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="relative text-xs font-semibold text-white/50 uppercase tracking-wide mt-2">
        {label}
      </p>
    </div>
  );
};

export default MetricCard;
