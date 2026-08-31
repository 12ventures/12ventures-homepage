import React from 'react';

const AREAS = [
  { name: 'Architecture', before: 28, after: 86 },
  { name: 'Security', before: 34, after: 90 },
  { name: 'Ops & visibility', before: 18, after: 82 },
  { name: 'Scale readiness', before: 22, after: 78 },
] as const;

/** Illustrative readiness board — not real client data. */
const ReadinessBoard: React.FC = () => (
  <aside className="ai2p-board" aria-label="Sample readiness board">
    <div className="ai2p-board-top">
      <div>
        <span className="ai2p-board-label">Sample readiness view</span>
        <h3>Where you stand → launch-ready</h3>
      </div>
      <div className="ai2p-board-p0" title="Priority-zero issues that block a safe launch">
        <span className="ai2p-board-p0-num">16</span>
        <span className="ai2p-board-p0-txt">
          <strong>P0</strong>
          must clear first
        </span>
      </div>
    </div>

    <div className="ai2p-board-legend">
      <span>
        <i className="ai2p-dot before" /> Today
      </span>
      <span>
        <i className="ai2p-dot after" /> After we harden
      </span>
    </div>

    <ul className="ai2p-board-meters">
      {AREAS.map((area) => (
        <li key={area.name}>
          <div className="ai2p-board-meter-head">
            <span>{area.name}</span>
            <span className="ai2p-board-meter-vals">
              {area.before}% → {area.after}%
            </span>
          </div>
          <div className="ai2p-board-track" aria-hidden="true">
            <span className="ai2p-board-fill before" style={{ width: `${area.before}%` }} />
            <span className="ai2p-board-fill after" style={{ width: `${area.after}%` }} />
          </div>
        </li>
      ))}
    </ul>

    <div className="ai2p-board-viz">
      <div className="ai2p-board-viz-copy">
        <span className="ai2p-board-label">Visibility</span>
        <p>From flying blind to seeing problems before users do.</p>
      </div>
      <svg
        className="ai2p-board-spark"
        viewBox="0 0 180 64"
        role="img"
        aria-label="Line rising as visibility improves"
      >
        <defs>
          <linearGradient id="ai2pSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4a484" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c4a484" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 52 L24 50 L48 46 L72 44 L96 36 L120 28 L144 18 L180 8 L180 64 L0 64 Z"
          fill="url(#ai2pSparkFill)"
        />
        <path
          d="M0 52 L24 50 L48 46 L72 44 L96 36 L120 28 L144 18 L180 8"
          fill="none"
          stroke="#c4a484"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <p className="ai2p-board-note">Illustrative shape. Your numbers come from your repo.</p>
  </aside>
);

export default ReadinessBoard;
