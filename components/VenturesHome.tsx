import React, { useEffect, useRef, useState } from 'react';
import ShimmerText from './mlkch/ShimmerText';
import { OTTERWORKS_PAGE_TITLE } from '../utils/host';

// ─── Video URL ──────────────────────────────────────────────────────────────
const BG_VIDEO_URL: string | null = 'https://games.dreambox.gg/videos/intel_org.mp4';
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

const PAGE_BG = '#061018';
// Subtle color at page edges, dark blue-teal at center to match the video
const PAGE_GRADIENT = `
  radial-gradient(ellipse 78% 72% at 50% 50%, ${PAGE_BG} 0%,rgb(6, 14, 23) 58%, transparent 88%),
  radial-gradient(ellipse 48% 95% at 0% 50%, rgba(28, 52, 88, 0.38) 0%, rgba(10, 20, 37, 0.1) 50%, transparent 78%),
  radial-gradient(ellipse 48% 95% at 100% 50%, rgba(18, 58, 82, 0.34) 0%, rgba(8, 4, 23, 0.08) 50%, transparent 78%),
  radial-gradient(ellipse 75% 38% at 50% 0%, rgba(7, 11, 19, 0.28) 0%, transparent 42%),
  radial-gradient(ellipse 75% 38% at 50% 100%, rgba(7, 6, 12, 0.3) 0%, transparent 40%),
  ${PAGE_BG}
`;
// Masks video edges so the page gradient shows through instead of a flat color
const VIDEO_EDGE_MASK =
  'radial-gradient(ellipse 40% 62% at 50% 50%, black 16%, rgba(0,0,0,0.55) 52%, transparent 78%)';

type VenturesHomeVariant = '12-ventures' | 'otterworks';

const VARIANT_CONFIG: Record<
  VenturesHomeVariant,
  {
    pageTitle: string;
    logoUrl: string;
    logoAlt: string;
    headline: string;
    shimmer: string | null;
    footerName: string;
  }
> = {
  '12-ventures': {
    pageTitle: '12 VENTURES | Applied AI | Measurable Results',
    logoUrl: 'https://games.dreambox.gg/icons/12venturesLogoNew.png',
    logoAlt: '12 Ventures',
    headline: 'Building Intelligent Organizations',
    shimmer: 'AI Transformation\u00a0\u00a0·\u00a0\u00a0Scalable Results',
    footerName: '12 VENTURES',
  },
  otterworks: {
    pageTitle: OTTERWORKS_PAGE_TITLE,
    logoUrl: 'https://i.imgur.com/0yz7xSE.png',
    logoAlt: 'OtterWorks',
    headline: 'Applied AI Solutions • Scalable Results',
    shimmer: null,
    footerName: 'OTTERWORKS',
  },
};

export type { VenturesHomeVariant };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface VenturesHomeProps {
  variant?: VenturesHomeVariant;
}

const VenturesHome: React.FC<VenturesHomeProps> = ({ variant = '12-ventures' }) => {
  const config = VARIANT_CONFIG[variant];
  const copyrightYear = new Date().getFullYear();
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const scrubTargetRef  = useRef(0);
  const scrubCurrentRef = useRef(0);
  const rafRef          = useRef<number>(0);

  useEffect(() => {
    const previousTitle = document.title;
    // Defer so this wins over BrandingProvider's default title on mount
    const id = window.setTimeout(() => {
      document.title = config.pageTitle;
    }, 0);

    return () => {
      window.clearTimeout(id);
      document.title = previousTitle;
    };
  }, [config.pageTitle]);

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
    <div className="relative min-h-screen overflow-hidden" style={{ background: PAGE_GRADIENT }}>

      {/* Page gradient — always visible in letterbox areas around the video */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: PAGE_GRADIENT }} />

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
              WebkitMaskImage: VIDEO_EDGE_MASK,
              maskImage: VIDEO_EDGE_MASK,
            }}
          />

          {/* Center scrim — keeps text readable over the video */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 50% 42% at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 68%)',
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
          className={variant === 'otterworks' ? 'mb-10 md:mb-12' : 'mb-14'}
          style={{ animation: 'appear 1s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
        >
          {variant === 'otterworks' ? (
            <div className="relative inline-flex items-center justify-center px-10 py-6 md:px-12 md:py-7">
              <div
                className="absolute inset-0 pointer-events-none rounded-[28px]"
                style={{
                  background:
                    'radial-gradient(ellipse 88% 78% at 50% 50%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 48%, transparent 72%)',
                }}
              />
              <img
                src={config.logoUrl}
                alt={config.logoAlt}
                width={360}
                height={80}
                className="relative z-[1] block w-[min(300px,78vw)] md:w-[360px] h-auto object-contain object-center opacity-95"
                style={{
                  filter:
                    'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 4px 18px rgba(0,0,0,0.85)) drop-shadow(0 10px 36px rgba(0,0,0,0.55))',
                }}
              />
            </div>
          ) : (
            <img
              src={config.logoUrl}
              alt={config.logoAlt}
              className="w-[120px] md:w-[140px] opacity-90"
              style={{ filter: 'drop-shadow(0 2px 16px rgba(0,0,0,0.8))' }}
            />
          )}
        </div>

        {variant === 'otterworks' ? (
          <div
            className="otter-home-tagline"
            style={{
              animation: 'appear 1s cubic-bezier(0.22,1,0.36,1) 0.25s both',
            }}
          >
            <h1 className="text-shimmer-otter text-[15px] sm:text-base md:text-[17px] tracking-[0.16em] uppercase font-normal">
              {config.headline}
            </h1>
          </div>
        ) : (
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
            {config.headline}
          </h1>
        )}

        {config.shimmer && (
          <div
            className="mt-8"
            style={{
              filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9)) drop-shadow(0 4px 16px rgba(0,0,0,0.7))',
              animation: 'appear 1s cubic-bezier(0.22,1,0.36,1) 0.45s both',
            }}
          >
            <ShimmerText
              as="p"
              className="text-[13px] md:text-sm tracking-[0.18em] uppercase font-normal"
            >
              {config.shimmer}
            </ShimmerText>
          </div>
        )}
      </div>

      <footer className="absolute bottom-0 inset-x-0 z-10 pb-6 md:pb-8 text-center pointer-events-none">
        <p
          className="text-[11px] md:text-xs text-white/30 font-normal tracking-wide"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          © {copyrightYear} {config.footerName}. All rights reserved.
        </p>
      </footer>

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
