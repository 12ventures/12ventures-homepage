import React, { useState } from 'react';

type Ratio = '16x9' | '3x2' | '4x5' | 'fill';

const ratioClass: Record<Ratio, string> = {
  '16x9': 'hs-ratio-16x9',
  '3x2': 'hs-ratio-3x2',
  '4x5': 'hs-ratio-4x5',
  fill: 'hs-media-fill',
};

interface MediaSlotProps {
  src: string;
  label: string;
  ratio: Ratio;
  alt: string;
  className?: string;
}

const MediaSlot: React.FC<MediaSlotProps> = ({ src, label, ratio, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`hs-media ${ratioClass[ratio]} ${className}`.trim()} data-slot={label}>
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
        <div className="hs-media-ph" aria-hidden={loaded && !failed}>
          <strong>{label}</strong>
          <span>Drop file into public/healthsystems/</span>
        </div>
      )}
    </div>
  );
};

export default MediaSlot;
