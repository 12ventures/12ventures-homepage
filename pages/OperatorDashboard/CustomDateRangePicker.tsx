import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCalendar, FiX } from 'react-icons/fi';
import { formatCustomRangeLabel } from '../../services/poseidonService';
import './CustomDateRangePicker.css';

const MAX_RANGE_DAYS = 366;
const POPOVER_WIDTH = 280;
const POPOVER_GAP = 8;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function spanDays(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

interface PopoverPosition {
  top: number;
  left: number;
}

interface Props {
  activeRange: { dateFrom: string; dateTo: string } | null;
  disabled?: boolean;
  onApply: (dateFrom: string, dateTo: string) => void;
  onClear: () => void;
}

const CustomDateRangePicker: React.FC<Props> = ({
  activeRange,
  disabled = false,
  onApply,
  onClear,
}) => {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(daysAgoKey(7));
  const [draftTo, setDraftTo] = useState(todayKey());
  const [error, setError] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition>({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isActive = activeRange !== null;

  const updatePopoverPosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, rect.right - POPOVER_WIDTH),
      window.innerWidth - POPOVER_WIDTH - 12,
    );
    setPopoverPos({
      top: rect.bottom + POPOVER_GAP,
      left,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    if (activeRange) {
      setDraftFrom(activeRange.dateFrom);
      setDraftTo(activeRange.dateTo);
    } else {
      setDraftFrom(daysAgoKey(7));
      setDraftTo(todayKey());
    }
    setError(null);
    updatePopoverPosition();
  }, [open, activeRange, updatePopoverPosition]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => updatePopoverPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleApply = () => {
    if (!draftFrom || !draftTo) {
      setError('Select both start and end dates.');
      return;
    }
    if (draftFrom > draftTo) {
      setError('Start date must be on or before end date.');
      return;
    }
    const days = spanDays(draftFrom, draftTo);
    if (days > MAX_RANGE_DAYS) {
      setError(`Range cannot exceed ${MAX_RANGE_DAYS} days.`);
      return;
    }
    onApply(draftFrom, draftTo);
    setOpen(false);
  };

  const popover = open ? (
    <div
      ref={popoverRef}
      className="od-date-range-popover"
      role="dialog"
      aria-label="Custom date range"
      style={{ top: popoverPos.top, left: popoverPos.left }}
    >
      <p className="od-date-range-popover__title">Custom range</p>
      <div className="od-date-range-fields">
        <label className="od-date-range-field">
          <span>From</span>
          <input
            type="date"
            value={draftFrom}
            max={draftTo || todayKey()}
            onChange={(e) => {
              setDraftFrom(e.target.value);
              setError(null);
            }}
          />
        </label>
        <label className="od-date-range-field">
          <span>To</span>
          <input
            type="date"
            value={draftTo}
            min={draftFrom}
            max={todayKey()}
            onChange={(e) => {
              setDraftTo(e.target.value);
              setError(null);
            }}
          />
        </label>
      </div>
      {error && <p className="od-date-range-error">{error}</p>}
      <div className="od-date-range-actions">
        <button type="button" className="od-date-range-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="button" className="od-date-range-apply" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="od-date-range" ref={wrapRef}>
      {isActive && activeRange && (
        <span className="od-date-range-chip" title="Custom date range active">
          {formatCustomRangeLabel(activeRange.dateFrom, activeRange.dateTo)}
          <button
            type="button"
            className="od-date-range-chip__clear"
            onClick={onClear}
            disabled={disabled}
            aria-label="Clear custom date range"
          >
            <FiX size={12} />
          </button>
        </span>
      )}

      <button
        ref={btnRef}
        type="button"
        className={`od-date-range-btn${isActive ? ' od-date-range-btn--active' : ''}${open ? ' od-date-range-btn--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Custom date range"
        aria-expanded={open}
        title="Pick a custom date range"
      >
        <FiCalendar size={15} />
      </button>

      {popover && createPortal(popover, document.body)}
    </div>
  );
};

export default CustomDateRangePicker;
