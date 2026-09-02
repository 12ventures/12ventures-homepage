import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './healthsystems.css';
import MediaSlot from './MediaSlot';
import AccessBoard from './AccessBoard';
import TrainingBoard from './TrainingBoard';
import ConversationForm from './ConversationForm';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';

const PAGE_SECTIONS = ['agenda', 'access', 'training', 'portfolio', 'engage', 'close'] as const;

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

/**
 * PE / sponsor value-creation variant of Applied AI for Health Systems.
 * Same visual system; copy framed for hospital execs + portfolio sponsors.
 */
const HealthSystemsPeLandingPage: React.FC = () => {
  const [cue, setCue] = useState({ present: false, visible: false, top: 0 });
  const sectionIndexRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const cueVisibleRef = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Applied AI for Health Systems · Portfolio · 12 VENTURES';

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
    <div className="hs hs-pe">
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
            <p className="hs-hero-kicker hs-r" style={dStyle(0)}>
              For hospital leaders and PE sponsors
            </p>
            <h1 className="hs-r" style={dStyle(1)}>
              <span className="hs-em">Proven</span> in production. Ready to roll out across
              the <span className="hs-em">portfolio</span>.
            </h1>
            <p className="hs-hero-dek hs-r" style={dStyle(2)}>
              Two live hospital deployments cut abandoned calls, closed staffing gaps, and
              cut training time in half. Prove it at one site, then take the same playbook
              to every hospital in the platform.
            </p>
            <div className="hs-hero-actions hs-r" style={dStyle(3)}>
              <a className="hs-btn hs-btn-primary" href="#request">
                Book a conversation
              </a>
              <a className="hs-btn hs-btn-ghost" href="#access">
                See the numbers
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          className="hs-section hs-section-method hs-reveal-scope"
          id="agenda"
          aria-labelledby="agenda-title"
        >
          <div className="hs-wrap">
            <p className="hs-eyebrow hs-r" style={dStyle(0)}>
              Why this matters now
            </p>
            <h2 className="hs-h2 hs-r" id="agenda-title" style={dStyle(1)}>
              Clear owner. Clear <span className="hs-em">upside</span>.
            </h2>
            <p className="hs-lede hs-r" style={dStyle(2)}>
              Every use case has a named owner and a financial target from day one.
            </p>
            <ul className="hs-agenda hs-r" style={dStyle(3)}>
              <li className="hs-agenda-cfo">
                <span className="hs-agenda-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 3 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="hs-agenda-role">CFO · Margin</span>
                <strong className="hs-agenda-hit">P&amp;L savings</strong>
                <p>
                  Labor is the largest cost. Turn fixed headcount into scalable capacity that
                  shows up in the numbers.
                </p>
              </li>
              <li className="hs-agenda-coo">
                <span className="hs-agenda-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="8.25"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M12 8v4.2l2.6 1.6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="hs-agenda-role">COO · Operations</span>
                <strong className="hs-agenda-hit">24/7 coverage</strong>
                <p>
                  True round-the-clock access without new shifts. Peak volume is handled by
                  the agent, not overtime.
                </p>
              </li>
              <li className="hs-agenda-cno">
                <span className="hs-agenda-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 16l5.2-5.2 3.6 3.6L20 7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.5 7H20v5.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="hs-agenda-role">CNO / CHRO · Workforce</span>
                <strong className="hs-agenda-hit">Faster to floor</strong>
                <p>
                  New hires reach the floor faster and stay longer in the roles that are
                  hardest to fill.
                </p>
              </li>
              <li className="hs-agenda-ceo">
                <span className="hs-agenda-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 18V9.5M10.5 18V6M16 18v-7.5M21 18H3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="hs-agenda-role">CEO · Growth &amp; sponsor</span>
                <strong className="hs-agenda-hit">Platform EBITDA</strong>
                <p>
                  Captured demand plus a proven rollout. Value that builds across the
                  portfolio before exit.
                </p>
              </li>
            </ul>
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
                Live results · Patient access
              </p>
              <h2 className="hs-h2 hs-r" id="access-title" style={dStyle(1)}>
                Abandoned calls became{' '}
                <span className="hs-em">captured demand</span>.
              </h2>
              <p className="hs-capsule hs-r" style={dStyle(2)}>
                Southern California health system · 364 beds · ~2,200 employees. An AI voice
                agent replaced a weekday-only desk with true 24/7 coverage and answers
                multiple calls at once.
              </p>
              <ul className="hs-hit-row hs-r" style={dStyle(3)}>
                <li>
                  <strong>9% → 2%</strong>
                  <span>call abandonment</span>
                </li>
                <li>
                  <strong>100%</strong>
                  <span>24/7 coverage</span>
                </li>
                <li>
                  <strong>7 FTE</strong>
                  <span>peak capacity equivalent</span>
                </li>
              </ul>
              <p className="hs-note hs-r" style={dStyle(4)}>
                The desk was budgeted for 6 staff (Mon–Fri, 8–5) and runs with 4. The agent
                covers the gap.
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
            <AccessBoard context="364 beds · ~2,200 employees · Southern California" />
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
                Live results · Workforce
              </p>
              <h2 className="hs-h2 hs-r" id="training-title" style={dStyle(1)}>
                Half the onboarding cost. <span className="hs-em">Twice</span> the speed to floor.
              </h2>
              <p className="hs-capsule hs-r" style={dStyle(2)}>
                Los Angeles community health system · 131 beds · ~1,500 employees.
                Role-specific AI training cuts time and cost, raises competency, and reduces
                reliance on premium labor.
              </p>
              <ul className="hs-hit-row hs-r" style={dStyle(3)}>
                <li>
                  <strong>−50%</strong>
                  <span>training time &amp; cost</span>
                </li>
                <li>
                  <strong>2×</strong>
                  <span>faster to the floor</span>
                </li>
                <li>
                  <strong>$500K+</strong>
                  <span>RN savings per year</span>
                </li>
              </ul>
              <p className="hs-note hs-r" style={dStyle(4)}>
                Those savings repeat with every new hiring class.
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
          className="hs-section hs-section-next hs-reveal-scope"
          id="portfolio"
          aria-labelledby="portfolio-title"
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
              Portfolio math
            </p>
            <h2 className="hs-h2 hs-h2-on-dark hs-r" id="portfolio-title" style={dStyle(1)}>
              Prove it once. Multiply it across the platform.
            </h2>
            <p className="hs-lede hs-lede-on-dark hs-r" style={dStyle(2)}>
              Recurring operating gains become EBITDA. Capture them before exit and they
              show up in the multiple, not as a one-time cost cut.
            </p>
            <ol className="hs-next-steps hs-r" style={dStyle(3)}>
              <li>
                <strong>01 · Prove here</strong>
                <span>
                  Start with the highest-impact use cases at one hospital. Prove adoption
                  and unit economics on site.
                </span>
              </li>
              <li>
                <strong>02 · Standardize</strong>
                <span>
                  Lock the workflow, integration, and change playbook so the next site costs
                  a fraction of the first.
                </span>
              </li>
              <li>
                <strong>03 · Scale the platform</strong>
                <span>
                  Roll out to affiliated hospitals. Keep local workflows. One diligence
                  story, portfolio-wide leverage.
                </span>
              </li>
            </ol>
          </div>
        </section>

        <section
          className="hs-section hs-section-method hs-reveal-scope"
          id="engage"
          aria-labelledby="engage-title"
        >
          <div className="hs-wrap">
            <p className="hs-eyebrow hs-r" style={dStyle(0)}>
              How we work together
            </p>
            <h2 className="hs-h2 hs-r" id="engage-title" style={dStyle(1)}>
              Production in 90 days. Not another pilot.
            </h2>
            <ol className="hs-engage hs-r" style={dStyle(2)}>
              <li>
                <span className="hs-engage-when">Weeks 1–2</span>
                <strong>Opportunity scan</strong>
                <p>
                  Working session with your leaders. Rank use cases by dollars, fit, and
                  feasibility. Built around your hospitals, not a generic deck.
                </p>
              </li>
              <li>
                <span className="hs-engage-when">First 90 days</span>
                <strong>Go live</strong>
                <p>
                  Live in production with baselines agreed up front. Your operators own
                  adoption with us alongside.
                </p>
              </li>
              <li>
                <span className="hs-engage-when">Ongoing</span>
                <strong>Measure and scale</strong>
                <p>
                  Track operating and financial impact against baseline. Package what works
                  for the next hospital.
                </p>
              </li>
            </ol>
            <p className="hs-note hs-r" style={dStyle(3)}>
              Next on access: EHR scheduling and registration, so recovered calls turn into
              booked visits.
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
              Ready to scale this across your{' '}
              <span className="hs-em">portfolio</span>?
            </h2>
            <p className="hs-lede hs-r" style={dStyle(2)}>
              Tell us about your hospitals or portfolio. We will map where production AI
              can move margin, labor, and access.
            </p>
            <div className="hs-r" style={dStyle(3)}>
              <ConversationForm variant="pe" />
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

export default HealthSystemsPeLandingPage;
