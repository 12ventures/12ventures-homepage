import React, { useEffect } from 'react';

const VIDEO_URL = 'https://games.dreambox.gg/videos/merida_demo_clip.mp4';
const LOGO_SRC = '/logos/merida.jpg';
const BG_IMAGE =
  'https://images.stockcake.com/public/1/6/0/1604b404-0b8e-4b4a-99d2-e59b6b9192d1_large/serene-spa-sanctuary-stockcake.jpg';
const PAGE_URL = 'https://12ventures.io/meridawellness';
const PAGE_TITLE = 'Merida Wellness';
const PAGE_DESCRIPTION = 'Watch the Merida Wellness sample video.';

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const MeridaWellness: React.FC = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;

    setMeta('description', PAGE_DESCRIPTION);
    setMeta('og:title', PAGE_TITLE, true);
    setMeta('og:description', PAGE_DESCRIPTION, true);
    setMeta('og:url', PAGE_URL, true);
    setMeta('og:type', 'video.other', true);
    setMeta('og:video', VIDEO_URL, true);
    setMeta('og:video:type', 'video/mp4', true);
    setMeta('og:image', `${window.location.origin}${LOGO_SRC}`, true);
    setMeta('twitter:card', 'player');
    setMeta('twitter:title', PAGE_TITLE);
    setMeta('twitter:description', PAGE_DESCRIPTION);
    setMeta('twitter:player', VIDEO_URL);
    setMeta('twitter:player:stream', VIDEO_URL);

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1410] text-white font-sans">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[#0a1410]">
        <img
          src={BG_IMAGE}
          alt=""
          aria-hidden
          className="merida-intro merida-intro-bg absolute inset-0 h-full w-full scale-[1.06] object-cover object-[center_30%] blur-md"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 38%, transparent 88%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 38%, transparent 88%)',
          }}
        />
      </div>

      {/* Logo */}
      <header className="absolute top-0 left-0 z-20 p-5 md:p-7">
        <img
          src={LOGO_SRC}
          alt="Merida Wellness"
          className="merida-intro merida-intro-logo h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        />
      </header>

      {/* Video */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-24 md:px-10">
        <div
          className="merida-intro merida-intro-video w-full max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden ring-1 ring-white/10"
          style={{
            boxShadow:
              '0 32px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 80px rgba(74, 222, 128, 0.06)',
          }}
        >
          <video
            src={VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            className="block w-full aspect-video bg-black"
            aria-label="Merida Wellness sample video"
          />
        </div>
      </main>
    </div>
  );
};

export default MeridaWellness;
