import React, { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
  className?: string;
  /** First animation starts at 0 when true (default). Later updates start from the current value. */
  fromZeroOnFirst?: boolean;
  /** Delay before the count animation begins (ms). */
  delay?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
  className,
  fromZeroOnFirst = true,
  delay = 0,
}) => {
  const [display, setDisplay] = useState(fromZeroOnFirst ? 0 : value);
  const frameRef = useRef<number | null>(null);
  const displayedRef = useRef(fromZeroOnFirst ? 0 : value);
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      displayedRef.current = value;
      isFirstRef.current = false;
      return;
    }

    const startVal = isFirstRef.current && fromZeroOnFirst ? 0 : displayedRef.current;
    isFirstRef.current = false;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const diff = value - startVal;
    if (Math.abs(diff) < 1e-9) {
      setDisplay(value);
      displayedRef.current = value;
      return;
    }

    const startAt = performance.now() + delay;

    const tick = (now: number) => {
      if (now < startAt) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startAt;
      const progress = Math.min(elapsed / duration, 1);
      const current = startVal + diff * easeOutCubic(progress);
      const rounded =
        decimals > 0
          ? Math.round(current * 10 ** decimals) / 10 ** decimals
          : Math.round(current);

      setDisplay(rounded);
      displayedRef.current = rounded;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        displayedRef.current = value;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, decimals, delay, fromZeroOnFirst]);

  const text = formatter
    ? formatter(display)
    : `${prefix}${decimals > 0 ? display.toFixed(decimals) : display}${suffix}`;

  return <span className={className}>{text}</span>;
};

export default AnimatedNumber;
