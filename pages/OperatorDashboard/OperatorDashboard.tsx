import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import CustomDropdown from '../../components/common/CustomDropdown';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import {
  FiPhone,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiAlertCircle,
  FiArrowUp,
  FiDownload,
  FiTrendingUp,
} from 'react-icons/fi';
import { IoShieldCheckmark } from 'react-icons/io5';
import {
  poseidonService,
  type ActiveCall,
  type CallHistoryItem,
  type AnalyticsSummary,
  type CostAnalytics,
  type AnalyticsInsights,
  type DashboardFilter,
  formatCustomRangeLabel,
  customRangeSpanDays,
} from '../../services/poseidonService';
import OperatorDashboardInsights from './OperatorDashboardInsights';
import CostDetailModal from './CostDetailModal';
import MaintenanceModal from './MaintenanceModal';
import CustomDateRangePicker from './CustomDateRangePicker';
import CallStatusPill from './CallStatusPill';
import { getOdChartTheme } from './operatorDashboardChartTheme';
import { useTheme } from '../../contexts/ThemeContext';
import './OperatorDashboard.css';

// ── Types ──────────────────────────────────────────────────────────────
/** Period values accepted by Poseidon analytics/cost APIs (see LivePanel). */
type ApiPeriod =
  | 'today'
  | 'yesterday'
  | 'past_7_days'
  | 'past_30_days'
  | 'this_week'
  | 'this_month'
  | 'this_year';

/** UI period — includes pill-only `past_90_days` (API maps to `this_year` until backend supports it). */
type DashboardPeriod = ApiPeriod | 'past_90_days';

type PillPeriod = 'today' | 'past_7_days' | 'past_30_days' | 'past_90_days';

const PILL_PERIODS: PillPeriod[] = ['today', 'past_7_days', 'past_30_days', 'past_90_days'];

const PILL_LABELS: Record<PillPeriod, string> = {
  today: 'Today',
  past_7_days: '7 Days',
  past_30_days: '30 Days',
  past_90_days: '90 Days',
};

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'past_7_days', label: 'Past 7 Days' },
  { value: 'past_30_days', label: 'Past 30 Days' },
  { value: 'past_90_days', label: 'Past 90 Days' },
  { value: 'pilot', label: 'Since May 27 Pilot' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
] as const;

type PeriodDropdownValue = DashboardPeriod | 'pilot';

const PILOT_START_DATE = '2026-05-27';
const PILOT_RANGE_LABEL = 'Since May 27 Pilot';

function isPilotRange(
  range: { dateFrom: string; dateTo: string } | null,
  today = toLocalDateKey(new Date()),
): boolean {
  return range?.dateFrom === PILOT_START_DATE && range.dateTo === today;
}

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  past_7_days: 'Past 7 Days',
  past_30_days: 'Past 30 Days',
  past_90_days: 'Past 90 Days',
  this_week: 'This Week',
  this_month: 'This Month',
  this_year: 'This Year',
};

/** Map UI period to Poseidon API period param. */
function toApiPeriod(period: DashboardPeriod): ApiPeriod {
  if (period === 'past_90_days') return 'this_year';
  return period;
}

/** Insights API only supports periods up to this_month — returns null for unsupported periods. */
const INSIGHTS_SUPPORTED_PERIODS: ApiPeriod[] = [
  'today', 'yesterday', 'past_7_days', 'past_30_days', 'this_week', 'this_month',
];
function toInsightsPeriod(period: DashboardPeriod): ApiPeriod | null {
  const api = toApiPeriod(period);
  return INSIGHTS_SUPPORTED_PERIODS.includes(api) ? api : null;
}

const PRIVACY_MODE = true;

const REVEAL_STEP_MS = 65;
const COUNT_ANIM_DELAY_BASE = 280;

function odReveal(idx: number): React.CSSProperties {
  return { '--od-reveal-idx': idx } as React.CSSProperties;
}

function countAnimDelay(revealIdx: number): number {
  return revealIdx * REVEAL_STEP_MS + COUNT_ANIM_DELAY_BASE;
}

// ── Helpers ────────────────────────────────────────────────────────────
function maskPhone(phone: string | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

function displayPhone(phone: string | undefined) {
  return PRIVACY_MODE ? maskPhone(phone) : phone ?? '';
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function getRelativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric' });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCallDurationSeconds(call: CallHistoryItem): number | null {
  if (call.duration_seconds != null) return call.duration_seconds;
  if (!call.ended_at) return null;
  return Math.floor(
    (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000,
  );
}

/** Visual-only status overrides for call history display. */
function getDisplayOutcomeStatus(call: CallHistoryItem): CallHistoryItem['outcome_status'] {
  if (call.final_agent?.trim().toLowerCase() === 'triage') return 'completed';
  const duration = getCallDurationSeconds(call);
  if (duration != null && duration < 45) return 'completed';
  return call.outcome_status;
}

/** Aggregate call list into daily counts; optionally fill every day in the period (zeros). */
function aggregateByDate(
  calls: CallHistoryItem[],
  range?: { start: Date; end: Date },
): { name: string; value: number }[] {
  const counts: Record<string, number> = {};

  if (range) {
    const cursor = new Date(range.start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(range.end);
    endDay.setHours(0, 0, 0, 0);
    while (cursor <= endDay) {
      counts[toLocalDateKey(cursor)] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  for (const c of calls) {
    const day = c.started_at.slice(0, 10);
    counts[day] = (counts[day] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      name: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      value,
    }));
}

async function fetchCallHistoryForRange(
  start: Date,
  end: Date,
): Promise<CallHistoryItem[]> {
  const startMs = start.getTime();
  const dateFrom = toLocalDateKey(start);
  const dateTo = toLocalDateKey(end);

  try {
    const collected: CallHistoryItem[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 50) {
      const res = await poseidonService.getCallHistory(
        page,
        100,
        undefined,
        dateFrom,
        dateTo,
      );
      collected.push(...(res.calls ?? []));
      totalPages = res.pages ?? 1;
      if (!res.calls?.length) break;
      page += 1;
    }
    return collected;
  } catch (err) {
    console.warn('[OperatorDashboard] date-filtered history failed, paginating', err);
    const collected: CallHistoryItem[] = [];
    let page = 1;

    while (page <= 50) {
      const res = await poseidonService.getCallHistory(page, 100);
      if (!res.calls?.length) break;
      collected.push(...res.calls);

      const oldestMs = Math.min(
        ...res.calls.map((c) => new Date(c.started_at).getTime()),
      );
      if (oldestMs < startMs || page >= (res.pages ?? 1)) break;
      page += 1;
    }
    return filterCallsInRange(collected, start, end);
  }
}

function filterCallsInRange(
  calls: CallHistoryItem[],
  start: Date,
  end: Date,
): CallHistoryItem[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return calls.filter((c) => {
    const t = new Date(c.started_at).getTime();
    return t >= startMs && t <= endMs;
  });
}

/** Client-side date window for filtering the recent history page by period. */
function getPeriodDateRange(period: DashboardPeriod): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;
    case 'past_7_days':
      start.setDate(start.getDate() - 6);
      break;
    case 'past_30_days':
      start.setDate(start.getDate() - 29);
      break;
    case 'past_90_days':
      start.setDate(start.getDate() - 89);
      break;
    case 'this_week': {
      const dow = start.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      start.setDate(start.getDate() + mondayOffset);
      const friday = new Date(start);
      friday.setDate(start.getDate() + 4);
      friday.setHours(23, 59, 59, 999);
      return { start, end: friday.getTime() > end.getTime() ? end : friday };
    }
    case 'this_month':
      start.setDate(1);
      break;
    case 'this_year':
      start.setMonth(0, 1);
      break;
  }
  return { start, end };
}

function fmtRangeLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function parseLocalDateStart(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseLocalDateEnd(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function getFilterDateRange(
  period: DashboardPeriod,
  customRange: { dateFrom: string; dateTo: string } | null,
): { start: Date; end: Date } {
  if (customRange) {
    return {
      start: parseLocalDateStart(customRange.dateFrom),
      end: parseLocalDateEnd(customRange.dateTo),
    };
  }
  return getPeriodDateRange(period);
}

function buildDashboardFilter(
  period: DashboardPeriod,
  customRange: { dateFrom: string; dateTo: string } | null,
): DashboardFilter {
  if (customRange) {
    return { mode: 'custom', dateFrom: customRange.dateFrom, dateTo: customRange.dateTo };
  }
  return { mode: 'preset', period: toApiPeriod(period) };
}

function isInsightsFilterAvailable(
  period: DashboardPeriod,
  customRange: { dateFrom: string; dateTo: string } | null,
): boolean {
  if (customRange) {
    return customRangeSpanDays(customRange.dateFrom, customRange.dateTo) <= 90;
  }
  return toInsightsPeriod(period) !== null;
}

// ── Component ──────────────────────────────────────────────────────────
const OperatorDashboard: React.FC = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('past_7_days');
  const [customRange, setCustomRange] = useState<{ dateFrom: string; dateTo: string } | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [allCalls, setAllCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showCostBasis, setShowCostBasis] = useState(false);
  const [showCostDetail, setShowCostDetail] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [includeTestCalls, setIncludeTestCalls] = useState(false);
  const includeTestCallsRef = useRef(false);
  includeTestCallsRef.current = includeTestCalls;
  const intervalRef = useRef<number | null>(null);
  const periodRef = useRef<DashboardPeriod>(period);
  periodRef.current = period;
  const customRangeRef = useRef(customRange);
  customRangeRef.current = customRange;

  const isCustomFilter = customRange !== null;
  const activePill = !isCustomFilter && PILL_PERIODS.includes(period as PillPeriod)
    ? (period as PillPeriod)
    : null;

  const { effectiveTheme } = useTheme();
  const chartTheme = useMemo(() => getOdChartTheme(effectiveTheme), [effectiveTheme]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async (showPeriodSpinner = false) => {
    if (showPeriodSpinner) setPeriodLoading(true);
    try {
      const filter = buildDashboardFilter(periodRef.current, customRangeRef.current);
      const testCalls = includeTestCallsRef.current;
      const range = getFilterDateRange(periodRef.current, customRangeRef.current);
      const insightsAvailable = isInsightsFilterAvailable(periodRef.current, customRangeRef.current);

      const insightsPromise = insightsAvailable
        ? poseidonService.getAnalyticsInsights(filter, testCalls)
        : Promise.resolve(null);

      const results = await Promise.allSettled([
        poseidonService.getAnalyticsSummary(filter, testCalls),
        poseidonService.getCostAnalytics(filter, testCalls),
        poseidonService.getActiveCalls(),
        fetchCallHistoryForRange(range.start, range.end),
        insightsPromise,
      ]);

      const [analyticsResult, costResult, activeResult, historyResult, insightsResult] = results;

      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value);
      } else {
        console.error('[OperatorDashboard] analytics fetch error', analyticsResult.reason);
        if (loading) setError('Failed to load analytics.');
      }

      if (costResult.status === 'fulfilled') {
        setCostAnalytics(costResult.value);
      } else {
        console.error('[OperatorDashboard] cost fetch error', costResult.reason);
      }

      if (activeResult.status === 'fulfilled') {
        setActiveCalls(activeResult.value.calls ?? []);
      } else {
        console.error('[OperatorDashboard] active calls fetch error', activeResult.reason);
      }

      if (historyResult.status === 'fulfilled') {
        setAllCalls(historyResult.value);
      } else {
        console.error('[OperatorDashboard] history fetch error', historyResult.reason);
      }

      if (insightsResult.status === 'fulfilled') {
        setInsights(insightsResult.value);
      } else {
        // Non-critical: insights missing just shows the unavailable state
        setInsights(null);
        console.warn('[OperatorDashboard] insights fetch error', insightsResult.reason);
      }

      if (analyticsResult.status === 'fulfilled') {
        setError(null);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[OperatorDashboard] fetch error', err);
      if (loading) setError('Failed to load data.');
    } finally {
      setLoading(false);
      setPeriodLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load + 30s poll
  useEffect(() => {
    setLoading(true);
    void fetchAll();
    intervalRef.current = window.setInterval(() => void fetchAll(), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch analytics when period, custom range, or test-calls toggle changes
  useEffect(() => {
    void fetchAll(true);
  }, [period, customRange, includeTestCalls, fetchAll]);

  // ── Derived metrics ──────────────────────────────────────────────────
  const totalCalls = analytics?.calls.total ?? 0;
  const answeredPct = totalCalls > 0 ? 100 : 0;

  const totalMinutes = useMemo(() => {
    if (costAnalytics?.breakdown?.calls?.total_minutes != null) {
      return costAnalytics.breakdown.calls.total_minutes;
    }
    if (analytics) {
      return (analytics.calls.avg_duration_seconds * analytics.calls.total) / 60;
    }
    return 0;
  }, [costAnalytics, analytics]);

  const avgDurationSeconds = analytics?.calls.avg_duration_seconds ?? 0;

  const dashboardFilter = useMemo(
    () => buildDashboardFilter(period, customRange),
    [period, customRange],
  );

  const filterLabel = useMemo(() => {
    if (customRange && isPilotRange(customRange)) return PILOT_RANGE_LABEL;
    if (analytics?.period === 'custom' && analytics.date_from && analytics.date_to) {
      return formatCustomRangeLabel(analytics.date_from, analytics.date_to);
    }
    if (customRange) {
      return formatCustomRangeLabel(customRange.dateFrom, customRange.dateTo);
    }
    return PERIOD_LABELS[period];
  }, [analytics, customRange, period]);

  const periodDropdownValue = useMemo((): PeriodDropdownValue => {
    if (customRange && isPilotRange(customRange)) return 'pilot';
    return period;
  }, [customRange, period]);

  const insightsAvailable = useMemo(
    () => isInsightsFilterAvailable(period, customRange),
    [period, customRange],
  );

  // ── Chart / history data (client-side date filtering) ────────────────
  const periodRange = useMemo(
    () => getFilterDateRange(period, customRange),
    [period, customRange],
  );
  const chartCalls = useMemo(
    () => filterCallsInRange(allCalls, periodRange.start, periodRange.end),
    [allCalls, periodRange],
  );
  const historyCalls = useMemo(
    () => filterCallsInRange(allCalls, periodRange.start, periodRange.end),
    [allCalls, periodRange],
  );
  const isSingleDay = useMemo(() => {
    if (customRange) return customRange.dateFrom === customRange.dateTo;
    return period === 'today' || period === 'yesterday';
  }, [customRange, period]);

  // For today / yesterday use the hourly breakdown from insights (24 bars, "8 AM" etc.)
  // For multi-day periods fall back to aggregating call history by calendar day.
  const dailyData = useMemo(() => {
    if (isSingleDay && insights?.calls_by_hour?.length) {
      return insights.calls_by_hour.map((h) => ({ name: h.label, value: h.count }));
    }

    const fromHistory = aggregateByDate(chartCalls, periodRange);

    // Last-resort fallback: if history returned nothing for a single day but the
    // analytics summary has a total, synthesise a single bar so the chart isn't blank.
    if (isSingleDay) {
      const historyTotal = fromHistory.reduce((s, d) => s + d.value, 0);
      if (historyTotal === 0 && (analytics?.calls.total ?? 0) > 0) {
        const dayLabel = new Date(periodRange.start).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        return [{ name: dayLabel, value: analytics!.calls.total }];
      }
    }

    return fromHistory;
  }, [isSingleDay, insights, chartCalls, periodRange, analytics]);
  // Marketing demo: show all-time global peak everywhere, capped at period total calls.
  const peakConcurrentCalls = useMemo(() => {
    const total = analytics?.calls.total ?? 0;
    const globalPeak = analytics?.global_peak_concurrent?.count ?? 0;
    const periodPeak = analytics?.calls.peak_concurrent ?? 0;
    const rawPeak = globalPeak > 0 ? globalPeak : periodPeak;
    return Math.min(total, rawPeak);
  }, [analytics]);
  const callsCost = costAnalytics?.breakdown?.calls?.cost ?? 0;
  const costChartData = useMemo(
    () =>
      (costAnalytics?.chart_data ?? []).map((d) => ({
        label: d.label,
        value: d.calls_cost,
      })),
    [costAnalytics],
  );
  const volumeChartSubtitle = useMemo(() => {
    if (isSingleDay && insights?.calls_by_hour?.length) {
      const active = insights.calls_by_hour.filter((h) => h.count > 0);
      if (active.length >= 2) {
        return `${active[0].label} – ${active[active.length - 1].label}`;
      }
      return 'Hourly breakdown';
    }
    return fmtRangeLabel(periodRange.start, periodRange.end);
  }, [isSingleDay, insights, periodRange]);

  const handlePresetPeriod = (p: DashboardPeriod) => {
    setCustomRange(null);
    setPeriod(p);
  };

  const handlePeriodDropdownChange = (v: PeriodDropdownValue) => {
    if (v === 'pilot') {
      setCustomRange({ dateFrom: PILOT_START_DATE, dateTo: toLocalDateKey(new Date()) });
      return;
    }
    handlePresetPeriod(v);
  };

  const handleCustomRangeApply = (dateFrom: string, dateTo: string) => {
    setCustomRange({ dateFrom, dateTo });
  };

  const handleCustomRangeClear = () => {
    setCustomRange(null);
  };

  const renderCallHistory = (paired: boolean, revealIdx = 11) => (
    <div
      className={`od-history-section od-reveal${paired ? ' od-history-section--paired' : ''}`}
      style={odReveal(revealIdx)}
    >
      <div className="od-history-header">
        <div className="od-expandable-title">
          <FiPhone size={14} />
          Call History · {filterLabel}
          <span className="od-expandable-count">
            <AnimatedNumber value={historyCalls.length} delay={countAnimDelay(revealIdx)} duration={700} />
          </span>
        </div>
      </div>

      <div className="od-history-body">
        {historyCalls.length === 0 ? (
          <p className="od-empty">No calls in this period.</p>
        ) : (
          <div className="od-table-wrap">
            <table className="od-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Caller</th>
                  <th>Flow</th>
                  <th>Agent</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyCalls.map((call) => {
                  const displayStatus = getDisplayOutcomeStatus(call);
                  const durationSeconds = getCallDurationSeconds(call);
                  return (
                    <tr key={call.id}>
                      <td className="od-td-time">
                        <span>{fmtDateTime(call.started_at)}</span>
                        <span className="od-td-rel">{getRelativeTime(call.started_at)}</span>
                      </td>
                      <td className="od-td-mono">{displayPhone(call.caller_phone)}</td>
                      <td>{call.flow_name}</td>
                      <td className="od-td-agent">{call.final_agent}</td>
                      <td className="od-td-mono">
                        {durationSeconds != null ? fmtDuration(durationSeconds) : '—'}
                      </td>
                      <td>
                        <CallStatusPill status={displayStatus} call={call} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── Download handler ─────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await poseidonService.downloadCallsExport(includeTestCalls);
    } catch (err) {
      console.error('[OperatorDashboard] export error', err);
    } finally {
      setDownloading(false);
    }
  }, [includeTestCalls]);

  // Secret toggle: backtick (`) shows/hides Cost Basis chart
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '`') return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }
      setShowCostBasis((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="od-root">
        <div className="od-spinner-wrap">
          <div className="od-spinner" />
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="od-root">
        <div className="od-error">
          <FiAlertCircle size={36} />
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button onClick={() => void fetchAll()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`od-root${revealed ? ' od-root--revealed' : ''}`}>
      {/* ── Header ── */}
      <div className="od-header od-reveal" style={odReveal(0)}>
        <div className="od-header-left">
          <h1>Production Dashboard</h1>
          <p>
            Real-time operations
            <span className="od-last-updated">
              {' '}· Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="od-header-actions">
          {activeCalls.length > 0 && (
            <span className="od-live-badge">
              <span className="od-live-dot" />
              {activeCalls.length} Live
            </span>
          )}
          <button
            type="button"
            className="od-status-btn od-status-btn--healthy"
            onClick={() => setShowMaintenance(true)}
            aria-label="Status: Healthy"
            title="View system status"
          >
            <IoShieldCheckmark size={18} />
            Status: Healthy
          </button>
          <button
            type="button"
            className="od-action-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            <FiDownload size={13} style={{ animation: downloading ? 'od-spin 0.8s linear infinite' : undefined }} />
            {downloading ? 'Exporting…' : 'Export XLS'}
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="od-toolbar od-reveal" style={odReveal(1)}>
        <div className="od-period-pills">
          {PILL_PERIODS.map(p => (
            <button
              key={p}
              type="button"
              className={`od-period-pill${activePill === p ? ' active' : ''}${periodLoading && activePill === p ? ' loading' : ''}`}
              onClick={() => handlePresetPeriod(p)}
              disabled={periodLoading}
            >
              {periodLoading && activePill === p ? (
                <span className="od-pill-spinner" />
              ) : null}
              {PILL_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="od-toolbar-right">
          <ToggleSwitch
            label="Include test calls"
            checked={includeTestCalls}
            onChange={setIncludeTestCalls}
            disabled={periodLoading}
          />

          <div className={`od-period-dropdown${periodLoading && !activePill && !isCustomFilter ? ' od-period-dropdown--loading' : ''}`}>
            <CustomDropdown
              options={[...PERIOD_OPTIONS]}
              value={periodDropdownValue}
              onChange={(v) => handlePeriodDropdownChange(v as PeriodDropdownValue)}
              disabled={periodLoading}
              className="od-period-dropdown__control"
              aria-label="Time period"
            />
          </div>

          <CustomDateRangePicker
            activeRange={customRange}
            disabled={periodLoading}
            onApply={handleCustomRangeApply}
            onClear={handleCustomRangeClear}
          />
        </div>
      </div>

      {/* ── Active calls strip (only when active) ── */}
      {activeCalls.length > 0 && (
        <div className="od-active-section od-reveal" style={odReveal(2)}>
          <div className="od-active-header">
            <span className="od-active-title">
              <FiPhone size={14} />
              Active Now
            </span>
            <span className="od-active-count">
              <AnimatedNumber value={activeCalls.length} delay={countAnimDelay(2)} duration={700} />
            </span>
          </div>
          <div className="od-active-list">
            {activeCalls.map(call => (
              <div key={call.id} className="od-active-item">
                <span className="od-active-dot" />
                <div className="od-active-info">
                  <div className="od-active-flow">{call.flow_name}</div>
                  <div className="od-active-meta">
                    {displayPhone(call.caller_phone)} · {call.current_agent}
                  </div>
                </div>
                <span className="od-active-status">{call.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Key Metrics ── */}
      <p className="od-section-label od-reveal" style={odReveal(3)}>Key Metrics</p>
      <div className={`od-metrics-grid${periodLoading ? ' od-metrics-grid--loading' : ''}`}>
        {/* Total Calls */}
        <div className="od-metric-card od-reveal" style={odReveal(4)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Total Calls</span>
            <div className="od-metric-icon od-metric-icon--blue">
              <FiPhone size={16} />
            </div>
          </div>
          <div className="od-metric-value">
            <AnimatedNumber value={totalCalls} delay={countAnimDelay(4)} />
          </div>
          {activeCalls.length > 0 && (
            <span className="od-metric-badge">
              <FiArrowUp size={10} />
              Active <AnimatedNumber value={activeCalls.length} delay={countAnimDelay(4) + 80} duration={600} />
            </span>
          )}
        </div>

        {/* Call Coverage Rate */}
        <div className="od-metric-card od-reveal" style={odReveal(5)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Call Coverage Rate</span>
            <div className="od-metric-icon od-metric-icon--green">
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div className="od-metric-value">
            {totalCalls > 0 ? (
              <AnimatedNumber value={answeredPct} suffix="%" delay={countAnimDelay(5)} />
            ) : (
              '—'
            )}
          </div>
          <span className="od-metric-badge">
            <FiArrowUp size={10} />
            <AnimatedNumber value={totalCalls} delay={countAnimDelay(5) + 80} duration={700} /> completed
          </span>
        </div>

        {/* Total Call Time */}
        <div className="od-metric-card od-reveal" style={odReveal(6)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Total Call Time</span>
            <div className="od-metric-icon od-metric-icon--amber">
              <FiActivity size={16} />
            </div>
          </div>
          <div className="od-metric-value od-metric-value-sm">
            <AnimatedNumber value={totalMinutes} decimals={2} delay={countAnimDelay(6)} />
            {' '}
            <span className="od-metric-unit">mins</span>
          </div>
        </div>

        {/* Average Call Duration */}
        <div className="od-metric-card od-reveal" style={odReveal(7)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Avg Call Duration</span>
            <div className="od-metric-icon od-metric-icon--blue">
              <FiClock size={16} />
            </div>
          </div>
          <div className="od-metric-value od-metric-value-sm">
            <AnimatedNumber
              value={avgDurationSeconds}
              formatter={fmtDuration}
              delay={countAnimDelay(7)}
            />
          </div>
        </div>

        {/* Peak Concurrent Calls */}
        <div className="od-metric-card od-reveal" style={odReveal(8)}>
          <div className="od-metric-header">
            <span className="od-metric-label">Peak Concurrent Calls</span>
            <div className="od-metric-icon od-metric-icon--purple">
              <FiTrendingUp size={16} />
            </div>
          </div>
          <div className="od-metric-value">
            <AnimatedNumber value={peakConcurrentCalls} delay={countAnimDelay(8)} />
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <p className="od-section-label od-reveal" style={odReveal(9)}>Trends · {filterLabel}</p>
      <div className="od-charts-grid">
        <div className="od-chart-card od-reveal" style={odReveal(10)}>
          <div className="od-chart-header">
            <p className="od-chart-title">Call Volume</p>
            <p className="od-chart-subtitle">{volumeChartSubtitle}</p>
          </div>
          {dailyData.length === 0 ? (
            <p className="od-chart-empty">No calls in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                key={customRange ? `${customRange.dateFrom}_${customRange.dateTo}` : period}
                data={dailyData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                barSize={dailyData.length >= 24 ? 10 : dailyData.length > 14 ? 12 : 24}
              >
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={chartTheme.grid} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: chartTheme.tick }}
                  interval="preserveStartEnd"
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
                  formatter={(v: number) => [v, 'Calls']}
                />
                <Bar
                  dataKey="value"
                  fill={chartTheme.bar}
                  activeBar={{ fill: chartTheme.barActive }}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {showCostBasis ? (
          <div className="od-chart-card od-reveal" style={odReveal(11)}>
            <div className="od-chart-header">
              <div className="od-chart-header-left">
                <p className="od-chart-title">Cost Basis</p>
                <p className="od-chart-subtitle">
                  {costAnalytics
                    ? `Calls only · ${filterLabel} · $${callsCost.toFixed(2)}`
                    : 'Daily call cost'}
                </p>
              </div>
              <button
                type="button"
                className="od-cost-detail-btn"
                onClick={() => setShowCostDetail(true)}
                title="View cost breakdown by component"
              >
                Detail
              </button>
            </div>
            {!costAnalytics || costChartData.length === 0 ? (
              <p className="od-chart-empty">No cost data in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={costChartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: chartTheme.tick }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: chartTheme.tick }}
                    allowDecimals
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    labelStyle={chartTheme.tooltipLabelStyle}
                    itemStyle={chartTheme.tooltipItemStyle}
                    cursor={{ fill: chartTheme.cursor }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Calls']}
                  />
                  <Bar
                    dataKey="value"
                    fill={chartTheme.bar}
                    activeBar={{ fill: chartTheme.barActive }}
                    radius={[4, 4, 0, 0]}
                    name="Calls"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          renderCallHistory(true, 11)
        )}
      </div>

      {showCostBasis && renderCallHistory(false, 12)}

      <OperatorDashboardInsights
        filter={dashboardFilter}
        periodLabel={filterLabel}
        insightsAvailable={insightsAvailable}
        includeTestCalls={includeTestCalls}
        insights={insights}
        loading={periodLoading}
        revealBase={13}
      />

      {showCostDetail && (
        <CostDetailModal
          filter={dashboardFilter}
          periodLabel={filterLabel}
          includeTestCalls={includeTestCalls}
          onClose={() => setShowCostDetail(false)}
        />
      )}

      {showMaintenance && (
        <MaintenanceModal onClose={() => setShowMaintenance(false)} />
      )}
    </div>
  );
};

export default OperatorDashboard;
