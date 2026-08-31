import React from 'react';

/** Stylized anonymized assessment preview — built in code, not a screenshot. */
const AssessmentPreview: React.FC = () => (
  <aside className="ai2p-preview-shell" aria-label="Sample assessment preview">
    <div className="ai2p-preview-top">
      <div>
        <div className="label">Sample shape · anonymized</div>
        <h3>Production readiness summary</h3>
      </div>
      <div className="meta">12 VENTURES · assessment shape</div>
    </div>

    <div className="ai2p-preview-kpis">
      <div className="ai2p-preview-kpi">
        <span className="n">16</span>
        <span className="t">high findings</span>
      </div>
      <div className="ai2p-preview-kpi">
        <span className="n">33</span>
        <span className="t">total findings</span>
      </div>
      <div className="ai2p-preview-kpi">
        <span className="n">P0</span>
        <span className="t">launch gate clear first</span>
      </div>
    </div>

    <div className="ai2p-preview-body">
      <article className="ai2p-finding">
        <div className="ai2p-finding-top">
          <span className="ai2p-badge ai2p-badge-high">HIGH</span>
          <span className="ai2p-badge">F-04</span>
        </div>
        <h4>No backup or restore posture</h4>
        <p>Point-in-time restore was assumed, not drilled. Schema-first recovery does not work today.</p>
      </article>

      <article className="ai2p-finding">
        <div className="ai2p-finding-top">
          <span className="ai2p-badge ai2p-badge-high">HIGH</span>
          <span className="ai2p-badge">F-05</span>
        </div>
        <h4>Single shared admin credential</h4>
        <p>One secret protects the back office. No actor attribution on paid or catalog writes.</p>
      </article>

      <article className="ai2p-finding">
        <div className="ai2p-finding-top">
          <span className="ai2p-badge ai2p-badge-med">MEDIUM</span>
          <span className="ai2p-badge">F-12</span>
        </div>
        <h4>Queue with no depth observability</h4>
        <p>Hand-rolled async work without a global bound. Failures stay silent until someone opens an admin desk.</p>
      </article>

      <div className="ai2p-mini-road" aria-label="Mini execution roadmap">
        <div className="ai2p-mini-lane now">
          <div className="lane">Now</div>
          <div className="bar">Fix what would break a real launch</div>
        </div>
        <div className="ai2p-mini-lane next">
          <div className="lane">Next</div>
          <div className="bar">Scale admin and tenancy paths</div>
        </div>
        <div className="ai2p-mini-lane ongoing">
          <div className="lane">Ongoing</div>
          <div className="bar">Core product workstreams</div>
        </div>
      </div>

      <p className="ai2p-preview-note">
        Sample shape only. Yours is written for your product.
      </p>
    </div>
  </aside>
);

export default AssessmentPreview;
