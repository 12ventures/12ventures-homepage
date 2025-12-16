import React from 'react';

const VenturesHome: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        {/* Primary gradient orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #1e3a5f 0%, transparent 70%)',
            animation: 'float1 15s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #2d1f3d 0%, transparent 70%)',
            animation: 'float2 18s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[150px]"
          style={{
            background: 'radial-gradient(circle, #1a2a3a 0%, transparent 60%)',
            animation: 'pulse 10s ease-in-out infinite',
          }}
        />
        
        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Subtle grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo container with glow effect */}
        <div 
          className="relative"
          style={{
            animation: 'fadeInUp 1.2s ease-out forwards',
          }}
        >
          {/* Subtle glow behind logo */}
          <div 
            className="absolute inset-0 blur-[60px] opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            }}
          />
          
          {/* Logo */}
          <img 
            src="https://games.dreambox.gg/icons/12venturesLogoNew.png" 
            alt="12Ventures" 
            className="relative w-[180px] md:w-[220px] drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.1))',
            }}
          />
        </div>

        {/* Subtle tagline */}
        <p 
          className="mt-8 text-white/30 text-sm tracking-[0.3em] uppercase font-light"
          style={{
            animation: 'fadeInUp 1.2s ease-out 0.3s forwards',
            opacity: 0,
          }}
        >
          The Home of Innovation
        </p>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 20px) scale(1.08); }
          66% { transform: translate(30px, -40px) scale(0.92); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.15; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VenturesHome;

