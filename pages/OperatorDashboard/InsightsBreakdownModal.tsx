import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiX } from 'react-icons/fi';
import {
  isBreakdownVariantView,
  poseidonService,
  type AnalyticsInsightsBreakdown,
  type AnalyticsInsightsBreakdownField,
  type BreakdownGroupItem,
  type BreakdownVariantItem,
  type DashboardFilter,
} from '../../services/poseidonService';
import './InsightsBreakdownModal.css';

const FIELD_META: Record<
  AnalyticsInsightsBreakdownField,
  { title: string; totalLabel: string; groupLabel: string; variantLabel: string }
> = {
  insurance_groups: {
    title: 'Top Insurances',
    totalLabel: 'calls with insurance on file',
    groupLabel: 'groups',
    variantLabel: 'raw variants',
  },
  exam_type_groups: {
    title: 'Exam Types',
    totalLabel: 'calls with exam on order',
    groupLabel: 'groups',
    variantLabel: 'raw variants',
  },
};

interface Props {
  isOpen: boolean;
  field: AnalyticsInsightsBreakdownField | null;
  filter: DashboardFilter;
  periodLabel: string;
  includeTestCalls: boolean;
  onClose: () => void;
}

const InsightsBreakdownModal: React.FC<Props> = ({
  isOpen,
  field,
  filter,
  periodLabel,
  includeTestCalls,
  onClose,
}) => {
  const [data, setData] = useState<AnalyticsInsightsBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (!isOpen) setSelectedGroup(null);
  }, [isOpen]);

  useEffect(() => {
    setSelectedGroup(null);
  }, [field]);

  useEffect(() => {
    if (!isOpen || !field) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    void poseidonService
      .getAnalyticsInsightsBreakdown(filter, field, includeTestCalls, selectedGroup?.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load breakdown');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, field, filter, includeTestCalls, selectedGroup]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedGroup) setSelectedGroup(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, selectedGroup]);

  const meta = field ? FIELD_META[field] : null;
  const isVariantView = data != null && isBreakdownVariantView(data);
  const maxCount = useMemo(
    () => Math.max(1, ...(data?.items.map((i) => i.count) ?? [1])),
    [data],
  );

  if (!isOpen || !field || !meta) return null;

  const title = selectedGroup
    ? `${selectedGroup.label} — Raw Variants`
    : `${meta.title} — Detailed Breakdown`;

  const handleRowClick = (item: BreakdownGroupItem) => {
    setSelectedGroup({ id: item.group_id, label: item.label });
  };

  return (
    <div
      className="od-breakdown-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="od-breakdown-modal-title"
    >
      <div className="od-breakdown-modal__overlay" onClick={onClose} />
      <div className="od-breakdown-modal__panel">
        <div className="od-breakdown-modal__header">
          <div className="od-breakdown-modal__header-main">
            {selectedGroup && (
              <button
                type="button"
                className="od-breakdown-modal__back"
                onClick={() => setSelectedGroup(null)}
                aria-label="Back to group list"
              >
                <FiChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 id="od-breakdown-modal-title" className="od-breakdown-modal__title">
                {title}
              </h2>
              <p className="od-breakdown-modal__subtitle">{periodLabel}</p>
            </div>
          </div>
          <button
            type="button"
            className="od-breakdown-modal__close"
            onClick={onClose}
            aria-label="Close breakdown"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="od-breakdown-modal__body">
          {loading && (
            <div className="od-breakdown-modal__state">
              <div className="od-breakdown-modal__spinner" />
              <span>Loading breakdown…</span>
            </div>
          )}

          {!loading && error && (
            <div className="od-breakdown-modal__state od-breakdown-modal__state--error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <p className="od-breakdown-modal__summary">
                <strong>{data.total_with_value.toLocaleString()}</strong>{' '}
                {isVariantView ? 'calls in this group' : meta.totalLabel}
                {data.items.length > 0 && (
                  <>
                    {' '}
                    · <strong>{data.items.length}</strong>{' '}
                    {isVariantView ? meta.variantLabel : meta.groupLabel}
                  </>
                )}
              </p>

              {!isVariantView && (
                <p className="od-breakdown-modal__hint">
                  Select a row to view raw strings grouped under that label.
                </p>
              )}

              {data.items.length === 0 ? (
                <p className="od-breakdown-modal__empty">No data for this period.</p>
              ) : (
                <div className="od-breakdown-modal__table-wrap">
                  <table className="od-breakdown-modal__table">
                    <thead>
                      <tr>
                        <th scope="col">Label</th>
                        <th scope="col">Calls</th>
                        <th scope="col">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isVariantView
                        ? (data.items as BreakdownVariantItem[]).map((item, index) => {
                            const pct = data.total_with_value > 0
                              ? Math.round((item.count / data.total_with_value) * 100)
                              : 0;
                            return (
                              <tr key={`${item.label}-${index}`}>
                                <td className="od-breakdown-modal__label">{item.label}</td>
                                <td className="od-breakdown-modal__count">{item.count.toLocaleString()}</td>
                                <td className="od-breakdown-modal__share">
                                  <div className="od-breakdown-modal__bar-track">
                                    <div
                                      className="od-breakdown-modal__bar-fill"
                                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                  <span>{pct}%</span>
                                </td>
                              </tr>
                            );
                          })
                        : (data.items as BreakdownGroupItem[]).map((item) => {
                            const pct = data.total_with_value > 0
                              ? Math.round((item.count / data.total_with_value) * 100)
                              : 0;
                            const isOther = item.group_id === 'other';
                            return (
                              <tr
                                key={item.group_id}
                                className="od-breakdown-modal__row--clickable"
                                onClick={() => handleRowClick(item)}
                              >
                                <td className={`od-breakdown-modal__label${isOther ? ' od-breakdown-modal__label--other' : ''}`}>
                                  {item.label}
                                </td>
                                <td className="od-breakdown-modal__count">{item.count.toLocaleString()}</td>
                                <td className="od-breakdown-modal__share">
                                  <div className="od-breakdown-modal__bar-track">
                                    <div
                                      className="od-breakdown-modal__bar-fill"
                                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                  <span>{pct}%</span>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsBreakdownModal;
