import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import BookDemoModal from './BookDemoModal';

const YOUTUBE_ID = 'OIFMnJQJeew';
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1&color=white&iv_load_policy=3`;

const VALUE_PROPS = [
  { stat: 'Zero', label: 'Wait Times' },
  { stat: 'Zero', label: 'Abandoned Calls' },
  { stat: '24/7', label: 'Full Coverage, Any Time of Day' },
  { stat: '10%', label: 'Of Labor Cost' },
];

const DemoButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`demo-btn-glow group bg-gradient-to-r from-blue-400 to-cyan-400 text-[#060B14] font-bold rounded-full flex items-center justify-center hover:opacity-95 transition-all hover:scale-105 ${className}`}
  >
    Book a demo
    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </button>
);

const OtterWorkerOperator: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen md:h-screen bg-[#060B14] text-white font-sans md:overflow-hidden flex flex-col">
      {modalOpen && (
        <BookDemoModal
          onClose={() => setModalOpen(false)}
          product="Operator"
          tagline="24/7 standardized labor on-demand. Fraction of the cost."
          valueProps={VALUE_PROPS}
          sourceUrl="OtterWorker I Operator Page"
          email="operator@otterworks.ai"
        />
      )}

      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">

        {/* ── Left / main content ── */}
        <div className="flex flex-col w-full md:w-[58%] px-6 md:px-8 pt-8 pb-6 md:h-full">

          {/* Title */}
          <div className="flex-shrink-0 mb-4">
            <div className="relative inline-block">
              <span
                className="absolute -top-5 right-0 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#3b82f6', boxShadow: '0 0 12px rgba(59,130,246,0.5)' }}
              >
                Operator
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
                OTTERWORKER<span className="ml-3 md:ml-4">I</span>
              </h1>
            </div>
          </div>

          {/* Video */}
          <div className="flex-shrink-0 md:flex-1 md:min-h-0 md:flex md:items-center md:justify-center mb-4">
            <div
              className="rounded-2xl overflow-hidden w-full"
              style={{
                aspectRatio: '2694/1440',
                maxHeight: '100%',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 0 40px rgba(56,189,248,0.08)',
              }}
            >
              <iframe
                src={EMBED_URL}
                title="OtterWorker I — Operator"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
              />
            </div>
          </div>

          {/* Value props */}
          <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {VALUE_PROPS.map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-3 py-3 text-center"
                style={{ background: '#0F1A2E', border: '1px solid rgba(56,130,246,0.15)' }}
              >
                <p className="text-xl font-black text-blue-400 mb-1">{item.stat}</p>
                <div className="h-px w-5 mx-auto mb-1.5" style={{ background: 'rgba(56,130,246,0.4)' }} />
                <p className="text-[11px] text-gray-400 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Mobile CTA */}
          <DemoButton
            onClick={() => setModalOpen(true)}
            className="md:hidden w-full py-4 text-base mb-4"
          />

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between">
            <p className="text-gray-700 text-xs">We help your people do their best work.</p>
            <a href="mailto:operator@otterworks.ai" className="text-gray-500 text-xs hover:text-white transition-colors">
              operator@otterworks.ai
            </a>
          </div>
        </div>

        {/* ── Right: hero image + CTA (desktop only) ── */}
        <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center">
          <img
            src="/images/operator_banner.png"
            alt="Operator"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #060B14, rgba(6,11,20,0.15) 50%, transparent)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #060B14 0%, transparent 40%)' }} />
          <div className="relative z-10">
            <DemoButton onClick={() => setModalOpen(true)} className="py-4 px-10 text-base" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default OtterWorkerOperator;
