import React from 'react';
import NociHtmlDoc from './NociHtmlDoc';

/** Draft execution roadmap (HTML drop-in at public/noci/execution-roadmap.html). */
const NociExecutionRoadmapPage: React.FC = () => (
  <NociHtmlDoc
    title="Noci draft execution roadmap"
    iframeTitle="Draft Execution Roadmap"
    src="/noci/execution-roadmap.html"
  />
);

export default NociExecutionRoadmapPage;
