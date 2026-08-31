import React, { useState } from 'react';

type Ratio = '16x9' | '3x2' | '21x9' | '4x5' | 'fill';

const ratioClass: Record<Ratio, string> = {
  '16x9': 'ai2p-ratio-16x9',
  '3x2': 'ai2p-ratio-3x2',
  '21x9': 'ai2p-ratio-21x9',
  '4x5': 'ai2p-ratio-4x5',
  fill: 'ai2p-media-fill',
};

interface MediaSlotProps {
  src: string;
  label: string;
  ratio: Ratio;
  alt: string;
  className?: string;
}

/** Named still slot. Shows a labeled placeholder until the asset loads. */
const MediaSlot: React.FC<MediaSlotProps> = ({ src, label, ratio, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`ai2p-media ${ratioClass[ratio]} ${className}`.trim()} data-slot={label}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
      {(!loaded || failed) && (
        <div className="ai2p-media-ph" aria-hidden={loaded && !failed}>
          <strong>{label}</strong>
          <span>Drop file into public/ai2p/</span>
        </div>
      )}
    </div>
  );
};

export default MediaSlot;
