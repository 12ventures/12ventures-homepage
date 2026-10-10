import React, { useEffect, useRef, useState } from 'react';

interface YouTubeFacadeProps {
  videoId: string;
  title: string;
}

const YT_STATE_ENDED = 0;

/**
 * Poster + play button that loads the YouTube player only after a click.
 * Before the click there is no YouTube title, channel avatar, or "Watch on YouTube"
 * link on the page, because the player is not loaded yet. When playback ends the
 * poster returns, so YouTube's end screen (channel, suggested videos) is never shown.
 */
const YouTubeFacade: React.FC<YouTubeFacadeProps> = ({ videoId, title }) => {
  const [playing, setPlaying] = useState(false);
  const [posterSrc, setPosterSrc] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!playing) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange' && data.info === YT_STATE_ENDED) {
          setPlaying(false);
        } else if (data.event === 'infoDelivery' && data.info?.playerState === YT_STATE_ENDED) {
          setPlaying(false);
        }
      } catch {
        // not a YouTube player message
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [playing]);

  if (playing) {
    const origin = encodeURIComponent(window.location.origin);
    return (
      <iframe
        ref={iframeRef}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&color=white&iv_load_policy=3&enablejsapi=1&origin=${origin}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="w-full h-full"
        style={{ border: 'none', display: 'block' }}
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
            '*',
          );
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group relative block w-full h-full bg-black cursor-pointer"
    >
      <img
        src={posterSrc}
        alt=""
        onError={() => {
          const fallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          if (posterSrc !== fallback) setPosterSrc(fallback);
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(to top, rgba(6,11,20,0.25), transparent 45%)' }}
      >
        <span
          className="flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
          style={{
            width: 'clamp(52px, 6vw, 72px)',
            height: 'clamp(52px, 6vw, 72px)',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <svg viewBox="0 0 24 24" width="40%" height="40%" fill="#fff" aria-hidden="true" style={{ marginLeft: '6%' }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
};

export default YouTubeFacade;
