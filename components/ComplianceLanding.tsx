import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import BookDemoModal from './BookDemoModal';
import YouTubeFacade from './YouTubeFacade';

// Set a YouTube ID once the video is uploaded; until then the self-hosted MP4 plays.
const YOUTUBE_ID = '';
const VIDEO_SRC = '/videos/12-ventures-health-compliance.mp4';
const VIDEO_POSTER = '/images/compliance_video_poster.jpg';
const BANNER_SRC = '/images/compliance_banner.png';

const HEADLINE = 'AI Compliance Automation for Health Systems.';

const VALUE_PROPS = [
  { stat: 'Always Compliant', label: 'Every standard, monitored live' },
  { stat: 'Ready 24/7', label: 'Audit evidence on demand' },
  { stat: 'Fewer Sentinel Events', label: 'Risks caught and closed early' },
  { stat: 'Full Traceability', label: 'Every step logged and verified' },
];

// Modal has a narrower layout; show just the headline stat there to avoid crowding.
const MODAL_VALUE_PROPS = VALUE_PROPS.map(({ stat }) => ({ stat }));

const COMPLIANCE_USES = [
  'Joint Commission Readiness',
  'CMS Conditions of Participation',
  'Internal Audit + Risk Management',
  'Policy + Training Gap Detection',
];

const FULL_TITLE = '12 VENTURES HEALTH';
const SPLIT = 11; // "12 VENTURES" | "HEALTH"
const CHAR_DELAY = 75;
const CYCLE_INTERVAL = 3300;
const HEALTH_COLOR = '#7fd6b6';

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

/** Poster + play button for the self-hosted video; the file only loads after a click. */
const VideoFacade: React.FC<{ src: string; poster: string; title: string }> = ({ src, poster, title }) => {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (playing) {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        title={title}
        controls
        autoPlay
        playsInline
        onEnded={() => setPlaying(false)}
        className="w-full h-full bg-black"
        style={{ display: 'block', objectFit: 'contain' }}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group relative w-full h-full block"
    >
      <img src={poster} alt="" className="w-full h-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full transition-transform group-hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)' }}
        >
          <Play className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" fill="currentColor" />
        </span>
      </span>
    </button>
  );
};

const ComplianceLanding: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    document.title = '12 Ventures Health | AI Compliance Automation for Health Systems';
  }, []);

  useEffect(() => {
    if (typedCount >= FULL_TITLE.length) return;
    const t = setTimeout(() => setTypedCount(c => c + 1), CHAR_DELAY);
    return () => clearTimeout(t);
  }, [typedCount]);

  useEffect(() => {
    const t = setInterval(() => setCycleIdx(i => (i + 1) % COMPLIANCE_USES.length), CYCLE_INTERVAL);
    return () => clearInterval(t);
  }, []);

  const isTyping = typedCount < FULL_TITLE.length;
  // Types "12 VENTURES", then a gap, then "HEALTH" in the brand accent.
  const part1 = FULL_TITLE.slice(0, Math.min(typedCount, SPLIT));
  const part2 = typedCount > SPLIT + 1 ? FULL_TITLE.slice(SPLIT + 1, typedCount) : '';

  return (
    <div className="h-[100dvh] min-h-[560px] bg-[#060B14] text-white font-sans flex flex-col">
      {modalOpen && (
        <BookDemoModal
          onClose={() => setModalOpen(false)}
          product="Compliance"
          kicker="12 Ventures Health · Compliance"
          tagline="Continuous compliance. Complete visibility."
          valueProps={MODAL_VALUE_PROPS}
          sourceUrl="12 Ventures Health Compliance Page"
          email=""
        />
      )}

      <div className="flex flex-col md:flex-row flex-1">

        {/* ── Left / main content ── */}
        <div className="flex flex-col flex-1 min-h-0 md:flex-none w-full md:w-[58%] px-5 md:px-8 pt-8 md:pt-10 pb-5 md:pb-8 md:h-full md:justify-between gap-3 md:gap-0">

          {/* Title row */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="relative inline-block min-w-0 flex-shrink">
                <h1
                  className="font-black tracking-tight leading-none"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.75rem)' }}
                >
                  {part1}
                  {part2 && <span style={{ marginLeft: 'clamp(0.5rem, 1vw, 1rem)', color: HEALTH_COLOR }}>{part2}</span>}
                  {isTyping && <span className="ow-cursor" style={{ height: '0.8em' }} />}
                </h1>
              </div>
              {/* Header button — only at xl+ to avoid overlap at mid-range */}
              <DemoButton
                onClick={() => setModalOpen(true)}
                className="py-2 px-4 text-sm"
                wrapperClass="hidden xl:block flex-shrink-0 ow-fade-in ow-d-900"
              />
            </div>
          </div>

          {/* Mobile-only cycling text */}
          <div className="md:hidden flex-shrink-0">
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-1">Built For</p>
            <div className="relative overflow-hidden" style={{ height: '1.6rem' }}>
              <p
                key={`mobile-${cycleIdx}`}
                className="ow-item-cycle absolute inset-x-0 text-sm font-semibold text-white/80 leading-snug"
              >
                {COMPLIANCE_USES[cycleIdx]}
              </p>
            </div>
          </div>

          {/* Headline + video */}
          {/* Takes whatever height is left; the player scales to fit it (16:9) so nothing scrolls. */}
          <div
            className="flex-1 min-h-[140px] md:min-h-0 flex flex-col items-start justify-center gap-2 md:gap-4 [--reserve:3.75rem] md:[--reserve:5rem]"
            style={{ containerType: 'size' }}
          >
            <h2 className="flex-shrink-0 text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white leading-snug ow-fade-up ow-d-100">
              {HEADLINE}
            </h2>
            <div
              className="rounded-2xl overflow-hidden flex-shrink-0 ow-fade-in ow-d-200"
              style={{
                width: 'min(100cqw, calc((100cqh - var(--reserve)) * 16 / 9))',
                aspectRatio: '16 / 9',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 0 40px rgba(56,189,248,0.08)',
              }}
            >
              {YOUTUBE_ID
                ? <YouTubeFacade videoId={YOUTUBE_ID} title="12 Ventures Health — AI Compliance Automation" />
                : <VideoFacade src={VIDEO_SRC} poster={VIDEO_POSTER} title="12 Ventures Health — AI Compliance Automation" />}
            </div>
          </div>

          {/* Value props */}
          <div className="flex-shrink-0">
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2 md:mb-3 ow-fade-up ow-d-300">
              Why Leaders Choose 12 Ventures Health
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {VALUE_PROPS.map((item, i) => (
              <div
                key={item.label}
                className={`rounded-xl px-2 py-2.5 md:px-3 md:py-4 text-center ow-fade-up ow-d-${400 + i * 100}`}
                style={{ background: '#0F1A2E', border: '1px solid rgba(56,130,246,0.15)' }}
              >
                <p className="text-base md:text-lg 2xl:text-xl font-black text-blue-400 md:mb-1 leading-tight" style={{ textWrap: 'balance' }}>{item.stat}</p>
                <p className="hidden md:block text-[11px] text-gray-400 leading-snug" style={{ textWrap: 'balance' }}>{item.label}</p>
              </div>
            ))}
            </div>
          </div>

          {/* Mobile-only CTA */}
          <DemoButton
            onClick={() => setModalOpen(true)}
            className="w-full py-3.5 text-base"
            wrapperClass="md:hidden ow-fade-up ow-d-800"
          />
        </div>

        {/* ── Right: image + cycling text + CTA (desktop only) ── */}
        <div className="hidden md:block flex-1 relative ow-fade-in ow-d-300">
          {/* Image layer */}
          <div className="absolute inset-0 overflow-hidden">
            <img src={BANNER_SRC} alt="12 Ventures Health" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #060B14, rgba(6,11,20,0.15) 50%, transparent)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #060B14 0%, transparent 40%)' }} />
          </div>
          {/* Content layer */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-10 flex flex-col items-center gap-8 ow-fade-up ow-d-600 px-6 max-w-xs w-full">
              <div className="text-center w-full">
                <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-4"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  Built For
                </p>
                <div className="relative overflow-hidden" style={{ height: '3.5rem' }}>
                  <p key={cycleIdx} className="ow-item-cycle absolute inset-x-0 text-lg font-bold text-white text-center leading-snug"
                    style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)' }}>
                    {COMPLIANCE_USES[cycleIdx]}
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

export default ComplianceLanding;
