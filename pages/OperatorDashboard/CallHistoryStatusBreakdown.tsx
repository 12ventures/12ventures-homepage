import React, { useCallback, useEffect, useId, useMemo, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { FiBarChart2, FiX } from 'react-icons/fi';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import type { CallHistoryItem } from '../../services/poseidonService';
import {
  DISPLAY_STATUS_DESCRIPTIONS,
  summarizeCallHistoryStatuses,
  type CallStatusBreakdownItem,
  type DisplayOutcomeStatus,
} from './callHistoryUtils';
import './CallHistoryStatusBreakdown.css';

interface Props {
  calls: CallHistoryItem[];
  periodLabel: string;
}

function StatusMeaningLabel({
  status,
  children,
}: {
  status: DisplayOutcomeStatus;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const labelRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const description = DISPLAY_STATUS_DESCRIPTIONS[status];

  const show = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 280;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    setPos({ top: rect.bottom + 6, left });
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  return (
    <>
      <span
        ref={labelRef}
        className="od-history-status-modal__label od-history-status-modal__label--tip"
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? tipId : undefined}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            id={tipId}
            className="od-status-popover od-status-popover--hover"
            role="tooltip"
            style={{ top: pos.top, left: pos.left, width: 280, pointerEvents: 'none' }}
          >
            <p className="od-status-popover__title">{children}</p>
            <p className="od-status-popover__line">{description}</p>
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Lightweight SVG donut with CSS stroke draw-in (compositor-friendly).
 * Avoids Recharts path tweening / resize observers.
 */
function StatusDonut({ items }: { items: CallStatusBreakdownItem[] }) {
  const segments = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    if (total <= 0) return [];

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const active = items.filter((item) => item.count > 0);
    const gap = active.length > 1 ? 2.5 : 0;
    let dashOffset = 0;

    return active.map((item, index) => {
      const len = (item.count / total) * circumference;
      const segment = Math.max(0, len - gap);
      const entry = {
        status: item.status,
        color: item.color,
        circumference,
        segment,
        rest: circumference - segment,
        offset: -dashOffset,
        delayMs: index * 70,
      };
      dashOffset += len;
      return entry;
    });
  }, [items]);

  if (segments.length === 0) return null;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70;
  const stroke = 28;
  const circ = segments[0].circumference;

  return (
    <svg
      className="od-history-status-donut"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      style={{ ['--od-donut-circ' as string]: circ }}
    >
      <circle
        className="od-history-status-donut__track"
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      {segments.map((seg) => (
        <circle
          key={seg.status}
          className="od-history-status-donut__seg"
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            ['--od-donut-a' as string]: seg.segment,
            ['--od-donut-b' as string]: seg.rest,
            ['--od-donut-offset' as string]: seg.offset,
            ['--od-donut-delay' as string]: `${seg.delayMs}ms`,
          }}
        />
      ))}
    </svg>
  );
}

const CallHistoryStatusBreakdown: React.FC<Props> = ({ calls, periodLabel }) => {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const summary = useMemo(() => summarizeCallHistoryStatuses(calls), [calls]);
  const visibleChips = useMemo(
    () => summary.items.filter((item) => item.count > 0),
    [summary],
  );
  const pieItems = useMemo(
    () => summary.items.filter((item) => item.count > 0),
    [summary],
  );

  const close = useCallback(() => setOpen(false), []);
  const backdropDismiss = useBackdropDismiss(close, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="od-history-status-summary">
        {visibleChips.length === 0 ? (
          <span className="od-expandable-count">0</span>
        ) : (
          visibleChips.map((item) => (
            <span
              key={item.status}
              className={`od-history-status-chip od-history-status-chip--${item.status}`}
              title={`${item.label}: ${item.count}`}
            >
              {item.count}
            </span>
          ))
        )}
        <button
          type="button"
          className="od-history-status-info"
          onClick={() => setOpen(true)}
          aria-label="View call status breakdown"
        >
          <FiBarChart2 size={13} aria-hidden="true" />
          Breakdown
        </button>
      </div>

      {open &&
        createPortal(
          <div className="od-history-status-modal" role="presentation">
            <button
              type="button"
              className="od-history-status-modal__overlay"
              aria-label="Close status breakdown"
              onMouseDown={backdropDismiss.onMouseDown}
              onClick={backdropDismiss.onClick}
            />
            <div
              className="od-history-status-modal__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="od-history-status-modal__header">
                <div>
                  <h2 id={titleId} className="od-history-status-modal__title">
                    Call Status Breakdown
                  </h2>
                  <p className="od-history-status-modal__subtitle">{periodLabel}</p>
                </div>
                <button
                  type="button"
                  className="od-history-status-modal__close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="od-history-status-modal__body">
                <ul className="od-history-status-modal__list">
                  {summary.items.map((item) => {
                    const pct =
                      summary.total > 0
                        ? Math.round((item.count / summary.total) * 1000) / 10
                        : 0;
                    return (
                      <li key={item.status} className="od-history-status-modal__row">
                        <span
                          className="od-history-status-modal__swatch"
                          style={{ background: item.color }}
                          aria-hidden="true"
                        />
                        <StatusMeaningLabel status={item.status}>
                          {item.label}
                        </StatusMeaningLabel>
                        <span className="od-history-status-modal__count">{item.count}</span>
                        <span className="od-history-status-modal__pct">{pct}%</span>
                      </li>
                    );
                  })}
                  <li className="od-history-status-modal__row od-history-status-modal__row--total">
                    <span className="od-history-status-modal__label">Total</span>
                    <span className="od-history-status-modal__count">{summary.total}</span>
                    <span className="od-history-status-modal__pct">100%</span>
                  </li>
                </ul>

                <div className="od-history-status-modal__chart-block">
                  <p className="od-history-status-modal__chart-title">Detailed view</p>
                  {pieItems.length === 0 ? (
                    <p className="od-history-status-modal__empty">No calls in this period.</p>
                  ) : (
                    <div className="od-history-status-modal__chart">
                      <StatusDonut items={pieItems} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default memo(CallHistoryStatusBreakdown);
