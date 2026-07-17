import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiInfo } from 'react-icons/fi';
import type { CallHistoryItem } from '../../services/poseidonService';
import { isNonEngagementCall, type DisplayOutcomeStatus } from './callHistoryUtils';

const OUTCOME_REASON_MESSAGES: Record<string, string> = {
  completed_normally: 'Call completed successfully.',
  insufficient_data: 'Caller ended conversation without providing complete data.',
  openai_error: 'A telephony error occurred during this call.',
  patient_disconnected: 'Caller disconnected before completing intake.',
  completed_at_triage: 'Call completed during triage routing.',
  repaired_stale_record: 'Record repaired from a stale session.',
};

const NON_ENGAGEMENT_MESSAGE = 'Caller decided not to proceed with intake.';

const TELEPHONY_OK = 'No telephony errors occurred.';
const TELEPHONY_ERROR = 'A telephony error occurred during this call.';

export type OutcomeDetailLine = {
  text: string;
  variant?: 'telephony-ok' | 'telephony-error' | 'default';
};

function humanizeReason(reason: string): string {
  return reason
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getOutcomeDetailLines(call: CallHistoryItem): OutcomeDetailLine[] {
  const lines: OutcomeDetailLine[] = [];
  const reason = call.outcome_reason?.trim();

  if (isNonEngagementCall(call)) {
    lines.push({ text: NON_ENGAGEMENT_MESSAGE });
  } else if (reason && reason !== 'openai_error') {
    if (OUTCOME_REASON_MESSAGES[reason]) {
      lines.push({ text: OUTCOME_REASON_MESSAGES[reason] });
    } else {
      lines.push({ text: humanizeReason(reason) });
    }
  }

  if (call.openai_error_occurred) {
    lines.push({ text: TELEPHONY_ERROR, variant: 'telephony-error' });
  } else {
    lines.push({ text: TELEPHONY_OK, variant: 'telephony-ok' });
  }

  if (lines.length === 1 && lines[0].text === TELEPHONY_OK && !reason) {
    lines.unshift({ text: 'No additional outcome details.' });
  }

  return lines;
}

interface Props {
  status: DisplayOutcomeStatus;
  call: CallHistoryItem;
}

const CallStatusPill = memo(function CallStatusPill({ status, call }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const detailLines = getOutcomeDetailLines(call);

  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 260;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    setPos({ top: rect.bottom + 6, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (document.getElementById(popoverId)?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReposition = () => updatePosition();
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, popoverId, updatePosition]);

  const popover = open ? (
    <div
      id={popoverId}
      className="od-status-popover"
      role="tooltip"
      style={{ top: pos.top, left: pos.left }}
    >
      <p className="od-status-popover__title">Outcome</p>
      {detailLines.map((line, i) => (
        <p
          key={i}
          className={`od-status-popover__line${
            line.variant === 'telephony-ok'
              ? ' od-status-popover__line--telephony-ok'
              : line.variant === 'telephony-error'
                ? ' od-status-popover__line--telephony-error'
                : ''
          }`}
        >
          {line.text}
        </p>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`od-status-pill od-status-pill--btn od-status-pill--${status}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        title="View outcome details"
      >
        <span>{status}</span>
        <FiInfo size={11} className="od-status-pill__icon" aria-hidden="true" />
      </button>
      {popover && createPortal(popover, document.body)}
    </>
  );
});

export default CallStatusPill;
