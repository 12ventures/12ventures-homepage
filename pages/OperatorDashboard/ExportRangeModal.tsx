import React, { useEffect } from 'react';
import './ExportRangeModal.css';

export type CallsExportRange = 'this_month' | 'last_month' | 'all_time';

interface Props {
  onClose: () => void;
  onChoose: (range: CallsExportRange) => void;
}

const ExportRangeModal: React.FC<Props> = ({ onClose, onChoose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="od-export-menu" role="menu" aria-label="Export range">
      <button
        type="button"
        className="od-export-choice"
        role="menuitem"
        onClick={() => onChoose('this_month')}
      >
        <span className="od-export-choice__label">This month</span>
        <span className="od-export-choice__hint">Calendar month so far — smaller file</span>
      </button>
      <button
        type="button"
        className="od-export-choice"
        role="menuitem"
        onClick={() => onChoose('last_month')}
      >
        <span className="od-export-choice__label">Last month</span>
        <span className="od-export-choice__hint">Previous calendar month — smaller file</span>
      </button>
      <button
        type="button"
        className="od-export-choice"
        role="menuitem"
        onClick={() => onChoose('all_time')}
      >
        <span className="od-export-choice__label">All Time</span>
        <span className="od-export-choice__hint">Complete call history — largest file</span>
      </button>
    </div>
  );
};

export default ExportRangeModal;
