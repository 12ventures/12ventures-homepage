import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const VENTURES_LOGO = 'https://games.dreambox.gg/icons/12venturesLogoNew.png';


/** Shown for any URL that has no route, instead of a blank page. */
const NotFound: React.FC = () => {
  useEffect(() => {
    document.title = 'Page not found | 12 VENTURES';
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#060B14] text-white font-sans flex flex-col">
      {/* Soft blue glow and a faint dot grid, matching the product pages */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 42%, rgba(56,130,246,0.18) 0%, rgba(6,11,20,0) 70%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(120,150,200,0.22) 1.5px, transparent 2px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%)',
        }}
      />

      <header className="relative z-10 px-6 md:px-10 pt-8 ow-fade-in ow-d-0">
        <a href="/" aria-label="12 VENTURES home">
          <img src={VENTURES_LOGO} alt="12 VENTURES" className="h-[14px] md:h-[16px] w-auto opacity-90" />
        </a>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-16">
        <p className="text-[11px] font-bold tracking-[0.3em] text-blue-400 uppercase mb-5 ow-fade-up ow-d-100">Error 404</p>
        <h1
          className="font-black tracking-tight leading-none ow-fade-up ow-d-200"
          style={{
            fontSize: 'clamp(5rem, 16vw, 11rem)',
            background: 'linear-gradient(180deg, #e4f4ff 0%, #a9dbff 45%, #6cbcff 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 0 28px rgba(90,170,255,0.3))',
          }}
        >
          404
        </h1>
        <h2 className="mt-4 text-xl md:text-2xl font-bold tracking-tight ow-fade-up ow-d-300">This page doesn't exist</h2>
        <p className="mt-3 max-w-md text-sm md:text-base text-gray-400 leading-relaxed ow-fade-up ow-d-400">
          The link may be old or mistyped.
        </p>

        {/* fade lives on the wrapper: the glow class sets its own animation and would cancel it */}
        <div className="mt-8 ow-fade-up ow-d-500">
          <a
            href="/"
            className="demo-btn-glow group bg-gradient-to-r from-blue-400 to-cyan-400 text-[#060B14] font-bold rounded-full inline-flex items-center px-7 py-3.5 text-base transition-all hover:opacity-95 hover:scale-105"
          >
            Back to home
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
