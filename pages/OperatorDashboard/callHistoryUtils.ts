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

/** Visual-only status overrides for call history display. */
export function getDisplayOutcomeStatus(
  call: CallHistoryItem,
): CallHistoryItem['outcome_status'] {
  if (isNonEngagementCall(call)) return 'completed';
  return call.outcome_status;
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
