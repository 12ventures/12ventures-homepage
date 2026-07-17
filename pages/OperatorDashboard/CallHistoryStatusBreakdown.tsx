import React, { useEffect, useId, useMemo, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { FiInfo, FiX } from 'react-icons/fi';
import type { CallHistoryItem } from '../../services/poseidonService';
import {
  summarizeCallHistoryStatuses,
  type CallStatusBreakdownItem,
} from './callHistoryUtils';
import './CallHistoryStatusBreakdown.css';

interface Props {
  calls: CallHistoryItem[];
  periodLabel: string;
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
          title="View status breakdown"
        >
          <FiInfo size={13} aria-hidden="true" />
        </button>
      </div>

      {open &&
        createPortal(
          <div className="od-history-status-modal" role="presentation">
            <button
              type="button"
              className="od-history-status-modal__overlay"
              aria-label="Close status breakdown"
              onClick={() => setOpen(false)}
            />
            <div
              className="od-history-status-modal__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
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
                        <span className="od-history-status-modal__label">{item.label}</span>
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
