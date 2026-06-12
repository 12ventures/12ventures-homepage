import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { MilestoneChild, MilestoneItem } from './data/initiatives';
import { isMilestoneGroup, milestoneLabel, milestoneUrl } from './data/initiatives';

interface MilestoneListProps {
  items: MilestoneItem[];
  accentColor: string;
  glassSurface?: boolean;
}

function milestoneKey(item: MilestoneItem, index: number): string {
  return `${milestoneLabel(item)}-${index}`;
}

const MILESTONE_SURFACE = {
  plain: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  glass: {
    background: 'linear-gradient(145deg, rgba(14,100,180,0.08) 0%, rgba(6,30,80,0.10) 100%)',
    border: '1px solid rgba(56,189,248,0.12)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 12px rgba(0,0,0,0.25)',
    transform: 'translateZ(0)',
    willChange: 'backdrop-filter',
  },
} as const;

const MilestoneRow: React.FC<{
  label: string;
  url?: string;
  accentColor: string;
  surface?: (typeof MILESTONE_SURFACE)[keyof typeof MILESTONE_SURFACE];
  textClassName?: string;
  dotClassName?: string;
  dotOpacity?: number;
  className?: string;
}> = ({
  label,
  url,
  accentColor,
  surface,
  textClassName = 'text-sm text-white/80',
  dotClassName = 'w-1.5 h-1.5',
  dotOpacity = 1,
  className = 'group flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors duration-150',
}) => {
  const content = (
    <>
      <span
        className={`${dotClassName} rounded-full flex-shrink-0 mt-0.5`}
        style={{ background: accentColor, opacity: dotOpacity }}
      />
      <span className={`${textClassName} flex-1 min-w-0`}>{label}</span>
      {url && (
        <ExternalLink
          className="w-3.5 h-3.5 flex-shrink-0 opacity-45 group-hover:opacity-90 transition-opacity"
          style={{ color: accentColor }}
        />
      )}
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:bg-white/[0.04]`}
        style={surface}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} style={surface}>
      {content}
    </div>
  );
};

const MilestoneList: React.FC<MilestoneListProps> = ({
  items,
  accentColor,
  glassSurface = false,
}) => {
  const surface = glassSurface ? MILESTONE_SURFACE.glass : MILESTONE_SURFACE.plain;

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => {
        const key = milestoneKey(item, index);

        if (typeof item === 'string' || (typeof item === 'object' && !isMilestoneGroup(item))) {
          const label = milestoneLabel(item);
          const url = milestoneUrl(item);

          return (
            <MilestoneRow
              key={key}
              label={label}
              url={url}
              accentColor={accentColor}
              surface={surface}
            />
          );
        }

        return (
          <div key={key} className="rounded-xl px-3 py-2.5" style={surface}>
            <div className="flex items-center gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: accentColor }}
              />
              <span className="text-sm text-white/85">{item.label}</span>
            </div>
            {item.children.length > 0 && (
              <ul className="mt-2 ml-5 space-y-1.5">
                {item.children.map((child, childIndex) => (
                  <li key={`${milestoneLabel(child)}-${childIndex}`}>
                    <MilestoneRow
                      label={milestoneLabel(child)}
                      url={milestoneUrl(child)}
                      accentColor={accentColor}
                      textClassName="text-sm text-white/60"
                      dotClassName="w-1 h-1"
                      dotOpacity={0.55}
                      className="group flex items-start gap-2.5 py-0.5 rounded-md transition-colors duration-150"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MilestoneList;
