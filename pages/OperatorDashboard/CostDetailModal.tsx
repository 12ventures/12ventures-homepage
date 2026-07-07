import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { poseidonService, type CostDetail, type DashboardFilter } from '../../services/poseidonService';
import './CostDetailModal.css';

const VENDOR_LABELS: Record<string, string> = {
  twilio: 'Twilio',
  openai: 'OpenAI',
  assemblyai: 'AssemblyAI',
};

interface Props {
  filter: DashboardFilter;
  periodLabel: string;
  includeTestCalls: boolean;
  onClose: () => void;
}

const CostDetailModal: React.FC<Props> = ({ filter, periodLabel, includeTestCalls, onClose }) => {
  const [detail, setDetail] = useState<CostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    poseidonService
      .getCostDetail(filter, includeTestCalls)
      .then((d) => setDetail(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filter, includeTestCalls]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const vendors = detail ? Object.entries(detail.vendor_subtotals) : [];
  const totalCost = detail?.total_cost ?? 0;

  return createPortal(
    <div className="cdm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="cdm-panel" role="dialog" aria-modal="true" aria-label="Cost Detail">
        {/* Header */}
        <div className="cdm-header">
          <div className="cdm-header-text">
            <h2 className="cdm-title">Cost Breakdown</h2>
            <p className="cdm-subtitle">{periodLabel}</p>
          </div>
          <button type="button" className="cdm-close" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cdm-body">
          {loading && (
            <div className="cdm-loading">
              <FiLoader size={22} className="cdm-spin" />
              <span>Loading cost detail…</span>
            </div>
          )}

          {!loading && error && (
            <div className="cdm-error">
              <FiAlertCircle size={18} />
              <span>Could not load cost detail for this period.</span>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* Summary row */}
              <div className="cdm-summary-row">
                <div className="cdm-summary-stat">
                  <span className="cdm-summary-label">Total Cost</span>
                  <span className="cdm-summary-value cdm-summary-value--cost">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="cdm-summary-stat">
                  <span className="cdm-summary-label">Calls</span>
                  <span className="cdm-summary-value">{detail.total_calls.toLocaleString()}</span>
                </div>
                <div className="cdm-summary-stat">
                  <span className="cdm-summary-label">Total Minutes</span>
                  <span className="cdm-summary-value">{detail.total_minutes.toFixed(1)}</span>
                </div>
                <div className="cdm-summary-stat">
                  <span className="cdm-summary-label">Blended Rate</span>
                  <span className="cdm-summary-value">
                    ${detail.blended_rate_per_min.toFixed(4)}<span className="cdm-per-min">/min</span>
                  </span>
                </div>
              </div>

              {/* Vendor subtotals */}
              {vendors.length > 0 && (
                <div className="cdm-section">
                  <h3 className="cdm-section-title">Vendor Subtotals</h3>
                  <div className="cdm-vendor-list">
                    {vendors.map(([key, v]) => (
                      <div key={key} className="cdm-vendor-row">
                        <div className="cdm-vendor-name-wrap">
                          <span className="cdm-vendor-name">{VENDOR_LABELS[key] ?? key}</span>
                          <span className="cdm-vendor-note">{v.note}</span>
                        </div>
                        <span className="cdm-vendor-cost">${v.cost.toFixed(2)}</span>
                        <div
                          className="cdm-vendor-bar-track"
                          title={`${((v.cost / totalCost) * 100).toFixed(1)}%`}
                        >
                          <div
                            className="cdm-vendor-bar-fill"
                            style={{ width: `${Math.min((v.cost / totalCost) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Component breakdown */}
              {detail.components.length > 0 && (
                <div className="cdm-section">
                  <h3 className="cdm-section-title">Component Detail</h3>
                  <table className="cdm-table">
                    <thead>
                      <tr>
                        <th className="cdm-th">Component</th>
                        <th className="cdm-th cdm-th--right">Rate/min</th>
                        <th className="cdm-th cdm-th--right">Cost</th>
                        <th className="cdm-th cdm-th--right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.components.map((c) => {
                        const share = totalCost > 0 ? (c.cost / totalCost) * 100 : 0;
                        return (
                          <tr key={c.component} className="cdm-tr">
                            <td className="cdm-td">
                              <span className="cdm-component-label">{c.label}</span>
                            </td>
                            <td className="cdm-td cdm-td--right cdm-td--mono">
                              ${c.rate_per_min.toFixed(4)}
                            </td>
                            <td className="cdm-td cdm-td--right cdm-td--mono cdm-td--bold">
                              ${c.cost.toFixed(2)}
                            </td>
                            <td className="cdm-td cdm-td--right">
                              <span className="cdm-share-pill" style={{ opacity: 0.5 + share / 200 }}>
                                {share.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="cdm-tr cdm-tr--total">
                        <td className="cdm-td cdm-td--total-label">Total</td>
                        <td className="cdm-td" />
                        <td className="cdm-td cdm-td--right cdm-td--mono cdm-td--bold">
                          ${totalCost.toFixed(2)}
                        </td>
                        <td className="cdm-td cdm-td--right">
                          <span className="cdm-share-pill">100%</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CostDetailModal;
