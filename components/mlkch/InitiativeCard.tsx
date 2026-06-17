import React from 'react';
import type { Initiative } from './data/initiatives';
import { hexToRgb } from './data/initiatives';

interface InitiativeCardProps {
  initiative: Initiative;
  accentColor: string;
  onClick: (initiative: Initiative) => void;
  isSelected?: boolean;
  compact?: boolean;
}

function stylesFromAccent(accentColor: string) {
  const rgb = hexToRgb(accentColor);
  return {
    badgeBg: `rgba(${rgb},0.12)`,
    badgeText: accentColor,
    badgeBorder: `rgba(${rgb},0.25)`,
    dotColor: accentColor,
    selectedBg: `rgba(${rgb},0.07)`,
    selectedBorder: `rgba(${rgb},0.35)`,
  };
}

const STATUS_LABELS: Record<Initiative['status'], string> = {
  active:   'Live',
  planning: 'Active',
  backlog:  'Planning',
};

const InitiativeCard: React.FC<InitiativeCardProps> = ({
  initiative,
  accentColor,
  onClick,
  isSelected = false,
  compact = false,
}) => {
  const s = stylesFromAccent(accentColor);

  const bg     = isSelected ? s.selectedBg     : 'rgba(255,255,255,0.02)';
  const border = isSelected ? s.selectedBorder : 'rgba(255,255,255,0.06)';

  return (
    <button
      onClick={() => onClick(initiative)}
      className="group w-full text-left rounded-xl transition-all duration-150"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        padding: compact ? '10px 12px' : '14px 16px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLElement).style.border = `1px solid ${s.selectedBorder}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
          (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.06)';
        }
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: s.dotColor,
            boxShadow: isSelected ? `0 0 6px ${s.dotColor}` : 'none',
          }}
        />
        <span
          className={`font-semibold leading-snug truncate ${compact ? 'text-xs' : 'text-sm'}`}
          style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)' }}
        >
          {initiative.title}
        </span>
        {!compact && (
          <span
            className="ml-auto flex-shrink-0 text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full"
            style={{ background: s.badgeBg, color: s.badgeText, border: `1px solid ${s.badgeBorder}` }}
          >
            {STATUS_LABELS[initiative.status]}
          </span>
        )}
      </div>

      {!compact && (
        <p className="mt-1.5 text-[11px] text-white/35 leading-relaxed line-clamp-2">
          {initiative.description}
        </p>
      )}
    </button>
  );
};

export default InitiativeCard;
