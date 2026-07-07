import type { CSSProperties } from 'react';

export interface OdChartTheme {
  grid: string;
  tick: string;
  tickLabel: string;
  tooltip: CSSProperties;
  tooltipLabelStyle: CSSProperties;
  tooltipItemStyle: CSSProperties;
  bar: string;
  barActive: string;
  cursor: string;
}

function readOdCssVar(name: string, fallback: string): string {
  const root = document.querySelector('.od-root');
  const source = root ?? document.documentElement;
  const value = getComputedStyle(source).getPropertyValue(name).trim();
  return value || fallback;
}

/** Reads chart colors from --od-chart-* CSS variables on .od-root */
export function getOdChartTheme(themeKey?: string): OdChartTheme {
  void themeKey;
  const tooltipBg = readOdCssVar('--od-chart-tooltip-bg', '#fff');
  const tooltipBorder = readOdCssVar('--od-chart-tooltip-border', '#e8edf5');
  const tooltipText = readOdCssVar('--od-chart-tooltip-text', '#334155');

  return {
    grid: readOdCssVar('--od-chart-grid', '#e8edf5'),
    tick: readOdCssVar('--od-chart-tick', '#94a3b8'),
    tickLabel: readOdCssVar('--od-chart-tick-label', '#64748b'),
    tooltip: {
      background: tooltipBg,
      border: `1px solid ${tooltipBorder}`,
      borderRadius: 8,
      fontSize: 12,
      color: tooltipText,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(12px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
    },
    tooltipLabelStyle: { color: tooltipText, fontWeight: 600 },
    tooltipItemStyle: { color: tooltipText },
    bar: readOdCssVar('--od-chart-bar', '#3b82f6'),
    barActive: readOdCssVar('--od-chart-bar-active', '#3b82f6'),
    cursor: readOdCssVar('--od-chart-cursor', 'rgba(59, 130, 246, 0.05)'),
  };
}
