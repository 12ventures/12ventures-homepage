import React from 'react';

interface TrainingBoardProps {
  context?: string;
}

/** Workforce training KPI board — PDF stats, illustrative layout. */
const TrainingBoard: React.FC<TrainingBoardProps> = ({ context }) => (
  <aside className="hs-board hs-board-training" aria-label="Workforce training results">
    <div className="hs-board-top">
      <div>
        <span className="hs-board-label">Workforce training · deployed</span>
        {context ? <p className="hs-board-context">{context}</p> : null}
      </div>
      <div className="hs-board-live hs-board-live-alt">5/5 staff rating</div>
    </div>

    <ul className="hs-train-meters">
      <li>
        <div className="hs-train-head">
          <span>Training time &amp; cost</span>
          <strong>−50%</strong>
        </div>
        <div className="hs-train-track" aria-hidden="true">
          <span className="hs-train-fill" style={{ width: '50%' }} />
        </div>
      </li>
      <li>
        <div className="hs-train-head">
          <span>Time to floor readiness</span>
          <strong>2× faster</strong>
        </div>
        <div className="hs-train-track" aria-hidden="true">
          <span className="hs-train-fill hs-train-fill-2" style={{ width: '100%' }} />
        </div>
      </li>
      <li>
        <div className="hs-train-head">
          <span>Competency &amp; retention</span>
          <strong>+40%</strong>
        </div>
        <div className="hs-train-track" aria-hidden="true">
          <span className="hs-train-fill hs-train-fill-3" style={{ width: '70%' }} />
        </div>
      </li>
    </ul>

    <div className="hs-train-spark-wrap">
      <span className="hs-board-label">Competency lift</span>
      <svg
        className="hs-train-spark"
        viewBox="0 0 220 64"
        role="img"
        aria-label="Competency trending upward"
      >
        <defs>
          <linearGradient id="hsTrainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d8b74" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3d8b74" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="hs-train-spark-fill"
          d="M0 50 L28 48 L56 44 L84 40 L112 32 L140 24 L168 16 L198 10 L220 6 L220 64 L0 64 Z"
          fill="url(#hsTrainFill)"
        />
        <path
          className="hs-train-spark-line"
          d="M0 50 L28 48 L56 44 L84 40 L112 32 L140 24 L168 16 L198 10 L220 6"
          fill="none"
          stroke="#3d8b74"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <ul className="hs-kpi-grid hs-kpi-grid-3">
      <li>
        <span className="hs-kpi-num">#1</span>
        <span className="hs-kpi-txt">vs traditional cohort</span>
      </li>
      <li>
        <span className="hs-kpi-num">100%</span>
        <span className="hs-kpi-txt">compliance rate</span>
      </li>
      <li>
        <span className="hs-kpi-num">$500K+</span>
        <span className="hs-kpi-txt">RN training savings / year</span>
      </li>
    </ul>
  </aside>
);

export default TrainingBoard;
