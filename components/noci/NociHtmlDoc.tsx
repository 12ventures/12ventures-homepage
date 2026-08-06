import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import NociPasswordGate from './NociPasswordGate';

type NociHtmlDocProps = {
  title: string;
  src: string;
  iframeTitle: string;
};

/** Password-gated full-page iframe for a static Noci HTML deliverable. */
const NociHtmlDoc: React.FC<NociHtmlDocProps> = ({ title, src, iframeTitle }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <NociPasswordGate>
      <div className="flex flex-col" style={{ height: '100vh', background: '#151219' }}>
        <div
          className="flex items-center justify-between gap-3 flex-shrink-0"
          style={{
            padding: '10px 16px',
            background: '#1D1A23',
            borderBottom: '1px solid #312A38',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <Link
            to="/noci"
            style={{ color: '#CA8CAD', textDecoration: 'none' }}
          >
            Back to deliverables
          </Link>
        </div>
        <iframe
          title={iframeTitle}
          src={src}
          className="block w-full border-0 flex-1 min-h-0"
          style={{ width: '100%', background: '#151219' }}
        />
      </div>
    </NociPasswordGate>
  );
};

export default NociHtmlDoc;
