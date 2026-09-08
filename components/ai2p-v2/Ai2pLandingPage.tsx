import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './ai2p.css';
import MediaSlot from './MediaSlot';
import AssessmentPreview from './AssessmentPreview';
import AssessmentForm from './AssessmentForm';
import ReadinessBoard from './ReadinessBoard';
import HeroReadyPanel from './HeroReadyPanel';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';

const PAGE_SECTIONS = [
  'why',
  'pain',
  'case',
  // 'fix',
  'foundation',
  'point',
  'how',
  'close',
] as const;

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
  if (index < 0) return document.querySelector<HTMLElement>('.ai2p-v2-hero');
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

    let link = document.querySelector<HTMLLinkElement>('link[data-ai2p-v2-font]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      link.setAttribute('data-ai2p-v2-font', '1');
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

  useEffect(() => {
    const root = document.querySelector('.ai2p-v2');
    const scopes = Array.from(document.querySelectorAll<HTMLElement>('.ai2p-v2-reveal-scope'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealAll = () => {
      root?.classList.add('is-page-ready');
      scopes.forEach((scope) => scope.classList.add('is-revealed'));
    };

    if (reduce) {
      revealAll();
      return;
    }

    const readyFrame = window.requestAnimationFrame(() => {
      root?.classList.add('is-page-ready');
      document.querySelector('.ai2p-v2-hero')?.classList.add('is-revealed');
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
      if (scope.classList.contains('ai2p-v2-hero')) return;
      io.observe(scope);
    });

    return () => {
      window.cancelAnimationFrame(readyFrame);
      io.disconnect();
    };
  }, []);

  const scrollToRequest = () => {
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // const scrollToFix = () => {
  //   document.getElementById('fix')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // };

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
    <div className="ai2p-v2">
      <nav className="ai2p-v2-nav" aria-label="Primary">
        <div className="ai2p-v2-wrap ai2p-v2-nav-inner">
          <Link className="ai2p-v2-nav-brand" to="/">
            12 VENTURES
          </Link>
          <button type="button" className="ai2p-v2-btn ai2p-v2-btn-primary ai2p-v2-nav-cta" onClick={scrollToRequest}>
            Let&rsquo;s connect
          </button>
        </div>
      </nav>

      <header className="ai2p-v2-hero ai2p-v2-reveal-scope">
        <div className="ai2p-v2-hero-media" aria-hidden="true">
          <MediaSlot
            src="/ai2p/hero-facade.png"
            label="hero-facade"
            ratio="fill"
            alt=""
          />
        </div>
        <div className="ai2p-v2-hero-scrim" aria-hidden="true" />
        <div className="ai2p-v2-hero-glow" aria-hidden="true" />
        <div className="ai2p-v2-hero-rail">
          <div className="ai2p-v2-hero-content">
            <p className="ai2p-v2-hero-brand ai2p-v2-r" style={dStyle(0)}>
              AI 2 Production
            </p>
            <h1 className="ai2p-v2-r" style={dStyle(1)}>
              Launch with confidence in{' '}
              <span className="ai2p-v2-em">what you already built</span>.
            </h1>
            <p className="ai2p-v2-hero-dek ai2p-v2-r" style={dStyle(2)}>
              We dig into what you built, tell you what will hold under real users,
              and give you a clear path to launch and grow without guessing.
            </p>
            <div className="ai2p-v2-hero-actions ai2p-v2-r" style={dStyle(3)}>
              <button type="button" className="ai2p-v2-btn ai2p-v2-btn-primary" onClick={scrollToRequest}>
                Start the conversation
              </button>
              {/* <button type="button" className="ai2p-v2-btn ai2p-v2-btn-ghost" onClick={scrollToFix}>
                See what we fix
              </button> */}
            </div>
          </div>
          <div className="ai2p-v2-hero-panel">
            <HeroReadyPanel />
          </div>
        </div>
      </header>

      <main>
        <section
          className="ai2p-v2-section ai2p-v2-section-grain ai2p-v2-section-why ai2p-v2-reveal-scope"
          id="why"
          aria-labelledby="why-title"
        >
          <div className="ai2p-v2-why-glow" aria-hidden="true" />
          <div className="ai2p-v2-wrap ai2p-v2-section-inner">
            <div className="ai2p-v2-split">
              <div className="ai2p-v2-split-copy">
                <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
                  Why 12 VENTURES
                </p>
                <h2 className="ai2p-v2-h2 ai2p-v2-r" id="why-title" style={dStyle(1)}>
                  Engineers who&rsquo;ve <span className="ai2p-v2-em">done this before</span>.
                </h2>
                <p className="ai2p-v2-capsule ai2p-v2-r" style={dStyle(2)}>
                  Small teams. Senior people. Real ownership. Founders and engineers with
                  multiple acquisitions, who have spent careers taking early products to
                  production. We lead every assessment. Agents help. People own the
                  judgment.
                </p>
                <p className="ai2p-v2-capsule ai2p-v2-r" style={dStyle(3)}>
                  When a build needs more hands, a partner network of 200+ engineers
                  scales from first line of code through unicorn.
                </p>
              </div>
              <div className="ai2p-v2-why-grid ai2p-v2-r-media" style={dStyle(2)}>
                <div className="ai2p-v2-why-card">
                  <strong>22 billion+</strong>
                  <span>
                    monthly impressions. A mobile ad platform we scaled from a standing
                    start.
                  </span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>A straight line to IPO</strong>
                  <span>
                    The API and services platform we built carried a company all the way
                    there.
                  </span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>3,500+ high schools</strong>
                  <span>Gaming and esports platforms running live in classrooms across the US.</span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>Inside real hospitals</strong>
                  <span>Production AI and agentic systems running in live clinical workflows, right now.</span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>NASA. CMS. HHS.</strong>
                  <span>Federal-grade systems built to survive that level of scrutiny.</span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>Social platforms at media scale</strong>
                  <span>Networks built for audiences owned by major entertainment brands.</span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>Marketplaces for creative industries</strong>
                  <span>Platform engineering behind interior design and creative commerce.</span>
                </div>
                <div className="ai2p-v2-why-card">
                  <strong>15+ years, rooms that mattered</strong>
                  <span>Advising governments, unicorns, and VCs on technical leadership.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="ai2p-v2-section ai2p-v2-reveal-scope"
          id="pain"
          aria-labelledby="pain-title"
        >
          <div className="ai2p-v2-wrap ai2p-v2-split ai2p-v2-split-pain">
            <div className="ai2p-v2-split-copy">
              <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
                The problem
              </p>
              <h2 className="ai2p-v2-h2 ai2p-v2-r" id="pain-title" style={dStyle(1)}>
                Building got easy. <span className="ai2p-v2-em">Production did not</span>.
              </h2>
              <p className="ai2p-v2-lede ai2p-v2-r" style={dStyle(2)}>
                AI can turn an idea into working software fast. Real customers, real data,
                and real consequences change the engineering. Reliability still has to be
                earned.
              </p>
            </div>
            <div className="ai2p-v2-pain-quotes">
              <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(3)}>
                Does this sound familiar?
              </p>
              <ul className="ai2p-v2-quote-list ai2p-v2-r" style={dStyle(4)}>
                <li>It works locally, but we&rsquo;re afraid to launch.</li>
                <li>Cursor built most of it. Nobody fully understands the architecture.</li>
                <li>Every fix breaks something else.</li>
                <li>Security, auth, payments, and data handling weren&rsquo;t designed systematically.</li>
                <li>We need real engineers before customers or investors see this.</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="ai2p-v2-section ai2p-v2-section-light ai2p-v2-reveal-scope"
          id="case"
          aria-labelledby="case-title"
        >
          <div className="ai2p-v2-wrap ai2p-v2-split">
            <div className="ai2p-v2-split-copy">
              <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
                Case study
              </p>
              <h2 className="ai2p-v2-h2 ai2p-v2-r" id="case-title" style={dStyle(1)}>
                33 issues, before it was safe to <span className="ai2p-v2-em-uline">launch</span>.
              </h2>
              <p className="ai2p-v2-capsule ai2p-v2-r" style={dStyle(2)}>
                An AI-built commerce platform. The founder had already spent heavily on AI
                tools and run hard automated reviews. The demo looked sharp. Underneath, we
                found 33 production-readiness issues across architecture, security,
                reliability, infrastructure, and code quality, 16 of them critical:
                severe enough on their own to sink a launch the moment users showed up.
              </p>
              <p className="ai2p-v2-capsule ai2p-v2-r" style={dStyle(3)}>
                We also run production AI live today inside Southern California health
                systems. This is not freelance code cleanup. It is production engineering
                for systems that have to hold.
              </p>
            </div>
            <div className="ai2p-v2-split-media ai2p-v2-r-media" style={dStyle(2)}>
              <MediaSlot
                src="/ai2p/case-surface-v2.png"
                label="case-surface"
                ratio="4x5"
                alt="Quiet fulfillment corridor with a subtly stressed shelving upright, no people or branding"
              />
            </div>
          </div>
        </section>

        {/* <section
          className="ai2p-v2-section ai2p-v2-reveal-scope"
          id="fix"
          aria-labelledby="fix-title"
        >
          <div className="ai2p-v2-wrap">
            <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
              What we fix
            </p>
            <h2 className="ai2p-v2-h2 ai2p-v2-r" id="fix-title" style={dStyle(1)}>
              The engineering surface area you <span className="ai2p-v2-em">don&rsquo;t see</span>{' '}
              until it breaks.
            </h2>
            <p className="ai2p-v2-lede ai2p-v2-r" style={dStyle(2)}>
              Not vague talk of &ldquo;engineering.&rdquo; The specific systems that decide
              whether a launch survives contact with real users.
            </p>
            <ul className="ai2p-v2-fix-grid ai2p-v2-r" style={dStyle(3)}>
              <li>Authentication &amp; authorization</li>
              <li>Secrets &amp; credential management</li>
              <li>Database architecture &amp; migrations</li>
              <li>API reliability</li>
              <li>Payments &amp; transactions</li>
              <li>CI/CD &amp; automated testing</li>
              <li>Cloud infrastructure</li>
              <li>Logging &amp; monitoring</li>
              <li>Performance &amp; scalability</li>
              <li>Security vulnerabilities</li>
              <li>Dependency management</li>
              <li>Error handling &amp; recovery</li>
            </ul>
          </div>
        </section> */}

        <section
          className="ai2p-v2-section ai2p-v2-section-crack ai2p-v2-reveal-scope"
          id="foundation"
          aria-labelledby="foundation-title"
        >
          <div className="ai2p-v2-section-crack-media" aria-hidden="true">
            <MediaSlot
              src="/ai2p/agents-blindspot.png"
              label="agents-blindspot"
              ratio="fill"
              alt=""
            />
          </div>
          <div className="ai2p-v2-section-crack-scrim" aria-hidden="true" />
          <div className="ai2p-v2-wrap ai2p-v2-section-crack-inner">
            <div className="ai2p-v2-split">
              <div className="ai2p-v2-split-copy">
                <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
                  The offer
                </p>
                <h2 className="ai2p-v2-h2 ai2p-v2-r" id="foundation-title" style={dStyle(1)}>
                  A readiness assessment and execution that let you{' '}
                  <span className="ai2p-v2-em">launch with confidence</span>.
                </h2>
                <p className="ai2p-v2-capsule ai2p-v2-r" style={dStyle(2)}>
                  Not sure how far you are from production? We start with what exists and
                  write down what can stay, what creates risk, and what happens next. Then
                  we fix it.
                </p>
                <p className="ai2p-v2-categories ai2p-v2-r" style={dStyle(3)}>
                  Architecture · Security · Reliability · Scalability · Data · Testing ·
                  DevOps · Observability · Code Quality
                </p>
                <p className="ai2p-v2-funnel ai2p-v2-r" style={dStyle(3)}>
                  Assessment → Remediation → Production
                </p>
              </div>
              <div className="ai2p-v2-split-media ai2p-v2-r-media" style={dStyle(2)}>
                <ReadinessBoard />
              </div>
            </div>
            <p className="ai2p-v2-capsule ai2p-v2-r ai2p-v2-foundation-deliverable" style={dStyle(4)}>
              You get a Prioritized Production Readiness Report: critical risks, a
              remediation roadmap, estimated effort for each fix, and a clear launch
              recommendation, written so you can decide, not decode.
            </p>
            <div className="ai2p-v2-r-media" style={dStyle(5)}>
              <AssessmentPreview />
            </div>
          </div>
        </section>

        <section
          className="ai2p-v2-section ai2p-v2-section-cutaway ai2p-v2-reveal-scope"
          id="point"
          aria-labelledby="point-title"
        >
          <div className="ai2p-v2-wrap">
            <div className="ai2p-v2-split ai2p-v2-split-rev">
              <div className="ai2p-v2-split-copy">
                <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
                  The point
                </p>
                <h2 className="ai2p-v2-h2 ai2p-v2-r" id="point-title" style={dStyle(1)}>
                  From &ldquo;it works&rdquo; to &ldquo;we can <span className="ai2p-v2-em">build on it</span>.&rdquo;
                </h2>
                <p className="ai2p-v2-capsule ai2p-v2-r" style={dStyle(2)}>
                  We start with what exists. Keep what holds. Change what creates risk.
                  You are buying the confidence to launch, not more developers.
                </p>
              </div>
              <div className="ai2p-v2-split-media ai2p-v2-r-media" style={dStyle(2)}>
                <MediaSlot
                  src="/ai2p/cutaway-foundation.png"
                  label="cutaway-foundation"
                  ratio="3x2"
                  alt="Architectural cutaway showing finished facade versus exposed structure"
                />
              </div>
            </div>

            <div className="ai2p-v2-transform-grid ai2p-v2-r" style={dStyle(3)}>
              <div className="ai2p-v2-transform-card before">
                <span className="ai2p-v2-transform-label">Before</span>
                <ul>
                  <li>AI-built MVP</li>
                  <li>Works on the happy path</li>
                  <li>Unknown architecture and security risk</li>
                  <li>Founder afraid to launch</li>
                </ul>
              </div>
              <div className="ai2p-v2-transform-arrow" aria-hidden="true">
                <span className="ai2p-v2-transform-label">12 VENTURES</span>
                <span className="ai2p-v2-transform-steps">Assess → Stabilize → Harden → Deploy</span>
              </div>
              <div className="ai2p-v2-transform-card after">
                <span className="ai2p-v2-transform-label">After</span>
                <ul>
                  <li>Production-ready system</li>
                  <li>Reliable and secure</li>
                  <li>Observable and scalable</li>
                  <li>Maintainable by your team</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          className="ai2p-v2-section ai2p-v2-section-grain ai2p-v2-section-how ai2p-v2-reveal-scope"
          id="how"
          aria-labelledby="how-title"
        >
          <div className="ai2p-v2-how-wash" aria-hidden="true" />
          <div className="ai2p-v2-wrap ai2p-v2-section-inner">
            <div className="ai2p-v2-how-head">
              <div className="ai2p-v2-how-copy">
                <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
                  How it works
                </p>
                <h2 className="ai2p-v2-h2 ai2p-v2-r" id="how-title" style={dStyle(1)}>
                  Assess. Stabilize. Harden. <span className="ai2p-v2-em">Deploy</span>.
                </h2>
                <p className="ai2p-v2-lede ai2p-v2-r" style={dStyle(2)}>
                  Senior people. Real ownership. We start with what exists and do not rip
                  out your stack unless there is a good reason.
                </p>
              </div>
              <div className="ai2p-v2-how-signal ai2p-v2-r-media" style={dStyle(2)} aria-hidden="true">
                <svg viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="8" y="18" className="ai2p-v2-how-signal-label">
                    noise
                  </text>
                  <text x="232" y="18" className="ai2p-v2-how-signal-label">
                    clear
                  </text>
                  <path
                    className="ai2p-v2-how-signal-noise"
                    d="M8 72 L22 48 L36 88 L50 40 L64 76 L78 52 L92 84 L106 44"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="ai2p-v2-how-signal-mid"
                    d="M106 44 L128 62 L148 50 L168 58 L188 54"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="ai2p-v2-how-signal-clear"
                    d="M188 54 L280 54"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle className="ai2p-v2-how-signal-dot" cx="106" cy="44" r="3.5" />
                  <circle className="ai2p-v2-how-signal-dot" cx="188" cy="54" r="3.5" />
                  <circle className="ai2p-v2-how-signal-end" cx="272" cy="54" r="5" />
                  <path className="ai2p-v2-how-signal-tick" d="M64 98 V108" />
                  <path className="ai2p-v2-how-signal-tick" d="M148 98 V108" />
                  <path className="ai2p-v2-how-signal-tick" d="M232 98 V108" />
                  <text x="52" y="118" className="ai2p-v2-how-signal-stage">
                    01
                  </text>
                  <text x="136" y="118" className="ai2p-v2-how-signal-stage">
                    02
                  </text>
                  <text x="220" y="118" className="ai2p-v2-how-signal-stage">
                    03
                  </text>
                </svg>
              </div>
            </div>

            <div className="ai2p-v2-steps ai2p-v2-steps-5">
              <article className="ai2p-v2-step ai2p-v2-r" style={dStyle(3)}>
                <span className="ai2p-v2-step-rail" aria-hidden="true" />
                <span className="ai2p-v2-step-num">01</span>
                <span className="ai2p-v2-step-time">Week 1</span>
                <h3>Assess</h3>
                <p>
                  Read-only repo and staging access. We score architecture, security, ops,
                  and scale, and write down what we find.
                </p>
              </article>
              <article className="ai2p-v2-step ai2p-v2-r" style={dStyle(4)}>
                <span className="ai2p-v2-step-rail" aria-hidden="true" />
                <span className="ai2p-v2-step-num">02</span>
                <span className="ai2p-v2-step-time">Weeks 1&ndash;3</span>
                <h3>Stabilize</h3>
                <p>
                  Fix what is actively fragile: broken paths, unsafe secrets, unreliable
                  data flows.
                </p>
              </article>
              <article className="ai2p-v2-step ai2p-v2-r" style={dStyle(5)}>
                <span className="ai2p-v2-step-rail" aria-hidden="true" />
                <span className="ai2p-v2-step-num">03</span>
                <span className="ai2p-v2-step-time">Weeks 2&ndash;6</span>
                <h3>Harden</h3>
                <p>
                  Close the gaps in auth, testing, monitoring, and deployment before real
                  users arrive.
                </p>
              </article>
              <article className="ai2p-v2-step ai2p-v2-step-end ai2p-v2-r" style={dStyle(6)}>
                <span className="ai2p-v2-step-rail" aria-hidden="true" />
                <span className="ai2p-v2-step-num">04</span>
                <span className="ai2p-v2-step-time">Weeks 4&ndash;12</span>
                <h3>Deploy</h3>
                <p>
                  You launch on a foundation that holds, with a written record of what
                  changed and why.
                </p>
              </article>
              <article className="ai2p-v2-step ai2p-v2-step-optional ai2p-v2-r" style={dStyle(7)}>
                <span className="ai2p-v2-step-rail" aria-hidden="true" />
                <span className="ai2p-v2-step-num">05</span>
                <span className="ai2p-v2-step-time">Optional &middot; ongoing</span>
                <h3>Ongoing support</h3>
                <p>
                  Want a team to keep owning it after launch? We staff ongoing engineering
                  support from our network of 200+ AI-fluent engineers.
                </p>
              </article>
            </div>
            <p className="ai2p-v2-steps-note ai2p-v2-r" style={dStyle(8)}>
              As fast as a week for the assessment alone, up to about 90 days for full
              stabilization through deployment, depending on scope.
            </p>
          </div>
        </section>

        <section
          className="ai2p-v2-section ai2p-v2-section-close ai2p-v2-reveal-scope"
          id="close"
          aria-labelledby="close-title"
        >
          <div className="ai2p-v2-close-glow" aria-hidden="true" />
          <div className="ai2p-v2-wrap">
            <p className="ai2p-v2-eyebrow ai2p-v2-kicker ai2p-v2-r" style={dStyle(0)}>
              Next step
            </p>
            <h2 className="ai2p-v2-h2 ai2p-v2-r" id="close-title" style={dStyle(1)}>
              You&rsquo;ve built something that works. Let&rsquo;s make sure it can{' '}
              <span className="ai2p-v2-em">grow</span>.
            </h2>
            <p className="ai2p-v2-lede ai2p-v2-r" style={dStyle(2)}>
              Tell us where the product is today. We will scope the work and send a
              straight quote before anything starts.
            </p>
            <div className="ai2p-v2-r" style={dStyle(3)}>
              <AssessmentForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="ai2p-v2-footer">
        <div className="ai2p-v2-wrap">
          <p className="ai2p-v2-eyebrow">12 VENTURES</p>
          <p>AI 2 Production · production-readiness assessments</p>
        </div>
      </footer>

      {cue.present ? (
        <button
          type="button"
          className={`ai2p-v2-scroll-cue${cue.visible ? ' is-visible' : ''}`}
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
