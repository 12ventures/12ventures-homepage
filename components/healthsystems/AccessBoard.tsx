import React from 'react';

/** Patient Access / voice agent KPI board — PDF stats, illustrative layout. */
const AccessBoard: React.FC = () => (
  <aside className="hs-board" aria-label="Patient access results">
    <div className="hs-board-top">
      <span className="hs-board-label">Patient access · deployed</span>
      <div className="hs-board-live">
        <span className="hs-board-pulse" aria-hidden="true" />
        24/7 coverage
      </div>
    </div>

    <div className="hs-abandon">
      <div className="hs-abandon-head">
        <span>Call abandonment</span>
        <span className="hs-abandon-vals">
          <em>9%</em>
          <span aria-hidden="true">→</span>
          <strong>2%</strong>
        </span>
      </div>
      <div className="hs-abandon-track" aria-hidden="true">
        <span className="hs-abandon-before" />
        <span className="hs-abandon-after" />
      </div>
    </div>

    <ul className="hs-kpi-grid">
      <li>
        <span className="hs-kpi-num">100%</span>
        <span className="hs-kpi-txt">call coverage</span>
      </li>
      <li>
        <span className="hs-kpi-num">2,162</span>
        <span className="hs-kpi-txt">callers / 3 months</span>
      </li>
      <li>
        <span className="hs-kpi-num">45.8</span>
        <span className="hs-kpi-txt">avg calls / day</span>
      </li>
      <li>
        <span className="hs-kpi-num">4m 51s</span>
        <span className="hs-kpi-txt">avg call duration</span>
      </li>
    </ul>

    <div className="hs-capacity">
      <span className="hs-board-label">Capacity without incremental hiring</span>
      <div className="hs-capacity-row">
        <div>
          <strong>2 FTE</strong>
          <span>ongoing staffing impact</span>
        </div>
        <div>
          <strong>7 FTE</strong>
          <span>peak concurrent equivalent</span>
        </div>
      </div>
      <svg className="hs-capacity-bars" viewBox="0 0 280 56" aria-hidden="true">
        <rect className="hs-cap-track" x="0" y="8" width="280" height="14" rx="3" />
        <rect className="hs-cap-fill a" x="0" y="8" width="80" height="14" rx="3" />
        <rect className="hs-cap-track" x="0" y="34" width="280" height="14" rx="3" />
        <rect className="hs-cap-fill b" x="0" y="34" width="240" height="14" rx="3" />
      </svg>
      <p className="hs-board-note">Capacity scales beyond demonstrated peak.</p>
    </div>
  </aside>
);

export default AccessBoard;
