import React from 'react';

const QUESTION = "Patient reports pain 7/10, 3 hrs since last dose. What's next?";
const RESULT_TEXT = 'Correct. Reassess before repeating an opioid dose.';
const OPTIONS = [
  { label: 'Reassess vitals', correct: true },
  { label: 'Repeat the dose', correct: false },
  { label: 'Chart it, move on', correct: false },
];

const DOT_COUNT = 7;
const ACTIVE_DOT = 2;

// Hand-authored confetti burst: small spread of directions/colors/timing so
// it reads as a natural scatter without any runtime randomness.
const CONFETTI = [
  { dx: -50, dy: -55, rot: -35, delay: 0, color: '#9ec5bf' },
  { dx: 46, dy: -60, rot: 40, delay: 40, color: '#ffd76a' },
  { dx: -74, dy: -22, rot: -70, delay: 80, color: '#e8846b' },
  { dx: 72, dy: -26, rot: 65, delay: 20, color: '#2f6f6a' },
  { dx: -24, dy: -64, rot: -15, delay: 110, color: '#ffb84d' },
  { dx: 26, dy: -66, rot: 20, delay: 60, color: '#9ec5bf' },
  { dx: -62, dy: -40, rot: -50, delay: 140, color: '#ffd76a' },
  { dx: 60, dy: -38, rot: 55, delay: 10, color: '#e8846b' },
  { dx: -34, dy: -32, rot: -80, delay: 170, color: '#2f6f6a' },
  { dx: 36, dy: -34, rot: 75, delay: 90, color: '#ffb84d' },
];

// —— Reveal timeline (ms), one source of truth for the whole sequence ——
// (the phone itself fades/grows in via a CSS transition-delay of 0.9s,
// set alongside the voice page's phones in healthsystems.css)
const TOPBAR_DELAY = 1200;
const TITLE_DELAY = 1320;
const TYPE_START = 1480;
const CHAR_STEP = 14;
const TYPE_END = TYPE_START + QUESTION.length * CHAR_STEP;
const AUDIO_DURATION = TYPE_END - TYPE_START + 480;
const OPTION_STEP = 220;
const OPTIONS_START = TYPE_END + 220;
const OPTIONS_DONE = OPTIONS_START + (OPTIONS.length - 1) * OPTION_STEP + 260;
const SELECT_DELAY = OPTIONS_DONE + 220;
const SELECT_DURATION = 420;
const RESULT_DELAY = SELECT_DELAY + SELECT_DURATION + 140;
const REWARD_DELAY = RESULT_DELAY + 160;
const NEXT_DELAY = RESULT_DELAY + 300;

const delayStyle = (...msValues: number[]): React.CSSProperties => ({
  animationDelay: msValues.map((ms) => `${ms}ms`).join(', '),
});

const confettiStyle = (piece: (typeof CONFETTI)[number]): React.CSSProperties =>
  ({
    '--dx': `${piece.dx}px`,
    '--dy': `${piece.dy}px`,
    '--rot': `${piece.rot}deg`,
    background: piece.color,
    animationDelay: `${REWARD_DELAY + piece.delay}ms`,
  }) as React.CSSProperties;

const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 8.4 6.4 11 12.5 4.8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0l1.9 5.1L15 7l-5.1 1.9L8 14l-1.9-5.1L1 7l5.1-1.9L8 0z" />
  </svg>
);

/**
 * Coded single-device visual: a photo-backed onboarding module slide with an
 * adaptive competency check. Question types in letter by letter (narration
 * cue pulses alongside it), answer options reveal one at a time, the correct
 * one animates into a selected state, and a small points reward pops in as
 * positive gamified feedback. CSS-only motion: opacity/transform keyframes
 * driven by per-element animation-delay, no per-frame JS, no scroll observer.
 */
const TrainingShowcase: React.FC = () => (
  <div className="hs-phones hs-phones--full" aria-label="Example onboarding module slide with an adaptive competency check">
    <p className="hs-sr">
      Example onboarding module slide: the module narrates a pain reassessment
      scenario while the question types onto the screen, the learner selects
      reassessing vitals, the module confirms it was correct, and awards 50
      points.
    </p>

    <figure className="hs-phone hs-phone-training">
      <figcaption className="hs-phone-cap">Onboarding module</figcaption>
      <div className="hs-phone-bezel" aria-hidden="true">
        <div className="hs-phone-screen hs-phone-screen-photo">
          <img className="hs-quiz-bg" src="/healthsystems/training-quiz-bg.png" alt="" />
          <div className="hs-quiz-scrim" />

          <div className="hs-quiz-top" style={delayStyle(TOPBAR_DELAY)}>
            <span
              className="hs-quiz-audio"
              style={{ animationDelay: `${TYPE_START}ms`, animationDuration: `${AUDIO_DURATION}ms` }}
            >
              <span className="hs-quiz-audio-bar" />
              <span className="hs-quiz-audio-bar" />
              <span className="hs-quiz-audio-bar" />
            </span>
            <span className="hs-quiz-dots">
              {Array.from({ length: DOT_COUNT }).map((_, i) => (
                <span key={i} className={`hs-quiz-dot${i === ACTIVE_DOT ? ' is-active' : ''}`} />
              ))}
            </span>
            <span className="hs-quiz-score">92%</span>
          </div>

          <p className="hs-quiz-title" style={delayStyle(TITLE_DELAY)}>
            Module 3 · Pain management
          </p>

          <div className="hs-quiz-card">
            <p className="hs-quiz-q">
              {Array.from(QUESTION).map((ch, i) => (
                <span key={i} className="hs-type-char" style={delayStyle(TYPE_START + i * CHAR_STEP)}>
                  {ch}
                </span>
              ))}
            </p>
            <div className="hs-quiz-options">
              {OPTIONS.map((opt, i) => (
                <span
                  key={opt.label}
                  className={`hs-quiz-option${opt.correct ? ' is-correct' : ''}`}
                  style={
                    opt.correct
                      ? delayStyle(OPTIONS_START + i * OPTION_STEP, SELECT_DELAY, SELECT_DELAY)
                      : delayStyle(OPTIONS_START + i * OPTION_STEP)
                  }
                >
                  <span
                    className="hs-quiz-option-dot"
                    style={opt.correct ? delayStyle(SELECT_DELAY) : undefined}
                  >
                    {opt.correct ? (
                      <span className="hs-quiz-option-dot-fill" style={delayStyle(SELECT_DELAY)} />
                    ) : null}
                  </span>
                  {opt.label}
                </span>
              ))}
            </div>
            <p className="hs-quiz-result" style={delayStyle(RESULT_DELAY)}>
              <CheckIcon />
              {RESULT_TEXT}
            </p>
            <div className="hs-quiz-next-row" style={delayStyle(NEXT_DELAY)}>
              <span className="hs-quiz-next">Next</span>
            </div>
          </div>

          <span className="hs-quiz-confetti" aria-hidden="true">
            {CONFETTI.map((piece, i) => (
              <span key={i} className="hs-confetti-piece" style={confettiStyle(piece)} />
            ))}
          </span>
          <span className="hs-quiz-reward" style={delayStyle(REWARD_DELAY)}>
            <StarIcon />
            +50 <span className="hs-quiz-reward-unit">pts</span>
          </span>
        </div>
      </div>
    </figure>
  </div>
);

export default TrainingShowcase;
