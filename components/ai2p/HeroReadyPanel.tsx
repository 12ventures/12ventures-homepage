import React from 'react';

const CHECKS = [
  { name: 'Architecture', detail: 'Structure holds under load' },
  { name: 'Security', detail: 'Money and data paths locked' },
  { name: 'Ops', detail: 'Issues visible before users' },
  { name: 'Scale', detail: 'Headroom for traffic and spend' },
] as const;

/** Aspirational launch-ready snapshot for the hero — illustrative, not client data. */
const HeroReadyPanel: React.FC = () => (
  <aside className="ai2p-ready" aria-label="Illustrative launch-ready view">
    <div className="ai2p-ready-top">
      <span className="ai2p-ready-label">Launch-ready view</span>
      <div className="ai2p-ready-status">
        <span className="ai2p-ready-pulse" aria-hidden="true" />
        Clear to launch
      </div>
    </div>

    <ul className="ai2p-ready-checks">
      {CHECKS.map((item) => (
        <li key={item.name}>
          <span className="ai2p-ready-check" aria-hidden="true">
            <svg viewBox="0 0 16 16" focusable="false">
              <path
                className="ai2p-ready-tick"
                d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="ai2p-ready-check-copy">
            <strong>{item.name}</strong>
            <span>{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>

    <div className="ai2p-ready-metrics">
      <div className="ai2p-ready-metric">
        <span className="ai2p-ready-metric-label">Visibility</span>
        <span className="ai2p-ready-metric-val">Live</span>
      </div>
      <svg
        className="ai2p-ready-spark"
        viewBox="0 0 160 48"
        role="img"
        aria-label="Visibility trending up"
      >
        <defs>
          <linearGradient id="ai2pReadyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a8f6e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5a8f6e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="ai2p-ready-spark-fill"
          d="M0 40 L20 38 L40 34 L60 30 L80 22 L100 16 L120 12 L140 7 L160 4 L160 48 L0 48 Z"
          fill="url(#ai2pReadyFill)"
        />
        <path
          className="ai2p-ready-spark-line"
          d="M0 40 L20 38 L40 34 L60 30 L80 22 L100 16 L120 12 L140 7 L160 4"
          fill="none"
          stroke="#7aaf8c"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </aside>
);

export default HeroReadyPanel;
