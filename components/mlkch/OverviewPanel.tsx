import React from 'react';
import { DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import ShimmerText from './ShimmerText';
import AnimatedMetricValue from './AnimatedMetricValue';
import {
  formatOverviewDate,
  type DashboardOverview,
  type FinancialSummaryItem,
  type OverviewMetric,
} from './data/overview';

const GLASS_PANEL = {
  background: 'linear-gradient(145deg, rgba(14,100,180,0.08) 0%, rgba(6,30,80,0.10) 100%)',
  border: '1px solid rgba(56,189,248,0.12)',
  backdropFilter: 'blur(8px) saturate(140%)',
  WebkitBackdropFilter: 'blur(8px) saturate(140%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 12px rgba(0,0,0,0.25)',
} as const;

const FINANCIAL_ACCENTS = {
  realized: '#a78bfa',
  projected: '#34d399',
  savings: '#38bdf8',
  total: '#fbbf24',
} as const;

interface OverviewPanelProps {
  overview: DashboardOverview | null;
  loading: boolean;
}

const FinancialCard: React.FC<{
  item: FinancialSummaryItem;
  accent: string;
}> = ({ item, accent }) => (
  <div
    className="rounded-2xl p-5 overflow-hidden relative h-full"
    style={{
      ...GLASS_PANEL,
      border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
    }}
  >
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse 90% 70% at 0% 100%, color-mix(in srgb, ${accent} 14%, transparent), transparent 65%)`,
      }}
    />
    <div className="relative">
      <AnimatedMetricValue
        value={item.displayValue}
        className="text-3xl font-black leading-none tracking-tight"
        style={{ color: accent }}
      />
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mt-2">
        {item.label}
      </p>
      <p className="text-[10px] text-white/30 mt-1">
        {item.initiativeCount} initiative{item.initiativeCount === 1 ? '' : 's'}
        {item.hasEstimates ? ' · includes estimates' : ''}
      </p>

      {item.contributions.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
          {item.contributions.map((contribution) => (
            <li
              key={`${contribution.initiativeId}-${contribution.label}`}
              className="flex items-start justify-between gap-3 text-[11px]"
            >
              <span className="text-white/45 leading-snug min-w-0 flex-1">
                {contribution.title}
              </span>
              <span className="text-white/75 font-semibold flex-shrink-0 tabular-nums">
                {contribution.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

const MetricTile: React.FC<{
  metric: OverviewMetric;
  accent?: string;
  compact?: boolean;
}> = ({ metric, accent = '#38bdf8', compact }) => (
  <div
    className={`rounded-xl ${compact ? 'px-3.5 py-3' : 'px-4 py-3.5'}`}
    style={{
      background: metric.roiRelated
        ? 'rgba(167,139,250,0.06)'
        : 'rgba(255,255,255,0.025)',
      border: metric.roiRelated
        ? '1px solid rgba(167,139,250,0.18)'
        : '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <p
      className={`font-black leading-none ${compact ? 'text-lg' : 'text-xl'}`}
      style={{ color: metric.roiRelated ? '#c4b5fd' : accent }}
    >
      {metric.value}
    </p>
    <p
      className={`font-semibold uppercase tracking-wide text-white/45 mt-1.5 leading-snug ${
        compact ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      {metric.label}
    </p>
  </div>
);

function detailMetrics(
  topMetrics: OverviewMetric[],
  allMetrics: OverviewMetric[],
): OverviewMetric[] {
  const topLabels = new Set(topMetrics.map((metric) => metric.label));
  return allMetrics.filter((metric) => !topLabels.has(metric.label));
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ overview, loading }) => {
  if (loading || !overview) {
    return (
      <div className="space-y-6 animate-pulse w-full min-w-0">
        <div className="h-8 w-48 rounded-lg bg-white/[0.04]" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  const { financialSummary } = overview;
  const roiHighlights = overview.topMetrics.filter((metric) => metric.roiRelated);
  const programMetrics = overview.topMetrics.filter((metric) => !metric.roiRelated);
  const detail = detailMetrics(overview.topMetrics, overview.allMetrics);

  return (
    <div className="w-full min-w-0 space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <ShimmerText as="h2" className="text-2xl md:text-3xl font-black leading-tight">
            Program Overview
          </ShimmerText>
          <p className="mt-1.5 text-sm text-white/40">
            {overview.companyName} portfolio · {overview.totalInitiatives} initiatives
          </p>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Updated {formatOverviewDate(overview.lastUpdated)}
        </span>
      </div>

      {financialSummary && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-amber-400/70" />
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white/55">
              Portfolio Impact
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <FinancialCard item={financialSummary.realizedRoi} accent={FINANCIAL_ACCENTS.realized} />
            <FinancialCard item={financialSummary.projectedValue} accent={FINANCIAL_ACCENTS.projected} />
            <FinancialCard item={financialSummary.projectedSavings} accent={FINANCIAL_ACCENTS.savings} />
            <FinancialCard
              item={financialSummary.combinedTotal}
              accent={FINANCIAL_ACCENTS.total}
            />
          </div>
        </section>
      )}

      {roiHighlights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400/70" />
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white/55">
              ROI & Impact
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roiHighlights.map((metric) => (
              <MetricTile key={metric.label} metric={metric} />
            ))}
          </div>
        </section>
      )}

      {programMetrics.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-sky-400/70" />
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white/55">
              Key Program Metrics
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 w-full">
            {programMetrics.map((metric) => (
              <MetricTile key={metric.label} metric={metric} compact />
            ))}
          </div>
        </section>
      )}

      {detail.length > 0 && (
        <section className="rounded-2xl p-5" style={GLASS_PANEL}>
          <h3 className="text-[11px] font-bold tracking-widest uppercase text-white/55 mb-3">
            Program Insights
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 w-full">
            {detail.map((metric) => (
              <MetricTile key={metric.label} metric={metric} compact accent="#94a3b8" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default OverviewPanel;
