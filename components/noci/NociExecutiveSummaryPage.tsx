import React from 'react';
import NociHtmlDoc from './NociHtmlDoc';

/** Executive summary briefing. */
const NociExecutiveSummaryPage: React.FC = () => (
  <NociHtmlDoc
    title="Noci production readiness summary"
    iframeTitle="Noci production readiness summary"
    src="/noci/executive-summary.html"
  />
);

export default NociExecutiveSummaryPage;
