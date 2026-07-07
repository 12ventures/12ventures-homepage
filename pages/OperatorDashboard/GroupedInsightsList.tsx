import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import {
  computeOtherPercent,
  poseidonService,
  type AnalyticsInsightsBreakdownField,
  type BreakdownVariantItem,
  type DashboardFilter,
  type NormalizedGroupRow,
} from '../../services/poseidonService';
import type { OdChartTheme } from './operatorDashboardChartTheme';
import './GroupedInsightsList.css';

interface Props {
  data: NormalizedGroupRow[];
  /** Full dataset for Other % (may differ from `data` when top-N sliced). */
  fullData?: NormalizedGroupRow[];
  chartTheme: OdChartTheme;
  filter: DashboardFilter;
  includeTestCalls: boolean;
  breakdownField: AnalyticsInsightsBreakdownField;
}

const GroupedInsightsList: React.FC<Props> = ({
  data,
  fullData,
  chartTheme,
  filter,
  includeTestCalls,
  breakdownField,
}) => {
  const [otherExpanded, setOtherExpanded] = useState(false);
  const [otherVariants, setOtherVariants] = useState<BreakdownVariantItem[] | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);

  const dataKey = useMemo(
    () => data.map((row) => `${row.group_id}:${row.count}`).join('|'),
    [data],
  );

  useEffect(() => {
    setOtherExpanded(false);
    setOtherVariants(null);
    setOtherError(null);
  }, [filter, breakdownField, dataKey]);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.count - a.count),
    [data],
  );

  const maxCount = useMemo(
    () => Math.max(1, ...sortedData.map((row) => row.count)),
    [sortedData],
  );

  const otherPct = useMemo(
    () => computeOtherPercent(fullData ?? data),
    [fullData, data],
  );

  if (sortedData.length === 0) {
    return <p className="od-chart-empty">No data for this period.</p>;
  }

  const toggleOther = () => {
    const next = !otherExpanded;
    setOtherExpanded(next);
    if (!next || otherVariants != null || otherLoading) return;

    setOtherLoading(true);
    setOtherError(null);
    void poseidonService
      .getAnalyticsInsightsBreakdown(filter, breakdownField, includeTestCalls, 'other')
      .then((result) => {
        setOtherVariants(result.items as BreakdownVariantItem[]);
      })
      .catch((err: unknown) => {
        setOtherError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        setOtherLoading(false);
      });
  };

  return (
    <div className="od-grouped-list">
      {sortedData.map((row) => {
        const barPct = (row.count / maxCount) * 100;
        const isOther = row.is_other === true;

        return (
          <div
            key={row.group_id}
            className={`od-grouped-list__row${isOther ? ' od-grouped-list__row--other' : ''}`}
          >
            <div className="od-grouped-list__row-main">
              <span className="od-grouped-list__label">{row.label}</span>
              <div className="od-grouped-list__bar-track">
                <div
                  className={`od-grouped-list__bar-fill${isOther ? ' od-grouped-list__bar-fill--other' : ''}`}
                  style={{
                    width: `${barPct}%`,
                    background: chartTheme.bar,
                  }}
                />
              </div>
              <span className="od-grouped-list__count">{row.count.toLocaleString()}</span>
              {isOther && (
                <button
                  type="button"
                  className="od-grouped-list__expand"
                  onClick={toggleOther}
                  aria-expanded={otherExpanded}
                  aria-label={otherExpanded ? 'Collapse other items' : 'Expand other items'}
                  title={otherExpanded ? 'Hide breakdown' : 'Show unmapped items'}
                >
                  <FiChevronDown
                    size={12}
                    className={otherExpanded ? 'od-grouped-list__expand-icon--open' : undefined}
                  />
                </button>
              )}
            </div>

            {isOther && otherExpanded && (
              <div className="od-grouped-list__other-detail">
                {otherLoading && (
                  <p className="od-grouped-list__other-state">Loading…</p>
                )}
                {!otherLoading && otherError && (
                  <p className="od-grouped-list__other-state od-grouped-list__other-state--error">
                    {otherError}
                  </p>
                )}
                {!otherLoading && !otherError && otherVariants && otherVariants.length === 0 && (
                  <p className="od-grouped-list__other-state">No items.</p>
                )}
                {!otherLoading && !otherError && otherVariants && otherVariants.length > 0 && (
                  <ul className="od-grouped-list__other-items">
                    {otherVariants.map((item, index) => (
                      <li key={`${item.label}-${index}`} className="od-grouped-list__other-item">
                        <span className="od-grouped-list__other-item-label">{item.label}</span>
                        <span className="od-grouped-list__other-item-count">
                          {item.count.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}

      {otherPct != null && (
        <p className="od-grouped-list__other-pct">{otherPct.toFixed(0)}% other</p>
      )}
    </div>
  );
};

export default GroupedInsightsList;
