import React, { useEffect } from 'react';
import ComplianceReviewPasswordGate from './ComplianceReviewPasswordGate';

const ComplianceReviewPage: React.FC<{ variant?: 'mlkch' }> = ({ variant }) => {
  const mlkch = variant === 'mlkch';
  const title = mlkch
    ? 'Joint Commission Live Assessment · MLKCH'
    : 'Joint Commission Live Assessment';

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <ComplianceReviewPasswordGate>
      <div className="flex flex-col" style={{ height: '100vh', background: '#0b1220' }}>
        <iframe
          title={title}
          src={
            mlkch
              ? '/compliance-review/hospital-compliance-preview-mlkch.html'
              : '/compliance-review/hospital-compliance-preview.html'
          }
          className="block w-full border-0 flex-1 min-h-0"
          style={{ width: '100%', background: '#0b1220' }}
        />
      </div>
    </ComplianceReviewPasswordGate>
  );
};

export default ComplianceReviewPage;
