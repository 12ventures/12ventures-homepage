import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './healthsystems.css';
import MediaSlot from './MediaSlot';
import MethodStrip from './MethodStrip';
import AccessBoard from './AccessBoard';
import TrainingBoard from './TrainingBoard';

/** Swap when real Calendly URL is ready. */
export const HEALTH_CALENDLY_URL = 'https://calendly.com/';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';

const PAGE_SECTIONS = ['method', 'access', 'training', 'next', 'close'] as const;

const CUE_SIZE = 44;
const CUE_PAD = 18;
const CUE_REVEAL_MS = 1600;

const dStyle = (n: number): React.CSSProperties =>
  ({ ['--d' as string]: n }) as React.CSSProperties;

function getCurrentSectionIndex() {
  const marker = window.innerHeight * 0.4;
  let current = -1;
  for (let i = 0; i < PAGE_SECTIONS.length; i++) {
    const el = document.getElementById(PAGE_SECTIONS[i]);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= marker) current = i;
  }
  return current;
}

function getActiveSurface(index: number) {
  if (index < 0) return document.querySelector<HTMLElement>('.hs-hero');
  return document.getElementById(PAGE_SECTIONS[index]);
}

const HealthSystemsLandingPage: React.FC = () => {
  const [cue, setCue] = useState({ present: false, visible: false, top: 0 });
  const sectionIndexRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const cueVisibleRef = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Applied AI for Health Systems · 12 VENTURES';

    let link = document.querySelector<HTMLLinkElement>('link[data-hs-font]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      link.dataset.hsFont = '1';
      document.head.appendChild(link);
    }

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const clearRevealTimer = () => {
      if (revealTimerRef.current != null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };

    const scheduleReveal = () => {
      clearRevealTimer();
      revealTimerRef.current = window.setTimeout(() => {
        cueVisibleRef.current = true;
        setCue((prev) => (prev.present ? { ...prev, visible: true } : prev));
        revealTimerRef.current = null;
      }, CUE_REVEAL_MS);
    };

    const hideCue = (top?: number) => {
      clearRevealTimer();
      cueVisibleRef.current = false;
      setCue((prev) => ({
        present: false,
        visible: false,
        top: top ?? prev.top,
      }));
    };

    const syncCue = () => {
      const index = getCurrentSectionIndex();
      const hasNext = index < PAGE_SECTIONS.length - 1;
      const surface = getActiveSurface(index);

      if (!hasNext || !surface) {
        sectionIndexRef.current = index;
        hideCue();
        return;
      }

      const rect = surface.getBoundingClientRect();
      const sectionAnchor = rect.bottom - CUE_PAD - CUE_SIZE;
      const viewportAnchor = window.innerHeight - CUE_PAD - CUE_SIZE;
      const top = Math.max(8, Math.min(sectionAnchor, viewportAnchor));
      const sectionChanged = sectionIndexRef.current !== index;

      if (sectionChanged) {
        sectionIndexRef.current = index;
        cueVisibleRef.current = false;
        setCue({ present: true, visible: false, top });
        scheduleReveal();
        return;
      }

      setCue((prev) => ({ ...prev, present: true, top }));
      if (!cueVisibleRef.current && revealTimerRef.current == null) {
        scheduleReveal();
      }
    };

    const frame = window.requestAnimationFrame(() => syncCue());
    window.addEventListener('scroll', syncCue, { passive: true });
    window.addEventListener('resize', syncCue);
    return () => {
      window.cancelAnimationFrame(frame);
      clearRevealTimer();
      window.removeEventListener('scroll', syncCue);
      window.removeEventListener('resize', syncCue);
    };
  }, []);

  useEffect(() => {
    const root = document.querySelector('.hs');
    const scopes = Array.from(document.querySelectorAll<HTMLElement>('.hs-reveal-scope'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      root?.classList.add('is-page-ready');
      scopes.forEach((scope) => scope.classList.add('is-revealed'));
      return;
    }

    const readyFrame = window.requestAnimationFrame(() => {
      root?.classList.add('is-page-ready');
      document.querySelector('.hs-hero')?.classList.add('is-revealed');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );

    scopes.forEach((scope) => {
      if (scope.classList.contains('hs-hero')) return;
      io.observe(scope);
    });

    return () => {
      window.cancelAnimationFrame(readyFrame);
      io.disconnect();
    };
  }, []);

  const scrollToNextSection = () => {
    const nextId = PAGE_SECTIONS[getCurrentSectionIndex() + 1];
    if (!nextId) return;
    if (revealTimerRef.current != null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    cueVisibleRef.current = false;
    setCue((prev) => ({ ...prev, visible: false }));
    document.getElementById(nextId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hs">
      <nav className="hs-nav" aria-label="Primary">
        <div className="hs-wrap hs-nav-inner">
          <Link className="hs-nav-brand" to="/">
            12 VENTURES
          </Link>
          <a className="hs-nav-cta" href={HEALTH_CALENDLY_URL} target="_blank" rel="noreferrer">
            Book a conversation
          </a>
        </div>
      </nav>

      <header className="hs-hero hs-reveal-scope">
        <div className="hs-hero-media" aria-hidden="true">
          <MediaSlot
            src="/healthsystems/hero-campus.png"
            label="hero-campus"
            ratio="fill"
            alt=""
          />
        </div>
        <div className="hs-hero-scrim" aria-hidden="true" />
        <div className="hs-hero-rail">
          <div className="hs-hero-content">
            <p className="hs-hero-brand hs-r" style={dStyle(0)}>
              Applied AI for Health Systems
            </p>
            <h1 className="hs-r" style={dStyle(1)}>
              AI that ships into operations and shows up in the numbers.
            </h1>
            <p className="hs-hero-dek hs-r" style={dStyle(2)}>
              12 VENTURES partners with health systems to identify, deploy, and scale AI
              for patient access, workforce performance, and measurable operational impact.
            </p>
            <div className="hs-hero-actions hs-r" style={dStyle(3)}>
              <a className="hs-btn hs-btn-primary" href={HEALTH_CALENDLY_URL} target="_blank" rel="noreferrer">
                Book a conversation
              </a>
              <a className="hs-btn hs-btn-ghost" href="#access">
                See deployed results
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          className="hs-section hs-section-method hs-reveal-scope"
          id="method"
          aria-labelledby="method-title"
        >
          <div className="hs-wrap">
            <p className="hs-eyebrow hs-r" style={dStyle(0)}>
              How we work
            </p>
            <h2 className="hs-h2 hs-r" id="method-title" style={dStyle(1)}>
              Opportunity → production → <span className="hs-em">impact</span>.
            </h2>
            <p className="hs-lede hs-r" style={dStyle(2)}>
              We help health systems move AI from idea into live workflows, then prove it
              with operational metrics.
            </p>
            <div className="hs-r" style={dStyle(3)}>
              <MethodStrip />
            </div>
          </div>
        </section>

        <section
          className="hs-section hs-reveal-scope"
          id="access"
          aria-labelledby="access-title"
        >
          <div className="hs-wrap hs-split">
            <div className="hs-split-copy">
              <p className="hs-eyebrow hs-r" style={dStyle(0)}>
                Patient access
              </p>
              <h2 className="hs-h2 hs-r" id="access-title" style={dStyle(1)}>
                AI voice agent for <span className="hs-em">24/7</span> call coverage.
              </h2>
              <p className="hs-capsule hs-r" style={dStyle(2)}>
                Deployed at a Southern California health system. The agent handles multiple
                patient calls at once and captures demand that would otherwise be lost to
                abandoned calls.
              </p>
            </div>
            <div className="hs-split-media hs-r-media" style={dStyle(2)}>
              <MediaSlot
                src="/healthsystems/access-ops.png"
                label="access-ops"
                ratio="4x5"
                alt="Quiet clinical access desk in soft daylight"
              />
            </div>
          </div>
          <div className="hs-wrap hs-board-wrap hs-r-media" style={dStyle(3)}>
            <AccessBoard />
          </div>
        </section>

        <section
          className="hs-section hs-section-tint hs-reveal-scope"
          id="training"
          aria-labelledby="training-title"
        >
          <div className="hs-wrap hs-split hs-split-rev">
            <div className="hs-split-copy">
              <p className="hs-eyebrow hs-r" style={dStyle(0)}>
                Workforce training
              </p>
              <h2 className="hs-h2 hs-r" id="training-title" style={dStyle(1)}>
                Role-specific training that gets staff to the floor <span className="hs-em">faster</span>.
              </h2>
              <p className="hs-capsule hs-r" style={dStyle(2)}>
                Deployed at a Los Angeles community health system. Interactive, AI-powered
                learning cut training time and cost while lifting competency and retention.
              </p>
            </div>
            <div className="hs-split-media hs-r-media" style={dStyle(2)}>
              <MediaSlot
                src="/healthsystems/training-floor.png"
                label="training-floor"
                ratio="4x5"
                alt="Daylight hospital training room"
              />
            </div>
          </div>
          <div className="hs-wrap hs-board-wrap hs-r-media" style={dStyle(3)}>
            <TrainingBoard />
          </div>
        </section>

        <section
          className="hs-section hs-section-next hs-reveal-scope"
          id="next"
          aria-labelledby="next-title"
        >
          <div className="hs-next-media" aria-hidden="true">
            <MediaSlot
              src="/healthsystems/next-path.png"
              label="next-path"
              ratio="fill"
              alt=""
            />
          </div>
          <div className="hs-next-scrim" aria-hidden="true" />
          <div className="hs-wrap hs-next-inner">
            <p className="hs-eyebrow hs-eyebrow-on-dark hs-r" style={dStyle(0)}>
              Where we go next
            </p>
            <h2 className="hs-h2 hs-h2-on-dark hs-r" id="next-title" style={dStyle(1)}>
              From proven deployments into the next layer of the system.
            </h2>
            <p className="hs-lede hs-lede-on-dark hs-r" style={dStyle(2)}>
              Shared roadmap across access and workforce: deepen what is live, then extend
              into adjacent workflows.
            </p>
            <ol className="hs-next-steps hs-r" style={dStyle(3)}>
              <li>
                <strong>EHR-integrated scheduling</strong>
                <span>Registration automation on top of voice coverage.</span>
              </li>
              <li>
                <strong>Scale training cohorts</strong>
                <span>More roles, same competency and compliance bar.</span>
              </li>
              <li>
                <strong>Measure and expand</strong>
                <span>Replicate high-impact patterns across the system.</span>
              </li>
            </ol>
          </div>
        </section>

        <section
          className="hs-section hs-section-close hs-reveal-scope"
          id="close"
          aria-labelledby="close-title"
        >
          <div className="hs-wrap hs-close-inner">
            <p className="hs-eyebrow hs-r" style={dStyle(0)}>
              Next step
            </p>
            <h2 className="hs-h2 hs-r" id="close-title" style={dStyle(1)}>
              Let’s identify high-impact AI for <span className="hs-em">your</span> system.
            </h2>
            <p className="hs-lede hs-r" style={dStyle(2)}>
              Book a conversation. We’ll map where production AI can improve access,
              workforce performance, and measurable operations.
            </p>
            <div className="hs-r" style={dStyle(3)}>
              <a className="hs-btn hs-btn-primary" href={HEALTH_CALENDLY_URL} target="_blank" rel="noreferrer">
                Book a conversation
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="hs-footer">
        <div className="hs-wrap hs-footer-inner">
          <p className="hs-eyebrow">12 VENTURES</p>
          <p>
            Applied AI for Health Systems ·{' '}
            <a href="mailto:hello@12ventures.io">hello@12ventures.io</a>
          </p>
        </div>
      </footer>

      {cue.present ? (
        <button
          type="button"
          className={`hs-scroll-cue${cue.visible ? ' is-visible' : ''}`}
          style={{ top: cue.top }}
          onClick={scrollToNextSection}
          aria-label="Go to next section"
          tabIndex={cue.visible ? 0 : -1}
          aria-hidden={!cue.visible}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
};

export default HealthSystemsLandingPage;
