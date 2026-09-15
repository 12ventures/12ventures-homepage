import React, { useEffect } from 'react';
import './ExportRangeModal.css';

export type CallsExportRange = 'past_30_days' | 'all_time';

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
        onClick={() => onChoose('past_30_days')}
      >
        <span className="od-export-choice__label">Past 30 days</span>
        <span className="od-export-choice__hint">Calls from the last 30 days</span>
      </button>
      <button
        type="button"
        className="od-export-choice"
        role="menuitem"
        onClick={() => onChoose('all_time')}
      >
        <span className="od-export-choice__label">All time</span>
        <span className="od-export-choice__hint">Complete call history</span>
      </button>
    </div>
  );
};

export default ExportRangeModal;
