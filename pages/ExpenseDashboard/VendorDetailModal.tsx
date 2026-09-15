import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import type { ExpenseVendorDetail } from '../../services/expenseLedgerService';
import './VendorDetailModal.css';

interface Props {
  detail: ExpenseVendorDetail | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const VendorDetailModal: React.FC<Props> = ({ detail, loading, error, onClose }) => {
  const backdropDismiss = useBackdropDismiss(onClose);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="exm-overlay"
      onMouseDown={backdropDismiss.onMouseDown}
      onClick={backdropDismiss.onClick}
    >
      <div className="exm-panel" role="dialog" aria-modal="true" aria-label="Vendor detail">
        <div className="exm-header">
          <div>
            <h2>{detail?.vendor_name ?? 'Vendor'}</h2>
            <p>{detail?.month ?? ''}</p>
          </div>
          <button type="button" className="exm-close" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>
        <div className="exm-body">
          {loading && <p className="exm-muted">Loading…</p>}
          {!loading && error && <p className="exm-muted">Could not load this vendor.</p>}
          {!loading && !error && detail && (
            <>
              <div className="exm-total">{money(detail.total_usd)}</div>
              {detail.items.length === 0 ? (
                <p className="exm-muted">No line items for this month yet.</p>
              ) : (
                <table className="exm-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Source</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div>{item.service_category}</div>
                          {item.resource_or_sku && (
                            <div className="exm-sku">{item.resource_or_sku}</div>
                          )}
                        </td>
                        <td>{item.source.replace('_', ' ')}</td>
                        <td className="right">{money(item.amount_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default VendorDetailModal;
