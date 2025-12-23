import React, { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  lowResSrc?: string;
  alt: string;
  className?: string;
}

/**
 * ProgressiveImage component that shows a low-res placeholder
 * while the high-res image loads for better perceived performance.
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  lowResSrc,
  alt,
  className = '',
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setCurrentSrc(lowResSrc || src);
    setIsLoaded(false);

    // Preload the high-res image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    return () => {
      img.onload = null;
    };
  }, [src, lowResSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} transition-all duration-500 ${
        isLoaded ? 'blur-0' : lowResSrc ? 'blur-sm' : ''
      }`}
    />
  );
};

export default ProgressiveImage;

