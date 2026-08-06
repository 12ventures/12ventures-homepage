import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

const ACCESS_CODE = 'icon12';
/** Shared across /noci hub + all Noci deliverable pages for this browser session. */
const SESSION_KEY = 'noci_deliverables_auth';

interface NociPasswordGateProps {
  children: React.ReactNode;
}

const NociPasswordGate: React.FC<NociPasswordGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true',
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toLowerCase() === ACCESS_CODE) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: '#151219',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl px-6 py-5 ${shaking ? 'animate-[noci-shake_0.4s_ease]' : ''}`}
        style={{
          background: '#1D1A23',
          border: '1px solid #312A38',
          boxShadow: '0 1px 2px #0000003a, 0 10px 34px #00000040',
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase mb-0.5"
              style={{
                color: '#CA8CAD',
                fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                letterSpacing: '0.18em',
              }}
            >
              NociApp
            </p>
            <h1
              className="text-xl leading-tight"
              style={{
                color: '#ECE6EE',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              Readiness documents
            </h1>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: '#CA8CAD18',
              border: '1px solid #CA8CAD40',
            }}
          >
            <Lock className="w-4 h-4" style={{ color: '#CA8CAD' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="password"
            autoFocus
            value={value}
            placeholder="Enter access code"
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{
              color: '#ECE6EE',
              background: error ? '#E36A6220' : '#241F2B',
              border: error ? '1px solid #E36A6266' : '1px solid #3E3646',
              transition: 'background 0.2s, border 0.2s',
            }}
          />
          {error && (
            <p className="text-xs" style={{ color: '#E36A62' }}>
              Incorrect code. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{
              background: '#CA8CAD',
              color: '#151219',
            }}
          >
            <span>Enter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes noci-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default NociPasswordGate;
