import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './ai2p.css';
import MediaSlot from './MediaSlot';
import AssessmentPreview from './AssessmentPreview';
import AssessmentForm from './AssessmentForm';
import ReadinessBoard from './ReadinessBoard';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';

const PAGE_SECTIONS = [
  'case',
  'foundation',
  'point',
  'how',
  'preview',
  'faq',
  'close',
] as const;

const CUE_SIZE = 44;
const CUE_PAD = 18;
const CUE_REVEAL_MS = 1600;

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
  if (index < 0) return document.querySelector<HTMLElement>('.ai2p-hero');
  return document.getElementById(PAGE_SECTIONS[index]);
}

const Ai2pLandingPage: React.FC = () => {
  const [cue, setCue] = useState({ present: false, visible: false, top: 0 });
  const sectionIndexRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const cueVisibleRef = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'AI 2 Production · 12 VENTURES';

    let link = document.querySelector<HTMLLinkElement>('link[data-ai2p-font]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      link.dataset.ai2pFont = '1';
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

    const frame = window.requestAnimationFrame(() => {
      syncCue();
    });
    window.addEventListener('scroll', syncCue, { passive: true });
    window.addEventListener('resize', syncCue);
    return () => {
      window.cancelAnimationFrame(frame);
      clearRevealTimer();
      window.removeEventListener('scroll', syncCue);
      window.removeEventListener('resize', syncCue);
    };
  }, []);

  const scrollToRequest = () => {
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToPreview = () => {
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <div className="ai2p">
      <nav className="ai2p-nav" aria-label="Primary">
        <div className="ai2p-wrap ai2p-nav-inner">
          <Link className="ai2p-nav-brand" to="/">
            12 VENTURES
          </Link>
          <button type="button" className="ai2p-nav-cta" onClick={scrollToRequest}>
            Request an assessment
          </button>
        </div>
      </nav>

      <header className="ai2p-hero">
        <div className="ai2p-hero-media" aria-hidden="true">
          <MediaSlot
            src="/ai2p/hero-facade.png"
            label="hero-facade"
            ratio="fill"
            alt=""
          />
        </div>
        <div className="ai2p-hero-scrim" aria-hidden="true" />
        <div className="ai2p-hero-glow" aria-hidden="true" />
        <div className="ai2p-hero-rail">
          <div className="ai2p-hero-content">
            <p className="ai2p-hero-brand">AI 2 Production</p>
            <h1>
              Launch with confidence in{' '}
              <span className="ai2p-em">what you already built</span>.
            </h1>
            <p className="ai2p-hero-dek">
              We dig into what you built, tell you what will hold under real users,
              and give you a clear path to launch and grow without guessing.
            </p>
            <div className="ai2p-hero-actions">
              <button type="button" className="ai2p-btn ai2p-btn-primary" onClick={scrollToRequest}>
                Request an assessment
              </button>
              <button type="button" className="ai2p-btn ai2p-btn-ghost" onClick={scrollToPreview}>
                See what you get
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="ai2p-section ai2p-section-light" id="case" aria-labelledby="case-title">
          <div className="ai2p-wrap ai2p-split">
            <div className="ai2p-split-copy">
              <p className="ai2p-eyebrow ai2p-kicker">Why this exists</p>
              <h2 className="ai2p-h2" id="case-title">
                It looked ready. <span className="ai2p-em-uline">It was not</span>.
              </h2>
              <p className="ai2p-capsule">
                One founder had already spent heavily on AI and run hard automated reviews
                of the codebase. The demo looked sharp. Underneath, the architecture was
                not sound enough for a real launch. Shipping as-is would have put them at
                risk the moment real users showed up.
              </p>
            </div>
            <div className="ai2p-split-media">
              <MediaSlot
                src="/ai2p/case-surface.png"
                label="case-surface"
                ratio="4x5"
                alt="Quiet finished retail interior with no people or branding"
              />
            </div>
          </div>
        </section>

        <section className="ai2p-section ai2p-section-crack" id="foundation" aria-labelledby="foundation-title">
          <div className="ai2p-section-crack-media" aria-hidden="true">
            <MediaSlot
              src="/ai2p/agents-blindspot.png"
              label="agents-blindspot"
              ratio="fill"
              alt=""
            />
          </div>
          <div className="ai2p-section-crack-scrim" aria-hidden="true" />
          <div className="ai2p-wrap ai2p-section-crack-inner">
            <div className="ai2p-split">
              <div className="ai2p-split-copy">
                <p className="ai2p-eyebrow ai2p-kicker">What we check</p>
                <h2 className="ai2p-h2" id="foundation-title">
                  See the <span className="ai2p-em">real</span> state of your product.
                </h2>
                <p className="ai2p-capsule">
                  We score the foundation across a few areas that decide whether a launch
                  survives: architecture, security, ops, and scale. You see where you are
                  today, what is blocking a safe launch, and what “ready” looks like.
                </p>
                <ul className="ai2p-check-list">
                  <li>Architecture: will the structure hold under real use?</li>
                  <li>Security: are money and data paths actually safe?</li>
                  <li>Ops: can you see problems before customers do?</li>
                  <li>Scale: what breaks when traffic or spend grows?</li>
                </ul>
              </div>
              <div className="ai2p-split-media">
                <ReadinessBoard />
              </div>
            </div>
          </div>
        </section>

        <section className="ai2p-section ai2p-section-cutaway" id="point" aria-labelledby="point-title">
          <div className="ai2p-wrap ai2p-split ai2p-split-rev">
            <div className="ai2p-split-copy">
              <p className="ai2p-eyebrow ai2p-kicker">The point</p>
              <h2 className="ai2p-h2" id="point-title">
                Finished on the outside is <span className="ai2p-em">not enough</span>.
              </h2>
              <p className="ai2p-capsule">
                Agents are good at polishing what you can see. We open up the foundation,
                show you what is solid, and get you to a place you can launch and grow from.
              </p>
            </div>
            <div className="ai2p-split-media">
              <MediaSlot
                src="/ai2p/cutaway-foundation.png"
                label="cutaway-foundation"
                ratio="3x2"
                alt="Architectural cutaway showing finished facade versus exposed structure"
              />
            </div>
          </div>
        </section>

        <section
          className="ai2p-section ai2p-section-grain ai2p-section-how"
          id="how"
          aria-labelledby="how-title"
        >
          <div className="ai2p-how-wash" aria-hidden="true" />
          <div className="ai2p-wrap ai2p-section-inner">
            <div className="ai2p-how-head">
              <div className="ai2p-how-copy">
                <p className="ai2p-eyebrow ai2p-kicker">How it works</p>
                <h2 className="ai2p-h2" id="how-title">
                  Straight path to a <span className="ai2p-em">real answer</span>.
                </h2>
                <p className="ai2p-lede">
                  Senior engineers lead the review. Agents help where they save time. We do not
                  rip out your stack unless there is a good reason.
                </p>
              </div>
              <div className="ai2p-how-signal" aria-hidden="true">
                <svg viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="8" y="18" className="ai2p-how-signal-label">
                    noise
                  </text>
                  <text x="232" y="18" className="ai2p-how-signal-label">
                    clear
                  </text>
                  {/* Jagged early signal */}
                  <path
                    className="ai2p-how-signal-noise"
                    d="M8 72 L22 48 L36 88 L50 40 L64 76 L78 52 L92 84 L106 44"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Settling mid */}
                  <path
                    className="ai2p-how-signal-mid"
                    d="M106 44 L128 62 L148 50 L168 58 L188 54"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Clean answer */}
                  <path
                    className="ai2p-how-signal-clear"
                    d="M188 54 L280 54"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle className="ai2p-how-signal-dot" cx="106" cy="44" r="3.5" />
                  <circle className="ai2p-how-signal-dot" cx="188" cy="54" r="3.5" />
                  <circle className="ai2p-how-signal-end" cx="272" cy="54" r="5" />
                  {/* Stage ticks */}
                  <path className="ai2p-how-signal-tick" d="M64 98 V108" />
                  <path className="ai2p-how-signal-tick" d="M148 98 V108" />
                  <path className="ai2p-how-signal-tick" d="M232 98 V108" />
                  <text x="52" y="118" className="ai2p-how-signal-stage">
                    01
                  </text>
                  <text x="136" y="118" className="ai2p-how-signal-stage">
                    02
                  </text>
                  <text x="220" y="118" className="ai2p-how-signal-stage">
                    03
                  </text>
                </svg>
              </div>
            </div>

            <div className="ai2p-steps">
              <article className="ai2p-step">
                <span className="ai2p-step-rail" aria-hidden="true" />
                <span className="ai2p-step-num">01</span>
                <h3>Share access</h3>
                <p>Read-only repo and staging. If we cannot see it, we cannot judge it.</p>
              </article>
              <article className="ai2p-step">
                <span className="ai2p-step-rail" aria-hidden="true" />
                <span className="ai2p-step-num">02</span>
                <h3>We go through it</h3>
                <p>
                  Architecture, security, ops, and scale. Humans catch what tooling
                  skims past.
                </p>
              </article>
              <article className="ai2p-step ai2p-step-end">
                <span className="ai2p-step-rail" aria-hidden="true" />
                <span className="ai2p-step-num">03</span>
                <h3>You get the truth, written down</h3>
                <p>
                  What will hold at launch, what will not, and the order to fix it.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="ai2p-section ai2p-section-light ai2p-section-grain"
          id="preview"
          aria-labelledby="preview-title"
        >
          <div className="ai2p-wrap ai2p-section-inner">
            <p className="ai2p-eyebrow ai2p-kicker">The deliverable</p>
            <h2 className="ai2p-h2" id="preview-title">
              Written so you can <span className="ai2p-em">decide</span>, not decode.
            </h2>
            <p className="ai2p-capsule">
              Ranked findings, a short plain-English snapshot, and a Now / Next path.
              Enough clarity to know if you are ready to launch.
            </p>
            <AssessmentPreview />
          </div>
        </section>

        {/* Fit section — parked for now
        <section className="ai2p-section ai2p-section-light" id="fit" aria-labelledby="fit-title">
          <div className="ai2p-wrap">
            <p className="ai2p-eyebrow ai2p-kicker">Fit</p>
            <h2 className="ai2p-h2" id="fit-title">
              If you are about to put this in front of people
            </h2>
            <div className="ai2p-fit-grid">
              <article className="ai2p-fit-card">
                <h3>Good fit</h3>
                <ul>
                  <li>You have a working product or serious prototype</li>
                  <li>Users, customers, or investors are next</li>
                  <li>You need to know the foundation will survive launch</li>
                  <li>You can share read-only repo or staging access</li>
                </ul>
              </article>
              <article className="ai2p-fit-card not">
                <h3>Not a fit</h3>
                <ul>
                  <li>You will not share repo or staging access</li>
                </ul>
              </article>
            </div>
          </div>
        </section>
        */}

        <section className="ai2p-section ai2p-section-faq" id="faq" aria-labelledby="faq-title">
          <div className="ai2p-faq-glow" aria-hidden="true" />
          <div className="ai2p-wrap">
            <p className="ai2p-eyebrow ai2p-kicker">FAQ</p>
            <h2 className="ai2p-h2" id="faq-title">
              Quick answers
            </h2>
            <div className="ai2p-faq">
              <details>
                <summary>Will you rewrite my product?</summary>
                <p>
                  No. We tell you what is sound and what is not. We keep what holds. Big
                  rewrites only when the current foundation cannot carry a real launch.
                </p>
              </details>
              <details>
                <summary>Can I just have AI review it again?</summary>
                <p>
                  You can, and many founders already have. Tools still miss structural
                  problems. That is why senior engineers lead, with agents as support.
                </p>
              </details>
              <details>
                <summary>How does pricing work?</summary>
                <p>
                  Paid assessment. We quote after we see your repo, stage, and stack. No
                  surprise scope after the fact.
                </p>
              </details>
              <details>
                <summary>What do I walk away with?</summary>
                <p>
                  A written assessment: what will hold at launch, what has to change first,
                  and a practical order of work.
                </p>
              </details>
              <details>
                <summary>Who does the work?</summary>
                <p>
                  Senior engineers at 12 VENTURES. Agents speed the pass. People own the
                  judgment.
                </p>
              </details>
              <details>
                <summary>Do I have to change my stack?</summary>
                <p>
                  Usually no. If it fits, we say so. We only push a major change when the
                  current setup will not survive launch or growth.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="ai2p-section ai2p-section-close" id="close" aria-labelledby="close-title">
          <div className="ai2p-close-glow" aria-hidden="true" />
          <div className="ai2p-wrap">
            <p className="ai2p-eyebrow ai2p-kicker">Next step</p>
            <h2 className="ai2p-h2" id="close-title">
              Find out if you are <span className="ai2p-em">actually ready</span>.
            </h2>
            <p className="ai2p-lede">
              Request an assessment. We will look at your product, scope the work, and
              send a straight quote before anything starts.
            </p>
            <AssessmentForm />
          </div>
        </section>
      </main>

      <footer className="ai2p-footer">
        <div className="ai2p-wrap">
          <p className="ai2p-eyebrow">12 VENTURES</p>
          <p>AI 2 Production · production-readiness assessments</p>
        </div>
      </footer>

      {cue.present ? (
        <button
          type="button"
          className={`ai2p-scroll-cue${cue.visible ? ' is-visible' : ''}`}
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

export default Ai2pLandingPage;
