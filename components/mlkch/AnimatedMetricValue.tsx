import React, { useEffect, useRef } from 'react';

interface ParsedMetric {
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
}

interface AnimatedMetricValueProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  delay?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function parseMetricValue(value: string): ParsedMetric | null {
  const trimmed = value.trim();

  let match = trimmed.match(/^(\$)([\d.]+)(K\+?|M\+?)$/i);
  if (match) {
    return {
      prefix: match[1],
      target: parseFloat(match[2]),
      suffix: match[3],
      decimals: 0,
    };
  }

  match = trimmed.match(/^([\d.]+)(%)$/);
  if (match) {
    return {
      prefix: '',
      target: parseFloat(match[1]),
      suffix: match[2],
      decimals: 0,
    };
  }

  match = trimmed.match(/^([\d.]+)(\+)$/);
  if (match) {
    return {
      prefix: '',
      target: parseFloat(match[1]),
      suffix: match[2],
      decimals: 0,
    };
  }

  match = trimmed.match(/^([\d.]+)$/);
  if (match) {
    return {
      prefix: '',
      target: parseFloat(match[1]),
      suffix: '',
      decimals: match[1].includes('.') ? 1 : 0,
    };
  }

  return null;
}

function formatValue(parsed: ParsedMetric, current: number): string {
  const n =
    parsed.decimals > 0
      ? current.toFixed(parsed.decimals)
      : String(Math.round(current));
  return `${parsed.prefix}${n}${parsed.suffix}`;
}

function getInitialDisplay(value: string): string {
  const parsed = parseMetricValue(value);
  return parsed ? formatValue(parsed, 0) : value;
}

const AnimatedMetricValue: React.FC<AnimatedMetricValueProps> = ({
  value,
  className,
  style,
  duration = 1100,
  delay = 0,
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const parsed = parseMetricValue(value);
    if (!parsed) {
      el.textContent = value;
      return;
    }

    let rafId = 0;
    let startTime: number | null = null;
    el.textContent = formatValue(parsed, 0);

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime - delay;

      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const current = parsed.target * easeOutCubic(progress);
      el.textContent = formatValue(parsed, current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = value;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={className} style={style}>
      {getInitialDisplay(value)}
    </span>
  );
};

export default AnimatedMetricValue;
