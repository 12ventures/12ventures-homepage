import React, { useState } from 'react';
import { Play } from 'lucide-react';

/** Poster + play button for a self-hosted video; the file only loads after a click. */
const VideoFacade: React.FC<{ src: string; poster: string; title: string }> = ({ src, poster, title }) => {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        src={src}
        poster={poster}
        title={title}
        controls
        autoPlay
        playsInline
        onEnded={() => setPlaying(false)}
        className="w-full h-full bg-black"
        style={{ display: 'block', objectFit: 'contain' }}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group relative w-full h-full block"
    >
      <img src={poster} alt="" className="w-full h-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full transition-transform group-hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)' }}
        >
          <Play className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" fill="currentColor" />
        </span>
      </span>
    </button>
  );
};

export default VideoFacade;
