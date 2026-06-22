import React, { useEffect, useRef, useState } from 'react';

// ─── Video URL ──────────────────────────────────────────────────────────────
const BG_VIDEO_URL: string | null = 'https://games.dreambox.gg/videos/d0776cf5-aa6b-4c61-929f-ec6759588956.mp4';
// ────────────────────────────────────────────────────────────────────────────

// ─── Loop mode ──────────────────────────────────────────────────────────────
// 'hard'  — instant loop (relies on seamless source)
// 'fade'  — fades out at end, fades back in at start
// 'scrub' — mouse X position scrubs video time (parallax feel, no autoplay)
type LoopMode = 'hard' | 'fade' | 'scrub';
const LOOP_MODE = 'fade' as LoopMode;
// ────────────────────────────────────────────────────────────────────────────

// ─── Tune these ─────────────────────────────────────────────────────────────
const MAX_OPACITY    = 0.70; // peak video brightness
const FADE_BEFORE_END = 0.9; // seconds before end to begin fade-out
const FADE_IN_MS     = 700;  // fade-in duration after loop reset
const FADE_PAUSE_MS  = 800;  // ms to hold on black after fade-out before fade-in
const SCRUB_CENTER   = 0.40; // 0–1: video position shown at center mouse
const SCRUB_RANGE    = 0.12; // ± fraction of duration moved at screen edges
const SCRUB_LERP     = 0.06; // smoothing factor (lower = smoother / more lag)
const VIDEO_SCALE    = 0.9; // 1 = full size, 0.72 = 72% — scales entire frame down, no crop
// ────────────────────────────────────────────────────────────────────────────

const PAGE_BG = '#080b10';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const VenturesHome: React.FC = () => {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const scrubTargetRef  = useRef(0);
  const scrubCurrentRef = useRef(0);
  const rafRef          = useRef<number>(0);

  // ── 1. Deferred load — text renders first, video loads after ────────────
  useEffect(() => {
    if (!BG_VIDEO_URL || !videoRef.current) return;
    const video = videoRef.current;

    const onCanPlay = () => {
      // Fade in via rAF — no CSS transition so fade/scrub modes control opacity freely
      let start: number | null = null;
      const INITIAL_FADE_MS = 1200;
      const fadeIn = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / INITIAL_FADE_MS, 1);
        video.style.opacity = String(p * MAX_OPACITY);
        if (p < 1) requestAnimationFrame(fadeIn);
        else setVideoLoaded(true); // signal other effects only after fully visible
      };
      requestAnimationFrame(fadeIn);

      if (LOOP_MODE === 'scrub' && !isNaN(video.duration)) {
        const t = video.duration * SCRUB_CENTER;
        scrubTargetRef.current  = t;
        scrubCurrentRef.current = t;
        video.currentTime = t;
      }
    };

    video.addEventListener('canplaythrough', onCanPlay);
    const raf = requestAnimationFrame(() => {
      video.src = BG_VIDEO_URL;
      video.load();
    });

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('canplaythrough', onCanPlay);
    };
  }, []);

  // ── 2. Fade loop — direct DOM opacity, zero React re-renders ────────────
  useEffect(() => {
    if (!BG_VIDEO_URL || LOOP_MODE !== 'fade' || !videoLoaded) return;
    const video = videoRef.current!;
    let pauseTimeout: ReturnType<typeof setTimeout> | null = null;
    let fadeInRaf: number | null = null;

    const handleTimeUpdate = () => {
      if (isNaN(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_BEFORE_END) {
        video.style.opacity = String((remaining / FADE_BEFORE_END) * MAX_OPACITY);
      } else {
        video.style.opacity = String(MAX_OPACITY);
      }
    };

    const startFadeIn = () => {
      let start: number | null = null;
      const fadeIn = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / FADE_IN_MS, 1);
        video.style.opacity = String(p * MAX_OPACITY);
        if (p < 1) fadeInRaf = requestAnimationFrame(fadeIn);
      };
      fadeInRaf = requestAnimationFrame(fadeIn);
    };

    const handleEnded = () => {
      video.pause();
      video.style.opacity = '0';

      pauseTimeout = setTimeout(() => {
        video.currentTime = 0;
        void video.play().then(startFadeIn);
      }, FADE_PAUSE_MS);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (pauseTimeout) clearTimeout(pauseTimeout);
      if (fadeInRaf) cancelAnimationFrame(fadeInRaf);
    };
  }, [videoLoaded]);

  // ── 3. Mouse scrub — rAF loop lerps toward mouse-driven target time ─────
  useEffect(() => {
    if (!BG_VIDEO_URL || LOOP_MODE !== 'scrub' || !videoLoaded) return;
    const video = videoRef.current!;
    video.pause();

    const handleMouseMove = (e: MouseEvent) => {
      if (isNaN(video.duration)) return;
      const norm   = e.clientX / window.innerWidth; // 0 (left) → 1 (right)
      // Invert: mouse right → scrub left so the building "turns toward" you
      const offset = (0.5 - norm) * (SCRUB_RANGE * 2);
      scrubTargetRef.current = Math.max(
        0,
        Math.min(video.duration, (SCRUB_CENTER + offset) * video.duration),
      );
    };

    const tick = () => {
      scrubCurrentRef.current = lerp(scrubCurrentRef.current, scrubTargetRef.current, SCRUB_LERP);
      // Always write — no threshold. Browser dedupes seeks within the same frame.
      video.currentTime = scrubCurrentRef.current;
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [videoLoaded]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: PAGE_BG }}>

      {/* ── Background video ──────────────────────────────────────────── */}
      {BG_VIDEO_URL && (
        <div className="absolute inset-0 pointer-events-none">
          <video
            ref={videoRef}
            autoPlay={LOOP_MODE !== 'scrub'}
            loop={LOOP_MODE === 'hard'}
            muted
            playsInline
            preload={LOOP_MODE === 'scrub' ? 'auto' : 'none'}
            className="absolute left-1/2 top-1/2 object-contain"
            style={{
              width: '100vw',
              height: '100vh',
              transform: `translate(-50%, -50%) scale(${VIDEO_SCALE})`,
              transformOrigin: 'center center',
              opacity: 0,
            }}
          />

          {/* Overlays span full viewport so edges still dissolve into page bg */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, ${PAGE_BG} 75%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 35%, ${PAGE_BG} 90%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(0,0,0,0.52) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* ── Ambient orbs (no video) ───────────────────────────────────── */}
      {!BG_VIDEO_URL && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(30,58,95,0.35) 0%, transparent 65%)',
              animation: 'drift 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(45,30,65,0.2) 0%, transparent 70%)',
              animation: 'drift 28s ease-in-out infinite reverse',
            }}
          />
        </div>
      )}

      {/* ── Foreground text ───────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div
          className="mb-14"
          style={{ animation: 'appear 1s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
        >
          <img
            src="https://games.dreambox.gg/icons/12venturesLogoNew.png"
            alt="12 Ventures"
            className="w-[120px] md:w-[140px] opacity-90"
            style={{ filter: 'drop-shadow(0 2px 16px rgba(0,0,0,0.8))' }}
          />
        </div>

        <h1
          className="text-[2.2rem] sm:text-5xl md:text-[3.25rem] text-white"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.7), 0 8px 48px rgba(0,0,0,0.5)',
            animation: 'appear 1s cubic-bezier(0.22,1,0.36,1) 0.25s both',
          }}
        >
          Building Intelligent Organizations.
        </h1>

        <p
          className="mt-8 text-[13px] md:text-sm tracking-[0.18em] uppercase text-white/55 font-normal"
          style={{
            fontFamily: "'Inter', sans-serif",
            textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)',
            animation: 'appear 1s cubic-bezier(0.22,1,0.36,1) 0.45s both',
          }}
        >
          AI Transformation&nbsp;&nbsp;·&nbsp;&nbsp;Measurable Results
        </p>
      </div>

      <style>{`
        @keyframes appear {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -52%) scale(1.06); }
        }
      `}</style>
    </div>
  );
};

export default VenturesHome;
