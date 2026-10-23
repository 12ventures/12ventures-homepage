import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import {
  checkSarhPasscode,
  getSarhPasscode,
  setSarhPasscode,
  SARH_PASSCODE_INVALID_EVENT,
} from '../../services/poseidonService';

// The passcode is checked by the dashboard API (DASHBOARD_PASSCODE on the
// backend), not stored in this bundle. Without it the API returns no data, and
// the gate re-locks whenever the API rejects the stored passcode.

const ERROR_MESSAGES = {
  wrong: 'Incorrect code. Try again.',
  throttled: 'Too many attempts. Wait a few minutes and try again.',
  unavailable: "Couldn't reach the dashboard. Check your connection and try again.",
} as const;

interface SarhPasswordGateProps {
  children: React.ReactNode;
  title?: string;
}

const SarhPasswordGate: React.FC<SarhPasswordGateProps> = ({ children, title = 'Production Dashboard' }) => {
  const [unlocked, setUnlocked] = useState(() => getSarhPasscode() !== '');
  const [value, setValue] = useState('');
  const [error, setError] = useState<keyof typeof ERROR_MESSAGES | null>(null);
  const [checking, setChecking] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const relock = () => setUnlocked(false);
    window.addEventListener(SARH_PASSCODE_INVALID_EVENT, relock);
    return () => window.removeEventListener(SARH_PASSCODE_INVALID_EVENT, relock);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passcode = value.trim();
    if (!passcode || checking) return;
    setChecking(true);
    const result = await checkSarhPasscode(passcode);
    setChecking(false);
    if (result === 'ok') {
      setSarhPasscode(passcode);
      setUnlocked(true);
    } else {
      setError(result);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#06080d' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)',
        }}
      />

      <div
        className={`relative w-full max-w-sm rounded-3xl px-6 py-5 ${shaking ? 'animate-[sarh-shake_0.4s_ease]' : ''}`}
        style={{
          background:
            'linear-gradient(135deg, rgba(20,45,90,0.45) 0%, rgba(6,14,38,0.6) 100%)',
          backdropFilter: 'blur(40px) saturate(160%)',
          WebkitBackdropFilter: 'blur(40px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-sky-400 uppercase mb-0.5">
              SARH Voice AI
            </p>
            <h1 className="text-xl font-black text-white leading-tight">
              {title}
            </h1>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(14,165,233,0.12)',
              border: '1px solid rgba(14,165,233,0.25)',
            }}
          >
            <Lock className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="password"
            autoFocus
            value={value}
            placeholder="Enter secure code…"
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{
              background: error
                ? 'rgba(239,68,68,0.08)'
                : 'rgba(255,255,255,0.05)',
              border: error
                ? '1px solid rgba(239,68,68,0.4)'
                : '1px solid rgba(255,255,255,0.1)',
              transition: 'background 0.2s, border 0.2s',
            }}
          />
          {error && (
            <p className="text-red-400 text-xs">{ERROR_MESSAGES[error]}</p>
          )}
          <button
            type="submit"
            disabled={checking}
            className="w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #22d3ee)',
              color: '#060B14',
              boxShadow: '0 0 28px rgba(56,189,248,0.3)',
            }}
          >
            <span>{checking ? 'Checking…' : 'Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes sarh-shake {
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

export default SarhPasswordGate;
