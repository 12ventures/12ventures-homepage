import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import {
  addCalendarDays,
  type BillingCycle,
  type BillingUsageCredits,
} from '../../services/poseidonService';
import './ProductionUsageCredits.css';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const minutesFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percentFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});
const percentOneFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const SHOW_INITIAL_TERM = false;

interface Props {
  data: BillingUsageCredits | null;
  error: boolean;
}

function formatUtcDay(dateKey: string, withYear = false): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
}

function termRangeLabel(startDate: string, exclusiveEnd: string): string {
  const lastDay = addCalendarDays(exclusiveEnd, -1);
  return `${formatUtcDay(startDate)} – ${formatUtcDay(lastDay, true)}`;
}

function cyclePeriodLabel(cycle: BillingCycle): string {
  if (cycle.label) return cycle.label;
  if (cycle.cycle_start && cycle.cycle_end) {
    return termRangeLabel(cycle.cycle_start, cycle.cycle_end);
  }
  return 'Current billing cycle';
}

function remainingCopy(
  remaining: number,
  over: boolean,
  kind: 'minutes' | 'credits',
): { text: string; overage: boolean } {
  const overage = over || remaining < 0;
  if (!overage) {
    return {
      text: kind === 'minutes'
        ? `${minutesFmt.format(remaining)} min left`
        : `${usd.format(remaining)} left`,
      overage: false,
    };
  }
  const magnitude = Math.abs(remaining);
  return {
    text: kind === 'minutes'
      ? `${minutesFmt.format(magnitude)} min over`
      : `${usd.format(magnitude)} over`,
    overage: true,
  };
}

function UsageBar({
  used,
  allocated,
  remaining,
  overAllocation,
  kind,
}: {
  used: number;
  allocated: number;
  remaining: number;
  overAllocation: boolean;
  kind: 'minutes' | 'credits';
}) {
  const rawPct = allocated > 0 ? (used / allocated) * 100 : 0;
  const fillPct = Math.min(100, Math.max(0, rawPct));
  const rem = remainingCopy(remaining, overAllocation, kind);
  const usedLabel = kind === 'minutes'
    ? `${minutesFmt.format(used)} / ${minutesFmt.format(allocated)} min`
    : `${usd.format(used)} / ${usd.format(allocated)}`;

  return (
    <div className={`od-credits-usage${rem.overage ? ' is-over' : ''}`}>
      <div className="od-credits-usage-head">
        <span className="od-credits-usage-kind">{kind === 'minutes' ? 'Minutes' : 'Credits'}</span>
        <span className={`od-credits-remaining${rem.overage ? ' is-over' : ''}`}>{rem.text}</span>
      </div>
      <p className="od-credits-usage-values">{usedLabel}</p>
      <div
        className={`od-credits-bar${rem.overage ? ' is-over' : ''}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fillPct}
        aria-label={`${percentOneFmt.format(rawPct)} percent of ${kind} used`}
      >
        <span className="od-credits-bar-fill" style={{ width: `${fillPct}%` }} />
        <span className="od-credits-bar-label">{percentFmt.format(rawPct)}%</span>
      </div>
    </div>
  );
}

function CycleRow({ cycle }: { cycle: BillingCycle }) {
  return (
    <tr className={cycle.is_current ? 'is-current' : undefined}>
      <td>
        {cycle.label}
        {cycle.is_current ? <span className="od-credits-now">Current</span> : null}
        {/* TEMP: initial term hidden
        {!cycle.is_within_initial_term ? (
          <span className="od-credits-now od-credits-now--muted">After term</span>
        ) : null}
        */}
      </td>
      <td>{minutesFmt.format(cycle.minutes_used)}</td>
      <td>{usd.format(cycle.credits_used)}</td>
    </tr>
  );
}

function MinutesWheel({
  used,
  allocated,
  over,
}: {
  used: number;
  allocated: number;
  over: boolean;
}) {
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const rawPct = allocated > 0 ? (used / allocated) * 100 : 0;
  const fillPct = Math.min(100, Math.max(0, rawPct));
  const dash = (fillPct / 100) * circ;

  return (
    <div className={`od-credits-wheel${over ? ' is-over' : ''}`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(148, 163, 184, 0.18)"
          strokeWidth={stroke}
        />
        <circle
          className="od-credits-wheel-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="od-credits-wheel-pct">{percentFmt.format(rawPct)}%</span>
    </div>
  );
}

function CyclePeriodTip({ period }: { period: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const labelRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  const show = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 220;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    setPos({ top: rect.bottom + 6, left });
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  return (
    <>
      <span
        ref={labelRef}
        className="od-metric-label od-credits-label"
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? tipId : undefined}
      >
        Minutes this cycle
      </span>
      {open
        ? createPortal(
            <div
              id={tipId}
              className="od-status-popover"
              role="tooltip"
              style={{ top: pos.top, left: pos.left, width: 220, pointerEvents: 'none' }}
            >
              <p className="od-status-popover__title">Billing cycle</p>
              <p className="od-status-popover__line">{period}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function CreditsBreakdownModal({
  data,
  onClose,
}: {
  data: BillingUsageCredits;
  onClose: () => void;
}) {
  const titleId = useId();
  const backdropDismiss = useBackdropDismiss(onClose, true);
  const { contract, current_cycle: cycle, initial_term: term } = data;
  const termOver = term.minutes_remaining < 0 || term.credits_remaining < 0;
  const cyclesNewestFirst = useMemo(
    () =>
      [...data.cycles].sort((a, b) => {
        if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
        if (a.cycle_start !== b.cycle_start) return b.cycle_start.localeCompare(a.cycle_start);
        return b.cycle_index - a.cycle_index;
      }),
    [data.cycles],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="od-credits-modal" role="presentation">
      <button
        type="button"
        className="od-credits-modal__overlay"
        aria-label="Close usage credits breakdown"
        onMouseDown={backdropDismiss.onMouseDown}
        onClick={backdropDismiss.onClick}
      />
      <div
        className="od-credits-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="od-credits-head">
          <div>
            <h2 id={titleId} className="od-credits-title">Production Usage Credits</h2>
            <p className="od-credits-meta">{usd.format(contract.rate_per_minute)} / min</p>
          </div>
          <button type="button" className="od-credits-modal__close" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="od-credits-panel">
          <p className="od-credits-kicker">This cycle</p>
          <p className="od-credits-range">{cycle.label}</p>
          <UsageBar
            kind="minutes"
            used={cycle.minutes_used}
            allocated={cycle.minutes_allocated}
            remaining={cycle.minutes_remaining}
            overAllocation={cycle.is_over_allocation || cycle.minutes_remaining < 0}
          />
          <UsageBar
            kind="credits"
            used={cycle.credits_used}
            allocated={cycle.credits_allocated}
            remaining={cycle.credits_remaining}
            overAllocation={cycle.is_over_allocation || cycle.credits_remaining < 0}
          />
        </div>

        {/* TEMP: initial term hidden */}
        {SHOW_INITIAL_TERM && (
          <div className="od-credits-panel">
            <p className="od-credits-kicker">Initial {contract.term_months}-month term</p>
            <p className="od-credits-range">
              {termRangeLabel(contract.start_date, contract.term_end_date)}
              {term.is_active ? null : ' · Term ended'}
            </p>
            <UsageBar
              kind="minutes"
              used={term.minutes_used}
              allocated={term.minutes_allocated}
              remaining={term.minutes_remaining}
              overAllocation={termOver}
            />
            <UsageBar
              kind="credits"
              used={term.credits_used}
              allocated={term.total_prepaid_credits}
              remaining={term.credits_remaining}
              overAllocation={termOver}
            />
          </div>
        )}

        {cyclesNewestFirst.length > 0 ? (
          <div className="od-credits-table-wrap">
            <table className="od-credits-table">
              <thead>
                <tr>
                  <th>Billing cycle</th>
                  <th>Minutes</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {cyclesNewestFirst.map((row) => (
                  <CycleRow key={row.cycle_index} cycle={row} />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

const ProductionUsageCredits: React.FC<Props> = ({ data, error }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const cycle = data?.current_cycle;
  const used = cycle?.minutes_used;
  const allocated = cycle?.minutes_allocated;
  const over = Boolean(cycle && (cycle.is_over_allocation || cycle.minutes_remaining < 0));
  const period = cycle ? cyclePeriodLabel(cycle) : '';

  return (
    <>
      <div className="od-metric-header">
        {cycle ? (
          <CyclePeriodTip period={period} />
        ) : (
          <span className="od-metric-label">Minutes this cycle</span>
        )}
        {cycle ? (
          <button
            type="button"
            className="od-credits-breakdown"
            onClick={() => setOpen(true)}
            aria-label="Open usage credits breakdown"
          >
            Breakdown
          </button>
        ) : null}
      </div>

      {error && !data ? (
        <p className="od-credits-empty">Unavailable</p>
      ) : !cycle ? (
        <p className="od-credits-empty">Loading…</p>
      ) : (
        <div className="od-credits-metric-row">
          <MinutesWheel used={used ?? 0} allocated={allocated ?? 0} over={over} />
          <p className="od-credits-metric-sub">
            {minutesFmt.format(used ?? 0)}
            <span> / {minutesFmt.format(allocated ?? 0)} min</span>
          </p>
        </div>
      )}

      {open && data ? <CreditsBreakdownModal data={data} onClose={close} /> : null}
    </>
  );
};

export default ProductionUsageCredits;
