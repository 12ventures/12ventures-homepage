import React, { useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import {
  DASHBOARD_TZ,
  formatDateKeyShort,
  type PeakConcurrentByDay,
} from '../../services/poseidonService';
import { getOdChartTheme } from './operatorDashboardChartTheme';
import { useTheme } from '../../contexts/ThemeContext';
import './PeakConcurrentModal.css';

interface Props {
  periodLabel: string;
  days: PeakConcurrentByDay[] | null;
  onClose: () => void;
}

function formatPeakClock(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DASHBOARD_TZ,
  });
}

function peakWindowLabel(
  windowStart: string | null,
  windowEnd: string | null,
  achievedAt: string | null,
): string | null {
  const start = formatPeakClock(windowStart) ?? formatPeakClock(achievedAt);
  const end = formatPeakClock(windowEnd);
  if (start && end && start !== end) return `${start} – ${end}`;
  return start;
}

interface PeakChartRow {
  name: string;
  value: number;
  windowStart: string | null;
  windowEnd: string | null;
  achievedAt: string | null;
}

function PeakBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PeakChartRow }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const when = row.value > 0
    ? peakWindowLabel(row.windowStart, row.windowEnd, row.achievedAt)
    : null;
  return (
    <div className="od-peak-tip">
      <p className="od-peak-tip__day">{row.name}</p>
      <p className="od-peak-tip__count">
        {row.value} {row.value === 1 ? 'call' : 'calls'}
      </p>
      {when ? <p className="od-peak-tip__when">{when}</p> : null}
    </div>
  );
}

const PeakConcurrentModal: React.FC<Props> = ({ periodLabel, days, onClose }) => {
  const titleId = useId();
  const backdropDismiss = useBackdropDismiss(onClose, true);
  const { effectiveTheme } = useTheme();
  const chartTheme = useMemo(() => getOdChartTheme(effectiveTheme), [effectiveTheme]);

  const rows = useMemo(
    () => [...(days ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [days],
  );
  const peak = rows.reduce((max, row) => Math.max(max, row.count), 0);
  const chartData: PeakChartRow[] = rows.map((row) => ({
    name: formatDateKeyShort(row.date),
    value: row.count,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    achievedAt: row.achieved_at,
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="od-peak-modal" role="presentation">
      <button
        type="button"
        className="od-peak-modal__overlay"
        aria-label="Close peak concurrent breakdown"
        onMouseDown={backdropDismiss.onMouseDown}
        onClick={backdropDismiss.onClick}
      />
      <div
        className="od-peak-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="od-peak-modal__header">
          <div>
            <h2 id={titleId} className="od-peak-modal__title">Peak concurrent</h2>
            <p className="od-peak-modal__subtitle">{periodLabel}</p>
          </div>
          <button type="button" className="od-peak-modal__close" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="od-peak-modal__body">
          {days == null ? (
            <p className="od-peak-modal__empty">Daily peaks are not available for this period.</p>
          ) : rows.length === 0 ? (
            <p className="od-peak-modal__empty">No days in this period.</p>
          ) : (
            <>
              <p className="od-peak-modal__summary">
                Highest in this period: <strong>{peak}</strong>
                {peak === 1 ? ' simultaneous call' : ' simultaneous calls'}
              </p>
              <div className="od-peak-modal__chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={chartTheme.grid} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: chartTheme.tick }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: chartTheme.tick }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<PeakBarTooltip />}
                      cursor={{ fill: chartTheme.cursor }}
                    />
                    <Bar
                      dataKey="value"
                      fill={chartTheme.bar}
                      activeBar={{ fill: chartTheme.barActive }}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PeakConcurrentModal;
