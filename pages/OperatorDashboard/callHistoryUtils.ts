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
  'incomplete',
  'declined',
  'failed',
];

export const DISPLAY_STATUS_LABELS: Record<DisplayOutcomeStatus, string> = {
  completed: 'Completed',
  declined: 'Declined <45 seconds',
  incomplete: 'Incomplete ≥ 45 seconds',
  failed: 'Failed',
};

function parseBackendOutcomeStatus(
  raw: string,
): CallHistoryItem['outcome_status'] | null {
  const s = raw.trim().toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'failed') return 'failed';
  if (s === 'incomplete' || s.startsWith('incomplete')) return 'incomplete';
  return null;
}

/**
 * Same labels as the dashboard Call History pills / breakdown, from the
 * raw export fields (backend status + duration / triage overlay).
 */
export function getDisplayOutcomeLabelFromFields(fields: {
  outcomeStatus: string;
  finalAgent?: string | null;
  outcomeReason?: string | null;
  durationSeconds?: number | null;
  startedAt?: string | null;
  endedAt?: string | null;
}): string | null {
  const lowered = fields.outcomeStatus.trim().toLowerCase();
  if (
    lowered === '< 45 seconds' ||
    lowered === '<45 seconds' ||
    lowered === 'declined <45 seconds' ||
    lowered === 'declined < 45 seconds'
  ) {
    return DISPLAY_STATUS_LABELS.declined;
  }
  if (lowered === 'declined') {
    const duration = fields.durationSeconds;
    const agent = fields.finalAgent?.trim().toLowerCase() ?? '';
    const reason = fields.outcomeReason?.trim() ?? '';
    if (
      agent === 'triage' ||
      reason === 'completed_at_triage' ||
      (duration != null && duration < NON_ENGAGEMENT_MAX_SECONDS)
    ) {
      return DISPLAY_STATUS_LABELS.declined;
    }
  }

  const outcome_status = parseBackendOutcomeStatus(fields.outcomeStatus);
  if (!outcome_status) return null;

  const call = {
    outcome_status,
    final_agent: fields.finalAgent ?? '',
    outcome_reason: fields.outcomeReason ?? null,
    duration_seconds: fields.durationSeconds ?? undefined,
    started_at: fields.startedAt || '1970-01-01T00:00:00.000Z',
    ended_at: fields.endedAt ?? undefined,
  } as CallHistoryItem;

  return DISPLAY_STATUS_LABELS[getDisplayOutcomeStatus(call)];
}

/**
 * Hover copy for the status-breakdown modal. Declined is applied in the
 * dashboard (`isNonEngagementCall`); the other three are the backend
 * `outcome_status` after that overlay.
 */
export const DISPLAY_STATUS_DESCRIPTIONS: Record<DisplayOutcomeStatus, string> = {
  completed: 'Intake was successfully gathered.',
  declined: 'The call lasted under 45 seconds.',
  incomplete: 'Caller started intake but did not finish. The call lasted 45 seconds or longer.',
  failed: 'The call ended because of a system or telephony error.',
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
