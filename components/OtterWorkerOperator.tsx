import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import BookDemoModal from './BookDemoModal';

const YOUTUBE_ID = 'A_bvdgfUIVA';
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1&color=white&iv_load_policy=3`;

const VALUE_PROPS = [
  { stat: '100% Coverage', label: 'For patient and employee calls and communications' },
  { stat: '0%', label: 'Wait times and abandoned calls' },
  { stat: '24/7', label: 'Full Coverage Any Time of Day' },
  { stat: 'Fraction of the Cost', label: 'Massive savings and ROI' },
];

const OPERATOR_USES = [
  'Patient + Employee Calls',
  'Scheduling + Coordination',
  'Billing + Pre-Authorizations',
  'Data Entry + Fax + Multi-Systems Workflows',
];

const FULL_TITLE = 'OTTERWORKER I';
const CHAR_DELAY = 75;
const CYCLE_INTERVAL = 3300;

const DemoButton: React.FC<{ onClick: () => void; className?: string; wrapperClass?: string }> = ({
  onClick, className = '', wrapperClass = '',
}) => (
  <div className={wrapperClass}>
    <button
      onClick={onClick}
      className={`demo-btn-glow group bg-gradient-to-r from-blue-400 to-cyan-400 text-[#060B14] font-bold rounded-full flex items-center justify-center hover:opacity-95 transition-all hover:scale-105 ${className}`}
    >
      Book a demo
      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </button>
  </div>
);

const OtterWorkerOperator: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const [pillVisible, setPillVisible] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    if (typedCount < FULL_TITLE.length) {
      const t = setTimeout(() => setTypedCount(c => c + 1), CHAR_DELAY);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPillVisible(true), 120);
      return () => clearTimeout(t);
    }
  }, [typedCount]);

  useEffect(() => {
    const t = setInterval(() => setCycleIdx(i => (i + 1) % OPERATOR_USES.length), CYCLE_INTERVAL);
    return () => clearInterval(t);
  }, []);

  const isTyping = typedCount < FULL_TITLE.length;
  const part1 = FULL_TITLE.slice(0, Math.min(typedCount, 11));
  const part2 = typedCount > 12 ? FULL_TITLE.slice(12) : '';

  return (
    <div className="min-h-screen md:h-screen bg-[#060B14] text-white font-sans flex flex-col">
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

      <div className="flex flex-col md:flex-row flex-1">

        {/* ── Left / main content ── */}
        <div className="flex flex-col w-full md:w-[58%] px-6 md:px-8 pt-10 pb-8 md:h-full md:justify-between gap-5 md:gap-0">

          {/* Title row */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="relative inline-block min-w-0 flex-shrink">
                {pillVisible && (
                  <span
                    className="ow-pill-in absolute -top-5 right-0 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#3b82f6', boxShadow: '0 0 12px rgba(59,130,246,0.5)' }}
                  >
                    Operator
                  </span>
                )}
                <h1
                  className="font-black tracking-tight leading-none"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.75rem)' }}
                >
                  {part1}
                  {part2 && <span style={{ marginLeft: 'clamp(0.5rem, 1vw, 1rem)' }}>{part2}</span>}
                  {isTyping && <span className="ow-cursor" style={{ height: '0.8em' }} />}
                </h1>
              </div>
              {/* Header button — only at lg+ to avoid overlap at mid-range */}
              <DemoButton
                onClick={() => setModalOpen(true)}
                className="py-2 px-4 text-sm"
                wrapperClass="hidden xl:block flex-shrink-0 ow-fade-in ow-d-900"
              />
            </div>
          </div>

          {/* Mobile-only cycling text */}
          <div className="md:hidden flex-shrink-0 -mt-2">
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-1">Operators For</p>
            <div className="relative overflow-hidden" style={{ height: '1.6rem' }}>
              <p
                key={`mobile-${cycleIdx}`}
                className="ow-item-cycle absolute inset-x-0 text-sm font-semibold text-white/80 leading-snug"
              >
                {OPERATOR_USES[cycleIdx]}
              </p>
            </div>
          </div>

          {/* Video */}
          <div className="flex-shrink-0 md:flex-1 md:min-h-0 md:flex md:items-center md:justify-center ow-fade-in ow-d-200">
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
          <div className="flex-shrink-0">
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3 ow-fade-up ow-d-300">
              Why Leaders Choose OtterWorker I • Operator
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VALUE_PROPS.map((item, i) => (
              <div
                key={item.label}
                className={`rounded-xl px-3 py-4 text-center ow-fade-up ow-d-${400 + i * 100}`}
                style={{ background: '#0F1A2E', border: '1px solid rgba(56,130,246,0.15)' }}
              >
                <p className="text-xl font-black text-blue-400 mb-1">{item.stat}</p>
                <div className="h-px w-5 mx-auto mb-1.5" style={{ background: 'rgba(56,130,246,0.4)' }} />
                <p className="text-[11px] text-gray-400 leading-snug">{item.label}</p>
              </div>
            ))}
            </div>
          </div>

          {/* Mobile-only CTA */}
          <DemoButton
            onClick={() => setModalOpen(true)}
            className="w-full py-4 text-base"
            wrapperClass="md:hidden ow-fade-up ow-d-800"
          />

          {/* Footer — hidden for now */}
          {/* <div className="flex-shrink-0 flex items-center justify-between ow-fade-in ow-d-900">
            <p className="text-gray-700 text-xs">We help your people do their best work.</p>
            <a href="mailto:operator@otterworks.ai" className="text-gray-500 text-xs hover:text-white transition-colors">
              operator@otterworks.ai
            </a>
          </div> */}
        </div>

        {/* ── Right: image + cycling text + CTA (desktop only) ── */}
        <div className="hidden md:block flex-1 relative ow-fade-in ow-d-300">
          {/* Image layer */}
          <div className="absolute inset-0 overflow-hidden">
            <img src="/images/operator_banner.png" alt="Operator" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #060B14, rgba(6,11,20,0.15) 50%, transparent)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #060B14 0%, transparent 40%)' }} />
          </div>
          {/* Content layer */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-10 flex flex-col items-center gap-8 ow-fade-up ow-d-600 px-6 max-w-xs w-full">
              <div className="text-center w-full">
                <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-4"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  Operators For
                </p>
                <div className="relative overflow-hidden" style={{ height: '3.5rem' }}>
                  <p key={cycleIdx} className="ow-item-cycle absolute inset-x-0 text-lg font-bold text-white text-center leading-snug"
                    style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)' }}>
                    {OPERATOR_USES[cycleIdx]}
                  </p>
                </div>
              </div>
              <DemoButton onClick={() => setModalOpen(true)} className="py-4 px-10 text-base" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OtterWorkerOperator;
