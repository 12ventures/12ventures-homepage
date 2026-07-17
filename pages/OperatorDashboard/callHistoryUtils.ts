import type { CallHistoryItem } from '../../services/poseidonService';

/** Calls shorter than this are treated as non-engagement (user chose not to proceed). */
export const NON_ENGAGEMENT_MAX_SECONDS = 45;

export function getCallDurationSeconds(call: CallHistoryItem): number | null {
  if (call.duration_seconds != null) return call.duration_seconds;
  if (!call.ended_at) return null;
  return Math.floor(
    (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000,
  );
}

/** Triage exit or very short call — user did not proceed with full intake. */
export function isNonEngagementCall(call: CallHistoryItem): boolean {
  if (call.final_agent?.trim().toLowerCase() === 'triage') return true;
  if (call.outcome_reason === 'completed_at_triage') return true;

  const duration = getCallDurationSeconds(call);
  if (duration != null && duration < NON_ENGAGEMENT_MAX_SECONDS) return true;

  return false;
}

/** Display statuses for call history pills (includes UI-only `declined`). */
export type DisplayOutcomeStatus =
  | CallHistoryItem['outcome_status']
  | 'declined';

/** Visual-only status overrides for call history display. */
export function getDisplayOutcomeStatus(call: CallHistoryItem): DisplayOutcomeStatus {
  if (isNonEngagementCall(call)) return 'declined';
  return call.outcome_status;
}

export const DISPLAY_STATUS_ORDER: DisplayOutcomeStatus[] = [
  'completed',
  'declined',
  'incomplete',
  'failed',
];

export const DISPLAY_STATUS_LABELS: Record<DisplayOutcomeStatus, string> = {
  completed: 'Completed',
  declined: 'Declined',
  incomplete: 'Incomplete',
  failed: 'Failed',
};

export const DISPLAY_STATUS_COLORS: Record<DisplayOutcomeStatus, string> = {
  completed: '#34d399',
  declined: '#60a5fa',
  incomplete: '#fbbf24',
  failed: '#f87171',
};

export type CallStatusBreakdownItem = {
  status: DisplayOutcomeStatus;
  label: string;
  count: number;
  color: string;
};

export function summarizeCallHistoryStatuses(
  calls: CallHistoryItem[],
): { total: number; items: CallStatusBreakdownItem[] } {
  const counts: Record<DisplayOutcomeStatus, number> = {
    completed: 0,
    declined: 0,
    incomplete: 0,
    failed: 0,
  };
  for (const call of calls) {
    counts[getDisplayOutcomeStatus(call)]++;
  }
  const items = DISPLAY_STATUS_ORDER.map((status) => ({
    status,
    label: DISPLAY_STATUS_LABELS[status],
    count: counts[status],
    color: DISPLAY_STATUS_COLORS[status],
  }));
  return { total: calls.length, items };
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
