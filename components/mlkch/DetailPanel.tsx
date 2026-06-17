import React, { useEffect, useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import type { InitiativeMetric } from './data/initiatives';
import AnimatedMetricValue from './AnimatedMetricValue';
import MilestoneList from './MilestoneList';
import { InlineEditBlock } from './inline/InlineEditBlock';
import GlassDropdown from './ui/GlassDropdown';
import { resolveInitiativeBanner, resolveSectionAccent } from './data/initiatives';
import type { DashboardSection, Initiative, InitiativeStatus } from './data/initiatives';
import type { InitiativePatch } from './api/mlkchApi';

const STATUS_LABELS: Record<InitiativeStatus, string> = {
  active: 'Live',
  planning: 'Active',
  backlog: 'Planning',
};

const STATUS_OPTIONS: InitiativeStatus[] = ['active', 'planning', 'backlog'];

const GLASS_CARD_BASE = {
  plain: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  banner: {
    background: 'linear-gradient(145deg, rgba(14,100,180,0.10) 0%, rgba(6,30,80,0.12) 100%)',
    border: '1px solid rgba(56,189,248,0.14)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.3)',
    transform: 'translateZ(0)',
    willChange: 'backdrop-filter',
  },
} as const;

const GLASS_BADGE_BASE = {
  banner: {
    backdropFilter: 'blur(6px) saturate(140%)',
    WebkitBackdropFilter: 'blur(6px) saturate(140%)',
    transform: 'translateZ(0)',
    willChange: 'backdrop-filter',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  },
} as const;

function accentMetricTextShadow(accentColor: string): string {
  return [
    `0 1px 2px color-mix(in srgb, ${accentColor} 45%, black)`,
    `0 2px 10px color-mix(in srgb, ${accentColor} 35%, black)`,
  ].join(', ');
}

function getStatusTextColor(status: InitiativeStatus, accentText: string): string {
  return STATUS_LABELS[status] === 'Active' ? '#ffffff' : accentText;
}

function getStatusTextShadow(status: InitiativeStatus, accentText: string): string | undefined {
  if (STATUS_LABELS[status] !== 'Active') return undefined;
  return accentMetricTextShadow(accentText);
}

const titleInputClass =
  'w-full min-w-0 bg-transparent text-2xl md:text-3xl font-black text-white leading-tight outline-none border-0 border-b border-white/20 focus:border-white/45 pb-0.5 transition-colors placeholder:text-white/20';

const fieldInputClass =
  'w-full min-w-0 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/18 transition-colors placeholder:text-white/25';

interface DetailPanelProps {
  initiative: Initiative;
  sections?: DashboardSection[];
  canEdit?: boolean;
  animateSections?: boolean;
  onOpenRoi?: () => void;
  onPatch: (patch: InitiativePatch) => Promise<void>;
  onAdvancedEdit?: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  initiative,
  sections,
  canEdit = false,
  animateSections = false,
  onOpenRoi,
  onPatch,
  onAdvancedEdit,
}) => {
  const accent = resolveSectionAccent(initiative, sections);
  const hasBanner = Boolean(resolveInitiativeBanner(initiative));
  const cardSurface = hasBanner ? GLASS_CARD_BASE.banner : GLASS_CARD_BASE.plain;
  const statusLabel = STATUS_LABELS[initiative.status];
  const currentStatusColor = getStatusTextColor(initiative.status, accent.text);
  const sectionClass = (index: number) =>
    animateSections ? `mlkch-initiative-section mlkch-initiative-section-${index}` : '';

  const [titleDraft, setTitleDraft] = useState(initiative.title);
  const [metricDrafts, setMetricDrafts] = useState<InitiativeMetric[]>(
    initiative.metrics ?? [],
  );

  useEffect(() => {
    setTitleDraft(initiative.title);
    setMetricDrafts(initiative.metrics ?? []);
  }, [initiative.id, initiative.title, initiative.metrics]);

  const blockId = (suffix: string) => `${initiative.id}-${suffix}`;

  const badgeStyle = {
    background: hasBanner ? accent.bg.replace('0.08', '0.18') : accent.bg,
    color: currentStatusColor,
    border: `1px solid ${accent.border}`,
    ...(hasBanner ? GLASS_BADGE_BASE.banner : {}),
  };

  const statusOptions = STATUS_OPTIONS.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
    color: getStatusTextColor(status, accent.text),
    textShadow: getStatusTextShadow(status, accent.text),
  }));

  const linkButtonStyle = {
    background: hasBanner ? accent.bg.replace('0.08', '0.18') : 'rgba(255,255,255,0.05)',
    border: hasBanner ? `1px solid ${accent.border}` : '1px solid rgba(255,255,255,0.08)',
    ...(hasBanner
      ? {
          backdropFilter: GLASS_BADGE_BASE.banner.backdropFilter,
          WebkitBackdropFilter: GLASS_BADGE_BASE.banner.WebkitBackdropFilter,
          transform: GLASS_BADGE_BASE.banner.transform,
          willChange: GLASS_BADGE_BASE.banner.willChange,
        }
      : {}),
  };

  return (
    <div>
      <div className={`flex items-start justify-between gap-4 mb-6 ${sectionClass(0)}`}>
        <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-6">
          <InlineEditBlock
            blockId={blockId('title')}
            canEdit={canEdit}
            className="min-w-0 shrink max-w-full"
            controlsPlacement="inline"
            editClassName="px-2 py-1 -mx-2"
            onCancel={() => setTitleDraft(initiative.title)}
            onSave={async () => {
              const next = titleDraft.trim();
              if (!next) throw new Error('Title is required');
              await onPatch({ title: next });
            }}
          >
            {(editing) =>
              editing ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') e.currentTarget.blur();
                  }}
                  className={`${titleInputClass} ${hasBanner ? 'mlkch-banner-title-text' : ''}`}
                  placeholder="Initiative title"
                />
              ) : (
                <h2
                  className={`inline text-2xl md:text-3xl font-black text-white leading-tight ${
                    hasBanner ? 'mlkch-banner-title-text' : ''
                  }`}
                >
                  {initiative.title}
                </h2>
              )
            }
          </InlineEditBlock>

          {initiative.externalUrl && (
            <a
              href={initiative.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open product"
              aria-label={`Open ${initiative.title} product`}
              className="mlkch-external-link flex-shrink-0 p-1.5 rounded-lg text-white transition-colors pt-1"
              style={linkButtonStyle}
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {canEdit ? (
            <GlassDropdown
              value={initiative.status}
              options={statusOptions}
              onChange={async (status) => {
                await onPatch({ status });
              }}
              triggerStyle={{
                ...badgeStyle,
                textShadow: getStatusTextShadow(initiative.status, accent.text),
              }}
              menuAccent={accent.text}
            />
          ) : (
            <span
              className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{
                ...badgeStyle,
                textShadow: getStatusTextShadow(initiative.status, accent.text),
              }}
            >
              {statusLabel}
            </span>
          )}

          {canEdit && onAdvancedEdit && (
            <button
              type="button"
              onClick={onAdvancedEdit}
              className="text-[10px] font-medium tracking-wide text-white/25 hover:text-white/50 transition-colors"
            >
              Advanced
            </button>
          )}
        </div>
      </div>

      {(canEdit || (initiative.metrics && initiative.metrics.length > 0)) && (
        <div className={`mb-7 ${sectionClass(1)}`}>
          <p
            className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${
              hasBanner ? 'mlkch-banner-title-text' : ''
            }`}
            style={{ color: accent.text }}
          >
            Metrics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(initiative.metrics ?? []).map((m, index) => {
              const draft = metricDrafts[index] ?? m;
              const clickable = !canEdit && m.opensRoiBreakdown && onOpenRoi;

              return (
                <InlineEditBlock
                  key={`${initiative.id}-metric-${index}`}
                  blockId={blockId(`metric-${index}`)}
                  canEdit={canEdit}
                  className="min-w-0"
                  editClassName="px-1 -mx-1"
                  controlsPlacement="inset"
                  onCancel={() => setMetricDrafts(initiative.metrics ?? [])}
                  onSave={async () => {
                    const next = [...(initiative.metrics ?? [])];
                    next[index] = {
                      ...m,
                      label: draft.label.trim() || m.label,
                      value: draft.value.trim() || m.value,
                    };
                    await onPatch({ metrics: next });
                  }}
                  onRemove={async () => {
                    await onPatch({
                      metrics: (initiative.metrics ?? []).filter((_, i) => i !== index),
                    });
                  }}
                  removeLabel={m.label || 'metric'}
                >
                  {(editing) =>
                    editing ? (
                      <div className="rounded-2xl px-4 py-3.5 space-y-2" style={cardSurface}>
                        <input
                          autoFocus
                          value={draft.value}
                          onChange={(e) =>
                            setMetricDrafts((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, value: e.target.value } : item,
                              ),
                            )
                          }
                          className={`${fieldInputClass} text-xl font-black`}
                          placeholder="Value"
                        />
                        <input
                          value={draft.label}
                          onChange={(e) =>
                            setMetricDrafts((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, label: e.target.value } : item,
                              ),
                            )
                          }
                          className={fieldInputClass}
                          placeholder="Label"
                        />
                      </div>
                    ) : (
                      <div
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onClick={clickable ? onOpenRoi : undefined}
                        onKeyDown={
                          clickable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onOpenRoi?.();
                                }
                              }
                            : undefined
                        }
                        className={`rounded-2xl px-4 py-3.5 ${
                          clickable
                            ? 'cursor-pointer transition-all duration-200 hover:scale-[1.01]'
                            : ''
                        }`}
                        style={cardSurface}
                        onMouseEnter={
                          clickable
                            ? (e) => {
                                (e.currentTarget as HTMLElement).style.border =
                                  `1px solid ${accent.border}`;
                              }
                            : undefined
                        }
                        onMouseLeave={
                          clickable
                            ? (e) => {
                                (e.currentTarget as HTMLElement).style.border =
                                  hasBanner
                                    ? '1px solid rgba(56,189,248,0.14)'
                                    : '1px solid rgba(255,255,255,0.07)';
                              }
                            : undefined
                        }
                      >
                        <AnimatedMetricValue
                          key={`${initiative.id}-${m.label}-${m.value}`}
                          value={m.value}
                          className="text-2xl font-black leading-none mb-1 block"
                          style={{
                            color: accent.text,
                            ...(hasBanner ? { textShadow: accentMetricTextShadow(accent.text) } : {}),
                          }}
                        />
                        <p className={`text-[11px] ${hasBanner ? 'text-white' : 'text-white/40'}`}>
                          {m.label}
                        </p>
                      </div>
                    )
                  }
                </InlineEditBlock>
              );
            })}
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() =>
                void onPatch({
                  metrics: [...(initiative.metrics ?? []), { label: 'New metric', value: '0' }],
                })
              }
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add metric
            </button>
          )}
        </div>
      )}

      {(canEdit || (initiative.subItems && initiative.subItems.length > 0)) && (
        <div className={`mb-7 ${sectionClass(2)}`}>
          <p
            className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${
              hasBanner ? 'mlkch-banner-title-text' : ''
            }`}
            style={{ color: accent.text }}
          >
            Milestones
          </p>
          <MilestoneList
            items={initiative.subItems ?? []}
            accentColor={accent.text}
            glassSurface={hasBanner}
            canEdit={canEdit}
            blockIdPrefix={initiative.id}
            onPatchItems={async (items) => {
              await onPatch({ subItems: items });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DetailPanel;
