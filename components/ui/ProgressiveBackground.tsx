import React, { useState, useEffect } from 'react';

interface ProgressiveBackgroundProps {
  src: string;
  lowResSrc?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ProgressiveBackground component that shows a low-res background
 * while the high-res image loads for better perceived performance.
 */
const ProgressiveBackground: React.FC<ProgressiveBackgroundProps> = ({
  src,
  lowResSrc,
  className = '',
  children,
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
    <div
      className={`${className} transition-all duration-700 ${
        isLoaded ? '' : lowResSrc ? 'blur-sm' : ''
      }`}
      style={{ backgroundImage: `url("${currentSrc}")` }}
    >
      {children}
    </div>
  );
};

export default ProgressiveBackground;


