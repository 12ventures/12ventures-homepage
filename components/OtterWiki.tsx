import React, { useMemo } from 'react';

const OtterWiki: React.FC = () => {
  // Cache-bust the iframe URL to ensure fresh content on each page load
  const iframeSrc = useMemo(() => {
    const baseUrl = 'https://docs.google.com/document/d/e/2PACX-1vTBTRdIcWUKRa59aq0SM1-vXRNLw3z7guWoTyqzGiaeN9vznKV58YJ962mKJjruDTgCPrLIxcLRqwBA/pub?embedded=true';
    return `${baseUrl}&cachebust=${Date.now()}`;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center py-8 px-4 relative">
      {/* Edit button */}
      <a
        href="https://docs.google.com/document/d/1KScmXu4Wc7tV1yue76zTfO_jOYqRA1-Rb5zXa2rAEWs/edit?usp=sharing"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 text-sm font-medium rounded-lg shadow-md ring-1 ring-slate-200/50 transition-all duration-200 hover:bg-slate-50 hover:text-slate-800 hover:shadow-lg hover:-translate-y-0.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Wiki
      </a>

      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl shadow-slate-300/50 ring-1 ring-slate-200/50 overflow-hidden">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          title="Otter Wiki"
        />
      </div>
    </div>
  );
};

export default OtterWiki;

