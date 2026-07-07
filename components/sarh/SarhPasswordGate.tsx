import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

const ACCESS_CODE = 'sarh2811';
const SESSION_KEY = 'sarh_production_dashboard_auth';

interface SarhPasswordGateProps {
  children: React.ReactNode;
}

const SarhPasswordGate: React.FC<SarhPasswordGateProps> = ({ children }) => {
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
      style={{ background: '#060B14' }}
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
              Production Dashboard
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
              setError(false);
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
            <p className="text-red-400 text-xs">Incorrect code. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #22d3ee)',
              color: '#060B14',
              boxShadow: '0 0 28px rgba(56,189,248,0.3)',
            }}
          >
            <span>Enter Dashboard</span>
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
