import {
  DEFAULT_SECTIONS,
  GLOBAL_TOP_METRICS,
  INITIATIVES,
  METRICS,
  type DashboardSection,
  type Initiative,
  type InitiativeStatus,
  type MetricAccent,
  type TopMetric,
} from './initiatives';

export interface OverviewSectionCount {
  sectionId: string;
  sectionLabel: string;
  sectionSlug: string;
  count: number;
}

export interface OverviewMetric {
  label: string;
  value: string;
  roiRelated: boolean;
  sourceInitiativeIds: string[];
}

export interface FinancialContribution {
  initiativeId: string;
  title: string;
  label: string;
  value: string;
  raw: number;
}

export interface FinancialSummaryItem {
  label: string;
  totalRaw: number;
  displayValue: string;
  initiativeCount: number;
  hasEstimates: boolean;
  contributions: FinancialContribution[];
}

export interface FinancialSummary {
  realizedRoi: FinancialSummaryItem;
  projectedValue: FinancialSummaryItem;
  projectedSavings: FinancialSummaryItem;
  combinedTotal: FinancialSummaryItem;
}

export interface DashboardOverview {
  companyName: string;
  totalInitiatives: number;
  bySection: OverviewSectionCount[];
  byStatus: Record<InitiativeStatus, number>;
  topMetrics: OverviewMetric[];
  allMetrics: OverviewMetric[];
  tags: string[];
  financialSummary: FinancialSummary | null;
  lastUpdated: string;
}

function dedupeMetrics(
  initiatives: Initiative[],
  pick: 'topMetrics' | 'metrics',
): OverviewMetric[] {
  const map = new Map<string, OverviewMetric>();

  for (const initiative of initiatives) {
    const items = pick === 'topMetrics' ? initiative.topMetrics ?? [] : initiative.metrics ?? [];
    for (const metric of items) {
      const existing = map.get(metric.label);
      if (existing) {
        if (!existing.sourceInitiativeIds.includes(initiative.id)) {
          existing.sourceInitiativeIds.push(initiative.id);
        }
        if (metric.opensRoiBreakdown) existing.roiRelated = true;
      } else {
        map.set(metric.label, {
          label: metric.label,
          value: metric.value,
          roiRelated: Boolean(metric.opensRoiBreakdown),
          sourceInitiativeIds: [initiative.id],
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function parseMoney(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  const match = normalized.match(/\$?\s*([\d.]+)\s*([KMB])?/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (Number.isNaN(base)) return null;
  const suffix = (match[2] ?? '').toUpperCase();
  if (suffix === 'K') return base * 1_000;
  if (suffix === 'M') return base * 1_000_000;
  if (suffix === 'B') return base * 1_000_000_000;
  return base;
}

function formatMoney(total: number): string {
  if (total >= 1_000_000) return `~$${(total / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (total >= 1_000) return `$${Math.round(total / 1_000)}K`;
  return `$${total.toLocaleString()}`;
}

function buildStaticFinancialSummary(initiatives: Initiative[]): FinancialSummary | null {
  const roiContributions: FinancialContribution[] = [];
  const valueContributions: FinancialContribution[] = [];
  const savingsContributions: FinancialContribution[] = [];

  for (const initiative of initiatives) {
    for (const metric of initiative.topMetrics ?? []) {
      const raw = parseMoney(metric.value);
      if (raw === null) continue;

      if (metric.opensRoiBreakdown || metric.label.toLowerCase() === 'roi') {
        roiContributions.push({
          initiativeId: initiative.id,
          title: initiative.title,
          label: metric.label,
          value: metric.value,
          raw,
        });
      } else if (/projected value/i.test(metric.label)) {
        valueContributions.push({
          initiativeId: initiative.id,
          title: initiative.title,
          label: metric.label,
          value: metric.value,
          raw,
        });
      } else if (/projected savings|revenue recovery/i.test(metric.label)) {
        savingsContributions.push({
          initiativeId: initiative.id,
          title: initiative.title,
          label: metric.label,
          value: metric.value,
          raw,
        });
      }
    }
  }

  const sum = (items: FinancialContribution[]) =>
    items.reduce((total, item) => total + item.raw, 0);

  const realizedTotal = sum(roiContributions);
  const projectedValueTotal = sum(valueContributions);
  const projectedSavingsTotal = sum(savingsContributions);
  const combinedTotal = realizedTotal + projectedValueTotal + projectedSavingsTotal;

  if (combinedTotal === 0 && roiContributions.length === 0) return null;

  const item = (
    label: string,
    totalRaw: number,
    contributions: FinancialContribution[],
    hasEstimates: boolean,
  ): FinancialSummaryItem => ({
    label,
    totalRaw,
    displayValue: formatMoney(totalRaw),
    initiativeCount: new Set(contributions.map((c) => c.initiativeId)).size,
    hasEstimates,
    contributions,
  });

  return {
    realizedRoi: item('Realized ROI', realizedTotal, roiContributions, false),
    projectedValue: item('Projected Value', projectedValueTotal, valueContributions, true),
    projectedSavings: item('Projected Savings', projectedSavingsTotal, savingsContributions, true),
    combinedTotal: item('Total Portfolio Impact', combinedTotal, [], true),
  };
}

export function buildStaticOverview(
  initiatives: Initiative[] = INITIATIVES,
  sections: DashboardSection[] = DEFAULT_SECTIONS,
): DashboardOverview {
  const byStatus: Record<InitiativeStatus, number> = {
    active: 0,
    planning: 0,
    backlog: 0,
  };

  for (const initiative of initiatives) {
    byStatus[initiative.status]++;
  }

  const tags = [...new Set(initiatives.flatMap((i) => i.tags ?? []))].sort((a, b) =>
    a.localeCompare(b),
  );

  const lastUpdated = initiatives.reduce<string | undefined>((latest, item) => {
    if (!item.updatedAt) return latest;
    if (!latest || item.updatedAt > latest) return item.updatedAt;
    return latest;
  }, undefined);

  return {
    companyName: 'MLKCH',
    totalInitiatives: initiatives.length,
    bySection: sections.map((section) => ({
      sectionId: section.id,
      sectionLabel: section.label,
      sectionSlug: section.slug,
      count: initiatives.filter((i) => i.sectionId === section.id).length,
    })),
    byStatus,
    topMetrics: dedupeMetrics(initiatives, 'topMetrics'),
    allMetrics: dedupeMetrics(initiatives, 'metrics'),
    tags,
    financialSummary: buildStaticFinancialSummary(initiatives),
    lastUpdated: lastUpdated ?? METRICS.lastUpdated,
  };
}

export function overviewToTopMetrics(overview: DashboardOverview): TopMetric[] {
  if (overview.financialSummary) {
    const { realizedRoi, projectedValue, combinedTotal } = overview.financialSummary;
    return [
      { label: realizedRoi.label, value: realizedRoi.displayValue, accent: 'purple' },
      { label: projectedValue.label, value: projectedValue.displayValue, accent: 'green' },
      { label: combinedTotal.label, value: combinedTotal.displayValue, accent: 'sky' },
    ];
  }

  const pool = [...overview.topMetrics].sort(
    (a, b) => Number(b.roiRelated) - Number(a.roiRelated) || a.label.localeCompare(b.label),
  );

  if (pool.length === 0) {
    return GLOBAL_TOP_METRICS.slice(0, 3);
  }

  const accents: MetricAccent[] = ['purple', 'sky', 'green', 'teal'];
  return pool.slice(0, 3).map((metric, index) => ({
    label: metric.label,
    value: metric.value,
    accent: metric.roiRelated ? 'purple' : accents[index % accents.length],
  }));
}

export function formatOverviewDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
