import React from 'react';

/** Opportunity → production → measurable impact. */
const MethodStrip: React.FC = () => (
  <ol className="hs-method" aria-label="How we work">
    <li>
      <span className="hs-method-num">01</span>
      <strong>Opportunity</strong>
      <p>Find high-impact AI use cases inside real operations.</p>
    </li>
    <li>
      <span className="hs-method-num">02</span>
      <strong>Production</strong>
      <p>Deploy proven solutions into live health-system workflows.</p>
    </li>
    <li>
      <span className="hs-method-num">03</span>
      <strong>Impact</strong>
      <p>Measure coverage, capacity, cost, and workforce outcomes.</p>
    </li>
  </ol>
);

export default MethodStrip;
