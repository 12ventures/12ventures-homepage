import type { ActiveCall, CallHistoryItem } from '../../services/poseidonService';

export const VIDEO_DEMO_CALL_ID = 'sarh-video-demo-call';

const DEMO_PHONE = '+15598675309';
const DEMO_FLOW = 'After-Hours Intake';
const DEMO_DURATION_SECONDS = 247;

export type VideoDemoPhase = 'waiting' | 'live' | 'exiting' | 'completed';

export function buildVideoDemoActiveCall(now = Date.now()): ActiveCall {
  const started = new Date(now - 95_000);
  return {
    id: VIDEO_DEMO_CALL_ID,
    call_sid: 'CA_video_demo_sarh',
    caller_phone: DEMO_PHONE,
    flow_name: DEMO_FLOW,
    current_agent: 'Triage Agent',
    started_at: started.toISOString(),
    status: 'listening',
    last_updated: new Date(now).toISOString(),
  };
}

export function buildVideoDemoHistoryCall(now = Date.now()): CallHistoryItem {
  const ended = new Date(now);
  const started = new Date(now - DEMO_DURATION_SECONDS * 1000);
  return {
    id: VIDEO_DEMO_CALL_ID,
    call_sid: 'CA_video_demo_sarh',
    caller_phone: DEMO_PHONE,
    flow_name: DEMO_FLOW,
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    duration_seconds: DEMO_DURATION_SECONDS,
    final_agent: 'Intake Agent',
    outcome_status: 'completed',
    outcome_reason: 'completed_normally',
    created_at: ended.toISOString(),
  };
}
