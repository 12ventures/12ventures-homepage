import React from 'react';

const SMS = [
  {
    from: 'agent' as const,
    text: 'Hi. We have tomorrow at 8:15 AM if you want it. I can hold that for you.',
  },
  { from: 'patient' as const, text: 'Yes please, that works' },
  {
    from: 'agent' as const,
    text: "You're set for 8:15 tomorrow. Text me if you need to move it.",
  },
];

const TRANSCRIPT = [
  { who: 'Agent', text: "Hi, you've reached after-hours access. How can I help?" },
  { who: 'Caller', text: 'I need to cancel Thursday and find something sooner.' },
  { who: 'Agent', text: "I can cancel Thursday and look for an earlier time. What's a good window?" },
];

const dStyle = (n: number): React.CSSProperties =>
  ({ ['--d' as string]: n }) as React.CSSProperties;

/**
 * Coded phone pair. Intro is CSS-only: opacity fades, one sliding wave strip.
 * No per-frame JS, no IntersectionObserver, no N-bar scaleY loop.
 */
const PhoneShowcase: React.FC = () => (
  <div className="hs-phones hs-phones--full" aria-label="Example patient text thread and live voice call">
    <p className="hs-sr">
      Example text thread: the access agent offers tomorrow at 8:15 AM, the patient
      accepts, and the agent confirms the visit. Example voice call: the after-hours
      agent greets the caller, cancels Thursday, and asks for a sooner window.
    </p>

    <figure className="hs-phone hs-phone-sms">
      <figcaption className="hs-phone-cap">Text</figcaption>
      <div className="hs-phone-bezel" aria-hidden="true">
        <div className="hs-phone-screen">
          <header className="hs-phone-bar">
            <span className="hs-phone-bar-title">Access line</span>
            <span className="hs-phone-bar-meta">Now</span>
          </header>
          <div className="hs-sms">
            {SMS.map((msg, i) => (
              <p key={i} className={`hs-bubble hs-bubble-${msg.from}`} style={dStyle(i)}>
                {msg.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </figure>

    <figure className="hs-phone hs-phone-voice">
      <figcaption className="hs-phone-cap">Voice</figcaption>
      <div className="hs-phone-bezel" aria-hidden="true">
        <div className="hs-phone-screen hs-phone-screen-dark">
          <header className="hs-call-head">
            <span className="hs-call-live">
              <span className="hs-board-pulse" />
              Live transcription
            </span>
            <strong>Inbound caller</strong>
            <span className="hs-call-time">4:51</span>
          </header>
          <div className="hs-wave" aria-hidden="true">
            <span className="hs-wave-strip" />
          </div>
          <ol className="hs-transcript">
            {TRANSCRIPT.map((line, i) => (
              <li key={i} className="hs-transcript-line" style={dStyle(i)}>
                <span>{line.who}</span>
                {line.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  </div>
);

export default PhoneShowcase;
