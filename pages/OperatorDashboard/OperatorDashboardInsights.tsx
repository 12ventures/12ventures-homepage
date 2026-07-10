import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import {
  sliceGroupedRows,
  customRangeSpanDays,
  getDailyAverageDivisorDays,
  type AnalyticsInsights,
  type AnalyticsInsightsBreakdownField,
  type DashboardFilter,
  type LabelCount,
  type HourCount,
} from '../../services/poseidonService';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import { getOdChartTheme, type OdChartTheme } from './operatorDashboardChartTheme';
import InsightsBreakdownModal from './InsightsBreakdownModal';
import GroupedInsightsList from './GroupedInsightsList';
import './OperatorDashboardInsights.css';

const REVEAL_STEP_MS = 65;
const COUNT_ANIM_DELAY_BASE = 280;

function odReveal(idx: number): React.CSSProperties {
  return { '--od-reveal-idx': idx } as React.CSSProperties;
}

function countAnimDelay(revealIdx: number): number {
  return revealIdx * REVEAL_STEP_MS + COUNT_ANIM_DELAY_BASE;
}

function getDailyAveragePeriodDays(
  insights: AnalyticsInsights | null,
  filter: DashboardFilter,
): number | null {
  if (!insights) return null;

  let dateFrom: string | null = null;
  let dateTo: string | null = null;

  if (filter.mode === 'custom') {
    dateFrom = filter.dateFrom;
    dateTo = filter.dateTo;
  } else if (insights.date_from && insights.date_to) {
    dateFrom = insights.date_from;
    dateTo = insights.date_to;
  }

  if (dateFrom && dateTo) {
    const days = getDailyAverageDivisorDays(dateFrom, dateTo);
    return days > 0 ? days : null;
  }

  return getPeriodDays(insights, filter);
}

function getPeriodDays(insights: AnalyticsInsights | null, filter: DashboardFilter): number | null {
  if (!insights) return null;
  if (insights.span_days != null && insights.span_days > 0) return insights.span_days;
  if (filter.mode === 'custom') {
    return customRangeSpanDays(filter.dateFrom, filter.dateTo);
  }
  if (insights.date_from && insights.date_to) {
    return customRangeSpanDays(insights.date_from, insights.date_to);
  }
  const presetDays: Partial<Record<string, number>> = {
    today: 1,
    yesterday: 1,
    past_7_days: 7,
    past_30_days: 30,
    week: 7,
  };
  if (insights.period && presetDays[insights.period] != null) {
    return presetDays[insights.period]!;
  }
  return null;
}

interface Props {
  filter: DashboardFilter;
  periodLabel: string;
  insightsAvailable: boolean;
  includeTestCalls: boolean;
  insights: AnalyticsInsights | null;
  loading: boolean;
  revealBase?: number;
}

function ChartCardHeader({
  title,
  onDetailedView,
}: {
  title: string;
  onDetailedView?: () => void;
}) {
  return (
    <div className="od-chart-card-header">
      <p className="od-chart-title">{title}</p>
      {onDetailedView && (
        <button type="button" className="od-insights-detail-btn" onClick={onDetailedView}>
          Detailed view
        </button>
      )}
    </div>
  );
}

function HBarChart({ data, chartTheme }: { data: LabelCount[]; chartTheme: OdChartTheme }) {
  if (data.length === 0) {
    return <p className="od-chart-empty">No data for this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
        barSize={14}
      >
        <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke={chartTheme.grid} />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: chartTheme.tick }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: chartTheme.tickLabel }}
          width={110}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip}
          labelStyle={chartTheme.tooltipLabelStyle}
          itemStyle={chartTheme.tooltipItemStyle}
          cursor={{ fill: chartTheme.cursor }}
        />
        <Bar
          dataKey="count"
          fill={chartTheme.bar}
          activeBar={{ fill: chartTheme.barActive }}
          radius={[0, 4, 4, 0]}
          name="Calls"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function VBarChart({
  data,
  xKey,
  chartTheme,
  color,
}: {
  data: { name: string; count: number }[];
  xKey: string;
  chartTheme: OdChartTheme;
  color?: string;
}) {
  if (data.length === 0) {
    return <p className="od-chart-empty">No data for this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={20}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={chartTheme.grid} />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: chartTheme.tick }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: chartTheme.tick }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip}
          labelStyle={chartTheme.tooltipLabelStyle}
          itemStyle={chartTheme.tooltipItemStyle}
          cursor={{ fill: chartTheme.cursor }}
        />
        <Bar
          dataKey="count"
          fill={color ?? chartTheme.bar}
          activeBar={{ fill: chartTheme.barActive }}
          radius={[4, 4, 0, 0]}
          name="Calls"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const OperatorDashboardInsights: React.FC<Props> = ({
  filter,
  periodLabel,
  insightsAvailable,
  includeTestCalls,
  insights,
  loading,
  revealBase = 0,
}) => {
  const { effectiveTheme } = useTheme();
  const chartTheme = useMemo(() => getOdChartTheme(effectiveTheme), [effectiveTheme]);
  const sectionClass = `od-insights${loading ? ' od-insights--loading' : ''}`;
  const rb = revealBase;
  const [breakdownField, setBreakdownField] = useState<AnalyticsInsightsBreakdownField | null>(null);

  const openBreakdown = (field: AnalyticsInsightsBreakdownField) => {
    if (insightsAvailable) setBreakdownField(field);
  };

  const examTypeChartData = useMemo(
    () => sliceGroupedRows(insights?.exam_types ?? [], 8),
    [insights?.exam_types],
  );

  const dailyAverageDivisorDays = useMemo(
    () => getDailyAveragePeriodDays(insights, filter),
    [insights, filter],
  );

  const dailyAverageCalls = useMemo(() => {
    if (!insights || dailyAverageDivisorDays == null || dailyAverageDivisorDays <= 0) return null;
    return insights.total_calls / dailyAverageDivisorDays;
  }, [insights, dailyAverageDivisorDays]);

  if (!insightsAvailable) {
    return (
      <div className={sectionClass}>
        <p className="od-section-label od-reveal" style={odReveal(rb)}>Call Insights</p>
        <div className="od-insights-unavailable od-reveal" style={odReveal(rb + 1)}>
          <p>Insights are not available for this time period. Try Today through This Month, or a custom range up to 90 days.</p>
        </div>
      </div>
    );
  }

  const durationData: LabelCount[] = insights?.duration_buckets ?? [];
  const hourlyData = (insights?.calls_by_hour ?? []).map((d: HourCount) => ({
    name: d.label,
    count: d.count,
  }));

  return (
    <div className={sectionClass}>
      <p className="od-section-label od-reveal" style={odReveal(rb)}>
        Call Insights &middot; {periodLabel}
      </p>

      <InsightsBreakdownModal
        isOpen={breakdownField != null}
        field={breakdownField}
        filter={filter}
        periodLabel={periodLabel}
        includeTestCalls={includeTestCalls}
        onClose={() => setBreakdownField(null)}
      />

      <div className="od-insights-kpi">
        <div className="od-metric-card od-reveal" style={odReveal(rb + 1)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Unique Callers</span>
          </div>
          <div className="od-metric-value">
            {insights != null ? (
              <>
                <AnimatedNumber
                  value={insights.unique_callers}
                  delay={countAnimDelay(rb + 1)}
                />
                /
                <AnimatedNumber
                  value={insights.total_calls}
                  delay={countAnimDelay(rb + 1) + 120}
                />
              </>
            ) : (
              '—/—'
            )}
          </div>
        </div>
        <div className="od-metric-card od-reveal" style={odReveal(rb + 1)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Daily Avg Calls</span>
          </div>
          <div className="od-metric-value">
            {dailyAverageCalls != null ? (
              <AnimatedNumber
                value={dailyAverageCalls}
                decimals={1}
                delay={countAnimDelay(rb + 1) + 60}
              />
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      <div className="od-insights-grid">
        <div className="od-chart-card od-reveal" style={odReveal(rb + 2)}>
          <ChartCardHeader
            title="Exam Types"
            onDetailedView={insightsAvailable ? () => openBreakdown('exam_type_groups') : undefined}
          />
          <GroupedInsightsList
            data={examTypeChartData}
            fullData={insights?.exam_types ?? []}
            chartTheme={chartTheme}
            filter={filter}
            includeTestCalls={includeTestCalls}
            breakdownField="exam_type_groups"
          />
        </div>
        <div className="od-chart-card od-reveal" style={odReveal(rb + 3)}>
          <p className="od-chart-title">Order Status</p>
          <HBarChart data={insights?.order_status ?? []} chartTheme={chartTheme} />
        </div>
      </div>

      <div className="od-insights-grid">
        <div className="od-chart-card od-reveal" style={odReveal(rb + 4)}>
          <ChartCardHeader
            title="Top Insurances"
            onDetailedView={insightsAvailable ? () => openBreakdown('insurance_groups') : undefined}
          />
          <GroupedInsightsList
            data={insights?.top_insurances ?? []}
            chartTheme={chartTheme}
            filter={filter}
            includeTestCalls={includeTestCalls}
            breakdownField="insurance_groups"
          />
        </div>
        <div className="od-chart-card od-reveal" style={odReveal(rb + 5)}>
          <p className="od-chart-title">Agent Paths</p>
          <HBarChart data={insights?.agent_paths ?? []} chartTheme={chartTheme} />
        </div>
      </div>

      <div className="od-insights-grid od-insights-grid--full">
        <div className="od-chart-card od-reveal" style={odReveal(rb + 6)}>
          <p className="od-chart-title">Call Duration</p>
          <VBarChart
            data={durationData.map((d) => ({ name: d.label, count: d.count }))}
            xKey="name"
            chartTheme={chartTheme}
          />
        </div>
      </div>

      <div className="od-insights-grid od-insights-grid--full">
        <div className="od-chart-card od-reveal" style={odReveal(rb + 7)}>
          <p className="od-chart-title">Calls by Hour</p>
          {hourlyData.length === 0 ? (
            <p className="od-chart-empty">No data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={chartTheme.grid} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: chartTheme.tick }}
                  interval={1}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: chartTheme.tick }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                  labelStyle={chartTheme.tooltipLabelStyle}
                  itemStyle={chartTheme.tooltipItemStyle}
                  cursor={{ fill: chartTheme.cursor }}
                />
                <Bar
                  dataKey="count"
                  fill={chartTheme.bar}
                  activeBar={{ fill: chartTheme.barActive }}
                  radius={[4, 4, 0, 0]}
                  name="Calls"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboardInsights;
