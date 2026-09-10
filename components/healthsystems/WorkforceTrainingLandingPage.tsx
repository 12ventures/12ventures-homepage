import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './healthsystems.css';
import MediaSlot from './MediaSlot';
import TrainingBoard from './TrainingBoard';
import ConversationForm from './ConversationForm';
import TrainingShowcase from './TrainingShowcase';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';

const PAGE_SECTIONS = ['why', 'handles', 'proof', 'engage', 'close'] as const;

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

const WorkforceTrainingLandingPage: React.FC = () => {
  const [cue, setCue] = useState({ present: false, visible: false, top: 0 });
  const sectionIndexRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const cueVisibleRef = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'AI Powered Workforce Training for Health Systems · 12 VENTURES';

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
    const root = document.querySelector('.hs-training');
    const scopes = Array.from(
      document.querySelectorAll<HTMLElement>('.hs-training .hs-reveal-scope')
    );
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
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
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
    <div className="hs hs-training">
      <nav className="hs-nav" aria-label="Primary">
        <div className="hs-wrap hs-nav-inner">
          <Link className="hs-nav-brand" to="/">
            12 VENTURES
          </Link>
          <a className="hs-nav-cta" href="#request">
            Book a conversation
          </a>
        </div>
      </nav>

      <header className="hs-hero hs-hero-split hs-reveal-scope">
        <div className="hs-hero-media" aria-hidden="true">
          <MediaSlot
            src="/healthsystems/training-hero.png"
            label="training-hero"
            ratio="fill"
            alt=""
          />
        </div>
        <div className="hs-hero-scrim" aria-hidden="true" />
        <div className="hs-wrap hs-split hs-hero-split-inner">
          <div className="hs-split-copy">
            <p className="hs-hero-brand hs-r" style={dStyle(0)}>
              AI Powered Workforce Training for Health Systems
            </p>
            <h1 className="hs-r" style={dStyle(1)}>
              New hires, floor-ready in <span className="hs-em">half the time</span>.
            </h1>
            <p className="hs-hero-dek hs-r" style={dStyle(2)}>
              Role-specific scenarios, adaptive competency checks, and a clear readiness
              score. Onboarding that fits into a shift, not a week off the floor.
            </p>
            <div className="hs-hero-actions hs-r" style={dStyle(3)}>
              <a className="hs-btn hs-btn-primary" href="#request">
                Book a conversation
              </a>
              <a className="hs-btn hs-btn-ghost" href="#proof">
                See deployed results
              </a>
            </div>
          </div>
          <div className="hs-split-media">
            <TrainingShowcase />
          </div>
        </div>
      </header>

      <main>
        <section
          className="hs-section hs-section-method hs-reveal-scope"
          id="why"
          aria-labelledby="why-title"
        >
          <div className="hs-wrap">
            <p className="hs-eyebrow hs-r" style={dStyle(0)}>
              Why it matters
            </p>
            <h2 className="hs-h2 hs-h2-wide hs-r" id="why-title" style={dStyle(1)}>
              Onboarding time is a cost you can <span className="hs-em">see</span>.
            </h2>
            <p className="hs-lede hs-r" style={dStyle(2)}>
              Live at a Los Angeles community health system. Same numbers already
              published on the health-systems page.
            </p>
            <ul className="hs-hit-row hs-hit-row-4">
              <li className="hs-r" style={dStyle(3)}>
                <strong>−50%</strong>
                <span>training time &amp; cost</span>
              </li>
              <li className="hs-r" style={dStyle(4)}>
                <strong>2×</strong>
                <span>faster to the floor</span>
              </li>
              <li className="hs-r" style={dStyle(5)}>
                <strong>+40%</strong>
                <span>competency &amp; retention</span>
              </li>
              <li className="hs-r" style={dStyle(6)}>
                <strong>$500K+</strong>
                <span>RN savings / year</span>
              </li>
            </ul>
          </div>
        </section>

        <section
          className="hs-section hs-section-next hs-reveal-scope"
          id="handles"
          aria-labelledby="handles-title"
        >
          <div className="hs-next-media" aria-hidden="true">
            <MediaSlot
              src="/healthsystems/training-shift.png"
              label="training-shift"
              ratio="fill"
              alt=""
            />
          </div>
          <div className="hs-next-scrim" aria-hidden="true" />
          <div className="hs-wrap hs-next-inner">
            <p className="hs-eyebrow hs-eyebrow-on-dark hs-r" style={dStyle(0)}>
              What it handles
            </p>
            <h2 className="hs-h2 hs-h2-on-dark hs-r" id="handles-title" style={dStyle(1)}>
              The onboarding load managers can&rsquo;t keep up with.
            </h2>
            <ul className="hs-handles hs-handles-on-dark">
              <li className="hs-r" style={dStyle(2)}>
                <strong>Role-specific scenarios</strong>
                <span>Real clinical scenarios for the role, not generic slides.</span>
              </li>
              <li className="hs-r" style={dStyle(3)}>
                <strong>Adaptive competency checks</strong>
                <span>Questions get harder as a learner shows they are ready.</span>
              </li>
              <li className="hs-r" style={dStyle(4)}>
                <strong>Built-in compliance tracking</strong>
                <span>Every module logged and audited automatically, no manual sign-off.</span>
              </li>
              <li className="hs-r" style={dStyle(5)}>
                <strong>Manager visibility</strong>
                <span>Cohort progress and readiness in one view, not a spreadsheet.</span>
              </li>
              <li className="hs-r" style={dStyle(6)}>
                <strong>Bite-sized, shift-friendly</strong>
                <span>Microlearning that fits between patients, not a day off the floor.</span>
              </li>
            </ul>
          </div>
        </section>

        <section
          className="hs-section hs-reveal-scope"
          id="proof"
          aria-labelledby="proof-title"
        >
          <div className="hs-wrap hs-split">
            <div className="hs-split-copy">
              <p className="hs-eyebrow hs-r" style={dStyle(0)}>
                Deployed · Workforce training
              </p>
              <h2 className="hs-h2 hs-r" id="proof-title" style={dStyle(1)}>
                Half the cost. Twice the speed to the <span className="hs-em">floor</span>.
              </h2>
              <p className="hs-capsule hs-r" style={dStyle(2)}>
                Los Angeles community health system · 131 beds · ~1,500 employees.
                Role-specific AI training cuts time and cost, raises competency, and
                reduces reliance on premium labor.
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
            <TrainingBoard context="131 beds · ~1,500 employees · Los Angeles" />
          </div>
        </section>

        <section
          className="hs-section hs-section-method hs-reveal-scope"
          id="engage"
          aria-labelledby="engage-title"
        >
          <div className="hs-wrap">
            <p className="hs-eyebrow hs-r" style={dStyle(0)}>
              How we work
            </p>
            <h2 className="hs-h2 hs-r" id="engage-title" style={dStyle(1)}>
              Production in 90 days. Not another LMS pilot.
            </h2>
            <ol className="hs-engage">
              <li className="hs-r" style={dStyle(2)}>
                <span className="hs-engage-when">Weeks 1–2</span>
                <strong>Opportunity scan</strong>
                <p>
                  Working session on your onboarding path. Rank roles, time to floor,
                  and compliance load against what the agent can take first.
                </p>
              </li>
              <li className="hs-r" style={dStyle(3)}>
                <span className="hs-engage-when">First 90 days</span>
                <strong>Go live</strong>
                <p>
                  First cohort live with baselines agreed up front. Your managers own
                  adoption with us alongside.
                </p>
              </li>
              <li className="hs-r" style={dStyle(4)}>
                <span className="hs-engage-when">Ongoing</span>
                <strong>Measure and scale</strong>
                <p>
                  Track time to floor, competency, and compliance. Package what works
                  for the next role and cohort.
                </p>
              </li>
            </ol>
            <p className="hs-note hs-r" style={dStyle(3)}>
              Next on workforce: scale the same cohorts to new roles and units.
            </p>
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
              Let&rsquo;s get your next cohort floor-ready.
            </h2>
            <p className="hs-lede hs-r" style={dStyle(2)}>
              Tell us how onboarding runs today. We will map where production AI can
              cut training time and lift competency.
            </p>
            <div className="hs-r" style={dStyle(3)}>
              <ConversationForm variant="training" />
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

export default WorkforceTrainingLandingPage;
