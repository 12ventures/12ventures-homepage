/**
 * Hospital / product timezone for SARH dashboard day boundaries.
 * Must match backend `tz` interpretation — not the viewer's browser timezone.
 */
export const DASHBOARD_TZ = 'America/Los_Angeles';

const POSEIDON_API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.poseidonai.12ventures.io' 
  : 'http://localhost:8001';

/** YYYY-MM-DD for an instant in the dashboard (hospital) timezone. */
export function toZonedDateKey(
  isoOrDate: string | Date,
  timeZone: string = DASHBOARD_TZ,
): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${day}`;
}

/** Today's calendar date in the dashboard timezone. */
export function todayInDashboardTz(timeZone: string = DASHBOARD_TZ): string {
  return toZonedDateKey(new Date(), timeZone);
}

/** Add/subtract whole calendar days from a YYYY-MM-DD key (timezone-agnostic). */
export function addCalendarDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
}

/** Day of week for a YYYY-MM-DD key: 0=Sun … 6=Sat (calendar date, not viewer TZ). */
export function calendarDayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Short chart/table label from YYYY-MM-DD, e.g. "Jul 3". */
export function formatDateKeyShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Types based on API Guide

export interface ActiveCall {
  id: string;
  call_sid: string;
  caller_phone: string;
  flow_name: string;
  current_agent: string;
  started_at: string;
  status: 'listening' | 'speaking' | 'processing';
  last_updated: string;
}

export interface CallHistoryItem {
  id: string;
  call_sid: string;
  caller_phone: string;
  flow_name: string;
  started_at: string;
  ended_at?: string; // May be missing for ongoing calls
  duration_seconds?: number; // May be missing for ongoing calls - calculate from started_at
  final_agent: string;
  outcome_status: 'completed' | 'incomplete' | 'failed';
  outcome_reason?: string | null;
  openai_error_occurred?: boolean;
  agent_path?: string[];
  report_file_path?: string;
  patient_data?: {
    first_name?: string;
    last_name?: string;
    email_address?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface CallHistoryResponse {
  calls: CallHistoryItem[];
  total: number;
  page: number;
  pages: number;
}

export interface FaxEvent {
  id: string;
  email_message_id: string;
  direction: 'inbound' | 'outbound';
  from_email: string;
  to_email: string;
  subject: string;
  received_at?: string;
  sent_at?: string;
  status: 'processing' | 'completed' | 'failed';
  input_file_paths: string[];
  output_file_paths: string[];
  error_message?: string;
  processing_duration_seconds?: number;
  created_at: string;
}

export interface FaxFeedResponse {
  events: FaxEvent[];
  total: number;
  page: number;
}

/** Shared range metadata on analytics responses. */
export interface AnalyticsRangeMeta {
  period: string;
  date_from?: string | null;
  date_to?: string | null;
  span_days?: number | null;
  tz?: string;
}

export type DashboardFilter =
  | { mode: 'preset'; period: string; tz?: string }
  | { mode: 'custom'; dateFrom: string; dateTo: string; tz?: string };

export function buildAnalyticsParams(filter: DashboardFilter, includeTestCalls = false): URLSearchParams {
  const params = new URLSearchParams();
  params.set('tz', filter.tz ?? DASHBOARD_TZ);
  if (includeTestCalls) params.set('include_test_calls', 'true');
  if (filter.mode === 'custom') {
    params.set('date_from', filter.dateFrom);
    params.set('date_to', filter.dateTo);
  } else {
    params.set('period', filter.period);
  }
  return params;
}

/** Format YYYY-MM-DD range for display, e.g. "Jun 1 – Jun 30, 2026". */
export function formatCustomRangeLabel(dateFrom: string, dateTo: string): string {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const start = parse(dateFrom);
  const end = parse(dateTo);
  if (dateFrom === dateTo) {
    return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmtStart = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const fmtEnd = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmtStart} – ${fmtEnd}`;
}

export function customRangeSpanDays(dateFrom: string, dateTo: string): number {
  const [y1, m1, d1] = dateFrom.split('-').map(Number);
  const [y2, m2, d2] = dateTo.split('-').map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Mon–Fri days in an inclusive YYYY-MM-DD calendar range. */
export function countWeekdaysInRange(dateFrom: string, dateTo: string): number {
  let count = 0;
  let cursor = dateFrom;
  while (cursor <= dateTo) {
    const dow = calendarDayOfWeek(cursor);
    if (dow !== 0 && dow !== 6) count++;
    cursor = addCalendarDays(cursor, 1);
  }
  return count;
}

/**
 * Divisor for daily call averages: weekdays only, unless the period is
 * exclusively weekend day(s) (e.g. Sat–Sun or a single Saturday).
 */
export function getDailyAverageDivisorDays(dateFrom: string, dateTo: string): number {
  const total = customRangeSpanDays(dateFrom, dateTo);
  const weekdays = countWeekdaysInRange(dateFrom, dateTo);
  return weekdays > 0 ? weekdays : total;
}

/** Per-day call counts (hospital TZ) for an inclusive YYYY-MM-DD range. */
export function buildDailyCallCounts(
  calls: { started_at: string }[],
  range: { dateFrom: string; dateTo: string },
  timeZone: string = DASHBOARD_TZ,
): Record<string, number> {
  const counts: Record<string, number> = {};
  let cursor = range.dateFrom;
  while (cursor <= range.dateTo) {
    counts[cursor] = 0;
    cursor = addCalendarDays(cursor, 1);
  }
  for (const call of calls) {
    const day = toZonedDateKey(call.started_at, timeZone);
    if (!day || counts[day] == null) continue;
    counts[day]++;
  }
  return counts;
}

/** Days with more than this many calls count toward the daily average. */
export const DAILY_AVERAGE_MIN_CALLS = 2;

export interface DailyAverageResult {
  average: number;
  divisorDays: number;
  qualifyingCalls: number;
}

/**
 * Daily average excluding weekends and days with ≤1 call.
 * Numerator = calls on qualifying days only; divisor = count of those days.
 */
export function computeDailyAverage(
  dateFrom: string,
  dateTo: string,
  dailyCounts: Record<string, number>,
  minCallsPerDay = DAILY_AVERAGE_MIN_CALLS,
): DailyAverageResult | null {
  const weekdays = countWeekdaysInRange(dateFrom, dateTo);
  const useWeekdaysOnly = weekdays > 0;

  let qualifyingCalls = 0;
  let divisorDays = 0;
  let cursor = dateFrom;
  while (cursor <= dateTo) {
    const dow = calendarDayOfWeek(cursor);
    const isWeekend = dow === 0 || dow === 6;
    const dayEligible = useWeekdaysOnly ? !isWeekend : true;
    const count = dailyCounts[cursor] ?? 0;
    if (dayEligible && count >= minCallsPerDay) {
      qualifyingCalls += count;
      divisorDays++;
    }
    cursor = addCalendarDays(cursor, 1);
  }

  if (divisorDays === 0) return null;
  return {
    average: qualifyingCalls / divisorDays,
    divisorDays,
    qualifyingCalls,
  };
}

export interface AnalyticsSummary extends AnalyticsRangeMeta {
  calls: {
    active: number;
    total: number;
    completed: number;
    incomplete: number;
    failed: number;
    success_rate: number;
    avg_duration_seconds: number;
    peak_concurrent?: number;
  };
  global_peak_concurrent?: {
    count: number;
    achieved_at: string | null;
  };
  fax: {
    inbound: number;
    outbound: number;
    processing: number;
    failed: number;
  };
  reports_generated: number;
}

export interface CostDetailComponent {
  component: string;
  rate_per_min: number;
  cost: number;
  label: string;
}

export interface CostDetailVendor {
  cost: number;
  note: string;
}

export interface CostDetail extends AnalyticsRangeMeta {
  total_calls: number;
  total_minutes: number;
  total_seconds: number;
  total_cost: number;
  blended_rate_per_min: number;
  vendor_subtotals: Record<string, CostDetailVendor>;
  components: CostDetailComponent[];
}

export interface CostAnalytics extends AnalyticsRangeMeta {
  total_cost: number;
  breakdown: {
    calls: {
      count: number;
      total_minutes: number;
      cost: number;
      rate: string;
    };
    faxes: {
      count: number;
      total_pages: number;
      cost: number;
      rate: string;
    };
    fixed?: {
      label: string;
      cost: number;
      rate: string;
    };
  };
  chart_data: {
    date: string;
    label: string;
    calls_cost: number;
    fax_cost: number;
    fixed_cost: number;
    total: number;
  }[];
}

export interface LabelCount {
  label: string;
  count: number;
}

/** Grouped insurance / exam type row from /analytics/insights. */
export interface NormalizedGroupRow {
  group_id: string;
  label: string;
  count: number;
  raw_variant_count?: number;
  is_other?: boolean;
}

export function computeOtherPercent(rows: NormalizedGroupRow[]): number | null {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const other = rows.find((row) => row.is_other);
  if (!other || total === 0) return null;
  return (other.count / total) * 100;
}

/** Top N groups by call count (includes Other when it ranks in the top N). */
export function sliceGroupedRows(rows: NormalizedGroupRow[], topN: number): NormalizedGroupRow[] {
  return [...rows]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export interface HourCount {
  hour: number;
  label: string;
  count: number;
}

export interface PhoneAttemptBreakdown {
  attempts: 0 | 1 | '2+';
  count: number;
}

export interface AnalyticsInsights extends AnalyticsRangeMeta {
  total_calls: number;
  unique_callers: number;
  repeat_callers: number;
  exam_types: NormalizedGroupRow[];
  order_status: LabelCount[];
  top_insurances: NormalizedGroupRow[];
  agent_paths: LabelCount[];
  duration_buckets: LabelCount[];
  calls_by_hour: HourCount[];
  phone_attempt_breakdown: PhoneAttemptBreakdown[];
}

export type AnalyticsInsightsBreakdownField = 'insurance_groups' | 'exam_type_groups';

export interface BreakdownGroupItem {
  group_id: string;
  label: string;
  count: number;
}

export interface BreakdownVariantItem {
  label: string;
  count: number;
}

interface AnalyticsInsightsBreakdownBase extends AnalyticsRangeMeta {
  field: AnalyticsInsightsBreakdownField;
  total_with_value: number;
}

export interface AnalyticsInsightsBreakdownGroupList extends AnalyticsInsightsBreakdownBase {
  items: BreakdownGroupItem[];
}

export interface AnalyticsInsightsBreakdownVariants extends AnalyticsInsightsBreakdownBase {
  group_id: string;
  items: BreakdownVariantItem[];
}

export type AnalyticsInsightsBreakdown =
  | AnalyticsInsightsBreakdownGroupList
  | AnalyticsInsightsBreakdownVariants;

export function isBreakdownVariantView(
  data: AnalyticsInsightsBreakdown,
): data is AnalyticsInsightsBreakdownVariants {
  return 'group_id' in data && typeof data.group_id === 'string';
}

export interface MaintenanceStatus {
  production_uptime_percent: number;
  production_uptime_display: string;
  active_agents: number;
  max_concurrent: number;
  wait_time_seconds: number;
  wait_time_display: string;
  source: string;
  updated_at: string;
}

export interface CallDetails extends CallHistoryItem {
  patient_data: {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    email_address?: string;
    cell_phone?: string;
    [key: string]: any;
  };
}

// Service implementation using axios for simplicity (or fetch)
// Using fetch to avoid adding axios dependency if it's not already there (though likely is)
// Actually, standard fetch is safer if I don't know dependencies.
// The existing codebase uses a custom api wrapper, but I'll make a simple one for this specific backend.

class PoseidonService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = POSEIDON_API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `API Error: ${response.statusText}`);
      } catch (e) {
        throw new Error(`API Error: ${response.statusText}`);
      }
    }

    return response.json();
  }

  async getActiveCalls(): Promise<{ calls: ActiveCall[]; total: number }> {
    return this.request('/api/dashboard/calls/active');
  }

  async getCallHistory(
    page: number = 1,
    limit: number = 20,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
    includeTestCalls = false,
  ): Promise<CallHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      tz: DASHBOARD_TZ,
    });
    if (status) params.append('status', status);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (includeTestCalls) params.set('include_test_calls', 'true');
    return this.request(`/api/dashboard/calls/history?${params.toString()}`);
  }

  async getFaxFeed(
    page: number = 1, 
    limit: number = 20, 
    status?: string
  ): Promise<FaxFeedResponse> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    
    return this.request(`/api/dashboard/fax/feed?${params.toString()}`);
  }

  async getAnalyticsSummary(filter: DashboardFilter, includeTestCalls = false): Promise<AnalyticsSummary> {
    return this.request(`/api/dashboard/analytics/summary?${buildAnalyticsParams(filter, includeTestCalls).toString()}`);
  }

  async getCostAnalytics(filter: DashboardFilter, includeTestCalls = false): Promise<CostAnalytics> {
    return this.request(`/api/dashboard/analytics/costs?${buildAnalyticsParams(filter, includeTestCalls).toString()}`);
  }

  async getCostDetail(filter: DashboardFilter, includeTestCalls = false): Promise<CostDetail> {
    return this.request(`/api/dashboard/analytics/costs/detail?${buildAnalyticsParams(filter, includeTestCalls).toString()}`);
  }

  async getAnalyticsInsights(filter: DashboardFilter, includeTestCalls = false): Promise<AnalyticsInsights> {
    return this.request(`/api/dashboard/analytics/insights?${buildAnalyticsParams(filter, includeTestCalls).toString()}`);
  }

  async getAnalyticsInsightsBreakdown(
    filter: DashboardFilter,
    field: AnalyticsInsightsBreakdownField,
    includeTestCalls = false,
    groupId?: string,
  ): Promise<AnalyticsInsightsBreakdown> {
    const params = buildAnalyticsParams(filter, includeTestCalls);
    params.set('field', field);
    if (groupId) params.set('group_id', groupId);
    return this.request(`/api/dashboard/analytics/insights/breakdown?${params.toString()}`);
  }

  async getCallDetails(callSid: string): Promise<CallDetails> {
    return this.request(`/api/dashboard/calls/${callSid}`);
  }

  async getMaintenance(): Promise<MaintenanceStatus> {
    return this.request('/api/dashboard/maintenance');
  }

  getReportDownloadUrl(filename: string): string {
    return `${this.baseUrl}/api/dashboard/files/reports/${filename}`;
  }

  getFaxDownloadUrl(direction: 'inbound' | 'outbound', filename: string): string {
    return `${this.baseUrl}/api/dashboard/files/fax/${direction}/${filename}`;
  }

  async downloadCallsExport(includeTestCalls = false): Promise<void> {
    const params = new URLSearchParams({ tabs: 'true', tz: DASHBOARD_TZ });
    if (includeTestCalls) params.set('include_test_calls', 'true');
    const url = `${this.baseUrl}/api/dashboard/calls/history/export?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `calls_summary_${ts}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

export const poseidonService = new PoseidonService();
