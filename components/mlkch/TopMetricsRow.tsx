import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';
import MetricCard from './MetricCard';
import { InlineEditBlock } from './inline/InlineEditBlock';
import type { MetricAccent, TopMetric } from './data/initiatives';

const METRIC_INTRO_CLASSES = [
  'mlkch-intro mlkch-intro-metric-0',
  'mlkch-intro mlkch-intro-metric-1',
  'mlkch-intro mlkch-intro-metric-2',
];

const ACCENT_OPTIONS: MetricAccent[] = ['teal', 'sky', 'purple', 'green'];

const fieldInputClass =
  'w-full min-w-0 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/18 transition-colors placeholder:text-white/25';

function metricIcon(label: string) {
  if (label === 'Nurses Onboarded') return <Users className="w-4 h-4" />;
  if (label === 'ROI') return <TrendingUp className="w-4 h-4" />;
  if (label.includes('Competency')) return <BarChart3 className="w-4 h-4" />;
  if (label.includes('Savings')) return <DollarSign className="w-4 h-4" />;
  return <TrendingUp className="w-4 h-4" />;
}

interface TopMetricsRowProps {
  metrics: TopMetric[];
  animateIntro: boolean;
  switchKey: string;
  onOpenRoi?: () => void;
  canEdit?: boolean;
  blockIdPrefix?: string;
  onPatchMetrics?: (metrics: TopMetric[]) => Promise<void>;
}

const TopMetricsRow: React.FC<TopMetricsRowProps> = ({
  metrics,
  animateIntro,
  switchKey,
  onOpenRoi,
  canEdit = false,
  blockIdPrefix = 'top',
  onPatchMetrics,
}) => {
  const [drafts, setDrafts] = useState<TopMetric[]>(metrics);

  useEffect(() => {
    setDrafts(metrics);
  }, [switchKey, metrics]);

  const patchMetrics = async (next: TopMetric[]) => {
    if (!onPatchMetrics) return;
    await onPatchMetrics(next);
  };

  return (
    <div
      key={switchKey}
      className={`grid gap-3 ${metrics.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
    >
      {metrics.map((metric, index) => {
        const draft = drafts[index] ?? metric;
        const blockId = `${blockIdPrefix}-top-metric-${index}`;
        const editable = canEdit && Boolean(onPatchMetrics);

        return (
          <div
            key={`${metric.label}-${index}`}
            className={
              animateIntro
                ? METRIC_INTRO_CLASSES[index] ?? ''
                : `mlkch-metric-switch mlkch-metric-switch-${Math.min(index, 2)}`
            }
          >
            <InlineEditBlock
              blockId={blockId}
              canEdit={editable}
              className="h-full"
              editClassName="px-1 -mx-1"
              controlsPlacement="inset"
              onCancel={() => setDrafts(metrics)}
              onSave={async () => {
                const next = [...metrics];
                next[index] = {
                  ...metric,
                  label: draft.label.trim() || metric.label,
                  value: draft.value.trim() || metric.value,
                  accent: draft.accent,
                };
                await patchMetrics(next);
              }}
              onRemove={async () => {
                await patchMetrics(metrics.filter((_, i) => i !== index));
              }}
              removeLabel={metric.label || 'metric'}
            >
              {(editing) =>
                editing ? (
                  <div
                    className="rounded-2xl px-4 py-3.5 space-y-2"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <input
                      autoFocus
                      value={draft.value}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, value: e.target.value } : item,
                          ),
                        )
                      }
                      className={`${fieldInputClass} text-2xl font-black`}
                      placeholder="Value"
                    />
                    <input
                      value={draft.label}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, label: e.target.value } : item,
                          ),
                        )
                      }
                      className={fieldInputClass}
                      placeholder="Label"
                    />
                    <select
                      value={draft.accent}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, accent: e.target.value as MetricAccent }
                              : item,
                          ),
                        )
                      }
                      className={`${fieldInputClass} text-xs`}
                    >
                      {ACCENT_OPTIONS.map((accent) => (
                        <option key={accent} value={accent} className="bg-[#0a1220]">
                          {accent}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <MetricCard
                    label={metric.label}
                    value={metric.value}
                    accent={metric.accent}
                    icon={metricIcon(metric.label)}
                    onClick={metric.opensRoiBreakdown ? onOpenRoi : undefined}
                  />
                )
              }
            </InlineEditBlock>
          </div>
        );
      })}
    </div>
  );
};

export default TopMetricsRow;
