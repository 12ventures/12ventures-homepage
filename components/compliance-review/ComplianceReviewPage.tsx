import React, { useEffect } from 'react';
import ComplianceReviewPasswordGate from './ComplianceReviewPasswordGate';

const ComplianceReviewPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Hospital compliance — score preview';
  }, []);

  return (
    <ComplianceReviewPasswordGate>
      <div className="flex flex-col" style={{ height: '100vh', background: '#151219' }}>
        <iframe
          title="Hospital compliance score preview"
          src="/compliance-review/hospital-compliance-preview.html"
          className="block w-full border-0 flex-1 min-h-0"
          style={{ width: '100%', background: '#151219' }}
        />
      </div>
    </ComplianceReviewPasswordGate>
  );
};

export default ComplianceReviewPage;
