import React, { useEffect } from 'react';
import ComplianceReviewPasswordGate from './ComplianceReviewPasswordGate';

const ComplianceReviewPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Joint Commission Live Assessment';
  }, []);

  return (
    <ComplianceReviewPasswordGate>
      <div className="flex flex-col" style={{ height: '100vh', background: '#0b1220' }}>
        <iframe
          title="Joint Commission Live Assessment"
          src="/compliance-review/hospital-compliance-preview.html"
          className="block w-full border-0 flex-1 min-h-0"
          style={{ width: '100%', background: '#0b1220' }}
        />
      </div>
    </ComplianceReviewPasswordGate>
  );
};

export default ComplianceReviewPage;
