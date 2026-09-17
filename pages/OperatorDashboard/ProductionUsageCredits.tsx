import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import {
  addCalendarDays,
  type BillingCycle,
  type BillingUsageCredits,
} from '../../services/poseidonService';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import './ProductionUsageCredits.css';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const minutesFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const percentFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});
const percentOneFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

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

function formatUtcDayLong(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function inclusiveCalendarMonths(startDate: string, inclusiveEnd: string): number {
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = inclusiveEnd.split('-').map(Number);
  if (!sy || !sm || !ey || !em) return 0;
  return (ey - sy) * 12 + (em - sm) + 1;
}

function termRangeLabel(startDate: string, exclusiveEnd: string): string {
  const lastDay = addCalendarDays(exclusiveEnd, -1);
  return `${formatUtcDay(startDate)} – ${formatUtcDay(lastDay, true)}`;
}

function termUpToLabel(startDate: string, exclusiveEnd: string, termMonths?: number): string {
  const lastDay = addCalendarDays(exclusiveEnd, -1);
  const months = termMonths && termMonths > 0
    ? termMonths
    : Math.max(1, inclusiveCalendarMonths(startDate, lastDay));
  const unit = months === 1 ? 'month' : 'months';
  return `${months} ${unit} up to ${formatUtcDayLong(lastDay)}`;
}

function cyclePeriodLabel(cycle: BillingCycle): string {
  if (cycle.label) return cycle.label;
  if (cycle.cycle_start && cycle.cycle_end) {
    return termRangeLabel(cycle.cycle_start, cycle.cycle_end);
  }
  return 'Current billing period';
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
  delay = 0,
}: {
  used: number;
  allocated: number;
  remaining: number;
  overAllocation: boolean;
  kind: 'minutes' | 'credits';
  delay?: number;
}) {
  const rawPct = allocated > 0 ? (used / allocated) * 100 : 0;
  const pctLabel = Math.round(rawPct * 10) / 10;
  const fillPct = Math.min(100, Math.max(0, rawPct));
  const rem = remainingCopy(remaining, overAllocation, kind);
  const usedLabel = kind === 'minutes'
    ? `${minutesFmt.format(used)} / ${minutesFmt.format(allocated)} min`
    : `${usd.format(used)} / ${usd.format(allocated)}`;

  return (
    <div
      className={`od-credits-usage${rem.overage ? ' is-over' : ''}`}
      style={{ '--od-credits-bar-delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="od-credits-usage-head">
        <span className="od-credits-usage-kind">{kind === 'minutes' ? 'Minutes' : 'Credits'}</span>
        <span className={`od-credits-usage-values${rem.overage ? ' is-over' : ''}`}>
          {kind === 'minutes' ? (
            <>
              <AnimatedNumber value={used} delay={delay} duration={800} decimals={1} formatter={minutesFmt.format} />
              {` / ${minutesFmt.format(allocated)} min`}
            </>
          ) : (
            <>
              <AnimatedNumber
                value={used}
                delay={delay}
                duration={800}
                decimals={2}
                formatter={usd.format}
              />
              {` / ${usd.format(allocated)}`}
            </>
          )}
        </span>
      </div>
      <div
        className={`od-credits-bar${rem.overage ? ' is-over' : ''}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fillPct}
        aria-label={`${usedLabel} used`}
      >
        <span
          className="od-credits-bar-fill"
          style={{ '--od-credits-fill': `${fillPct}%` } as React.CSSProperties}
        />
        <span className="od-credits-bar-label">
          <AnimatedNumber value={pctLabel} delay={delay} duration={800} decimals={1} suffix="%" />
        </span>
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
        Minutes this period
      </span>
      {open
        ? createPortal(
            <div
              id={tipId}
              className="od-status-popover"
              role="tooltip"
              style={{ top: pos.top, left: pos.left, width: 220, pointerEvents: 'none' }}
            >
              <p className="od-status-popover__title">Billing period</p>
              <p className="od-status-popover__line">{period}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function TermUsageTip({
  minutesLabel,
  creditsLabel,
  children,
}: {
  minutesLabel: string;
  creditsLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipId = useId();

  const show = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 200;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    setPos({ top: rect.bottom + 6, left });
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  return (
    <>
      <div
        ref={wrapRef}
        className="od-credits-term-foot-head"
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? tipId : undefined}
      >
        {children}
      </div>
      {open
        ? createPortal(
            <div
              id={tipId}
              className="od-status-popover"
              role="tooltip"
              style={{ top: pos.top, left: pos.left, width: 200, pointerEvents: 'none' }}
            >
              <p className="od-status-popover__title">Minutes</p>
              <p className="od-status-popover__line">{minutesLabel}</p>
              <p className="od-status-popover__title od-credits-tip-kicker">Credits</p>
              <p className="od-status-popover__line">{creditsLabel}</p>
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
  const termPct = Math.max(0, Math.min(100, term.percent_used));
  const termOver = term.percent_used > 100 || term.minutes_remaining < 0 || term.credits_remaining < 0;
  const termMinutes = `${minutesFmt.format(term.minutes_used)} / ${minutesFmt.format(term.minutes_allocated)} min`;
  const termCredits = `${usd.format(term.credits_used)} / ${usd.format(term.total_prepaid_credits)}`;
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

        <div className="od-credits-panel od-credits-panel--hero">
          <p className="od-credits-kicker">This period</p>
          <p className="od-credits-range">{cycle.label}</p>
          <UsageBar
            kind="minutes"
            used={cycle.minutes_used}
            allocated={cycle.minutes_allocated}
            remaining={cycle.minutes_remaining}
            overAllocation={cycle.is_over_allocation || cycle.minutes_remaining < 0}
            delay={90}
          />
          <UsageBar
            kind="credits"
            used={cycle.credits_used}
            allocated={cycle.credits_allocated}
            remaining={cycle.credits_remaining}
            overAllocation={cycle.is_over_allocation || cycle.credits_remaining < 0}
            delay={200}
          />
        </div>

        {cyclesNewestFirst.length > 0 ? (
          <div className="od-credits-table-wrap od-credits-seq od-credits-seq--table">
            <table className="od-credits-table">
              <thead>
                <tr>
                  <th>Billing period</th>
                  <th>Minutes</th>
                  <th>Credits used</th>
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

        <div className="od-credits-term-foot od-credits-seq od-credits-seq--term">
          <TermUsageTip minutesLabel={termMinutes} creditsLabel={termCredits}>
            <p className="od-credits-term-foot-range">
              {termUpToLabel(contract.start_date, contract.term_end_date, contract.term_months)}
              {term.is_active ? null : ' · Ended'}
            </p>
            <span className={`od-credits-term-foot-values${termOver ? ' is-over' : ''}`}>
              <AnimatedNumber
                value={term.minutes_used}
                delay={1160}
                duration={800}
                decimals={1}
                formatter={minutesFmt.format}
              />
              {` / ${minutesFmt.format(term.minutes_allocated)} min`}
            </span>
          </TermUsageTip>
          <div
            className={`od-credits-bar${termOver ? ' is-over' : ''}`}
            style={{ '--od-credits-bar-delay': '1160ms' } as React.CSSProperties}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={termPct}
            aria-label={`${percentOneFmt.format(term.percent_used)} percent of the ${contract.term_months}-month period used`}
          >
            <span
              className="od-credits-bar-fill"
              style={{ '--od-credits-fill': `${termPct}%` } as React.CSSProperties}
            />
            <span className="od-credits-bar-label">
              <AnimatedNumber
                value={Math.round(term.percent_used * 10) / 10}
                delay={1160}
                duration={800}
                decimals={1}
                suffix="%"
              />
            </span>
          </div>
        </div>
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
          <span className="od-metric-label">Minutes this period</span>
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
