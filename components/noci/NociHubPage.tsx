import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Presentation, SearchCode } from 'lucide-react';
import NociPasswordGate from './NociPasswordGate';

const NociHubPage: React.FC = () => {
  useEffect(() => {
    document.title = 'NOCI x 12 VENTURES';
  }, []);

  return (
    <NociPasswordGate>
      <div className="noci-hub">
        <div className="noci-hub__glow" aria-hidden="true" />

        <header className="noci-hub__header noci-hub__reveal noci-hub__reveal--1">
          <h1 className="noci-hub__title">NOCI x 12 VENTURES</h1>
        </header>

        <main className="noci-hub__main">
          <div className="noci-hub__grid">
            <Link
              to="/noci/executive-summary"
              className="noci-hub__card noci-hub__reveal noci-hub__reveal--2"
            >
              <div className="noci-hub__card-icon" aria-hidden="true">
                <Presentation className="w-5 h-5" />
              </div>
              <p className="noci-hub__card-kicker">For discussion</p>
              <h2 className="noci-hub__card-title">Executive summary</h2>
              <p className="noci-hub__card-copy">
                Short briefing: scoring, snapshot, and findings counts.
              </p>
              <span className="noci-hub__card-cta">
                Open <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              to="/noci/technical-assessment"
              className="noci-hub__card noci-hub__reveal noci-hub__reveal--3"
            >
              <div className="noci-hub__card-icon" aria-hidden="true">
                <SearchCode className="w-5 h-5" />
              </div>
              <p className="noci-hub__card-kicker">Full review</p>
              <h2 className="noci-hub__card-title">Technical assessment</h2>
              <p className="noci-hub__card-copy">
                Full findings register with severity and verification detail.
              </p>
              <span className="noci-hub__card-cta">
                Open <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </main>

        <style>{`
          .noci-hub {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
            background: #151219;
            color: #ECE6EE;
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
          }

          .noci-hub__glow {
            pointer-events: none;
            position: absolute;
            inset: -20% 10% auto;
            height: 55%;
            background:
              radial-gradient(ellipse 55% 45% at 50% 0%, rgba(202, 140, 173, 0.16) 0%, transparent 70%);
            animation: noci-hub-glow 6s ease-in-out infinite alternate;
          }

          .noci-hub__header {
            position: relative;
            border-bottom: 1px solid #3E3646;
            background: rgba(29, 26, 35, 0.92);
            backdrop-filter: blur(12px);
          }

          .noci-hub__header::before {
            content: "";
            position: absolute;
            inset: 0 0 auto;
            height: 3px;
            background: linear-gradient(90deg, #CA8CAD, #A96A8C 55%, transparent);
          }

          .noci-hub__title {
            max-width: 960px;
            margin: 0 auto;
            padding: 56px 24px 40px;
            font-family: Georgia, "Times New Roman", serif;
            font-weight: 600;
            font-size: clamp(2.1rem, 5vw, 3.4rem);
            letter-spacing: -0.015em;
            line-height: 1.08;
          }

          .noci-hub__main {
            position: relative;
            max-width: 960px;
            margin: 0 auto;
            padding: 40px 24px 72px;
          }

          .noci-hub__grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .noci-hub__card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 240px;
            padding: 28px 24px;
            border-radius: 16px;
            text-decoration: none;
            color: inherit;
            background: linear-gradient(165deg, #221e2a 0%, #1D1A23 55%, #19161f 100%);
            border: 1px solid #3E3646;
            box-shadow: 0 1px 2px #0000003a, 0 12px 36px #00000038;
            transition:
              transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.35s ease,
              box-shadow 0.35s ease,
              background 0.35s ease;
          }

          .noci-hub__card::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            opacity: 0;
            background: linear-gradient(135deg, rgba(202, 140, 173, 0.12), transparent 48%);
            transition: opacity 0.35s ease;
          }

          .noci-hub__card:hover {
            transform: translateY(-6px);
            border-color: rgba(202, 140, 173, 0.55);
            box-shadow:
              0 0 0 1px rgba(202, 140, 173, 0.12),
              0 18px 48px rgba(0, 0, 0, 0.45),
              0 0 40px rgba(202, 140, 173, 0.1);
          }

          .noci-hub__card:hover::after {
            opacity: 1;
          }

          .noci-hub__card:hover .noci-hub__card-icon {
            transform: scale(1.06);
            background: rgba(202, 140, 173, 0.18);
            border-color: rgba(202, 140, 173, 0.5);
          }

          .noci-hub__card:hover .noci-hub__card-cta {
            gap: 10px;
            color: #E8C4D8;
          }

          .noci-hub__card-icon {
            position: absolute;
            top: 22px;
            right: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            color: #CA8CAD;
            background: rgba(202, 140, 173, 0.1);
            border: 1px solid rgba(202, 140, 173, 0.28);
            transition: transform 0.35s ease, background 0.35s ease, border-color 0.35s ease;
          }

          .noci-hub__card-kicker {
            margin: 0;
            padding-right: 64px;
            font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #7E7488;
          }

          .noci-hub__card-title {
            margin: 10px 0 12px;
            padding-right: 64px;
            font-family: Georgia, "Times New Roman", serif;
            font-weight: 600;
            font-size: 1.25rem;
            letter-spacing: -0.01em;
            color: #ECE6EE;
          }

          .noci-hub__card-copy {
            margin: 0 0 auto;
            max-width: 34ch;
            font-size: 14px;
            line-height: 1.58;
            color: #B7AEBE;
          }

          .noci-hub__card-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 22px;
            font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #CA8CAD;
            transition: gap 0.3s ease, color 0.3s ease;
          }

          .noci-hub__reveal {
            opacity: 0;
            transform: translateY(18px);
            animation: noci-hub-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .noci-hub__reveal--1 { animation-delay: 0.05s; }
          .noci-hub__reveal--2 { animation-delay: 0.18s; }
          .noci-hub__reveal--3 { animation-delay: 0.3s; }

          @keyframes noci-hub-in {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes noci-hub-glow {
            from { opacity: 0.7; transform: scale(1); }
            to { opacity: 1; transform: scale(1.04); }
          }

          @media (max-width: 720px) {
            .noci-hub__grid {
              grid-template-columns: 1fr;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .noci-hub__reveal {
              opacity: 1;
              transform: none;
              animation: none;
            }
            .noci-hub__glow,
            .noci-hub__card,
            .noci-hub__card-icon,
            .noci-hub__card-cta {
              animation: none;
              transition: none;
            }
          }
        `}</style>
      </div>
    </NociPasswordGate>
  );
};

export default NociHubPage;
