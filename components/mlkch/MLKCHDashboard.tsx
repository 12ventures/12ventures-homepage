import React, { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, DollarSign, BarChart3, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import MLKCHPasswordGate from './MLKCHPasswordGate';
import MetricCard from './MetricCard';
import InitiativeCard from './InitiativeCard';
import CopilotWidget from './CopilotWidget';
import ShimmerText from './ShimmerText';
import AnimatedMetricValue from './AnimatedMetricValue';
import MilestoneList from './MilestoneList';
import { INITIATIVES, GLOBAL_TOP_METRICS, getInitiativesBySection, resolveInitiativeBanner } from './data/initiatives';
import { getRoiBreakdown } from './data/snapSkillRoi';
import ROIBreakdownModal from './ROIBreakdownModal';
import type { Initiative, InitiativeSection, TopMetric } from './data/initiatives';

const PARTNERSHIP_LOGO = '/logos/mlkch-x-12v-logo.png';

// ── Section config ──────────────────────────────────────────────────────────
const SECTIONS: { key: InitiativeSection; label: string; accent: string; dotPulse: boolean }[] = [
  { key: 'live',    label: 'Live',    accent: '#2dd4bf', dotPulse: true  },
  { key: 'next',    label: 'Next',    accent: '#38bdf8', dotPulse: false },
  { key: 'backlog', label: 'Backlog', accent: '#64748b', dotPulse: false },
];

const SECTION_ACCENT: Record<InitiativeSection, { text: string; bg: string; border: string }> = {
  live:    { text: '#2dd4bf', bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.25)'  },
  next:    { text: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
  backlog: { text: '#94a3b8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)'  },
};

const STATUS_LABELS: Record<Initiative['status'], string> = {
  active:   'Live',
  planning: 'Active',
  backlog:  'Planning',
};

// Icon per metric label
function metricIcon(label: string) {
  if (label === 'Nurses Onboarded') return <Users className="w-4 h-4" />;
  if (label === 'ROI') return <TrendingUp className="w-4 h-4" />;
  if (label.includes('Competency')) return <BarChart3 className="w-4 h-4" />;
  if (label.includes('Savings')) return <DollarSign className="w-4 h-4" />;
  return <TrendingUp className="w-4 h-4" />;
}

function accentMetricTextShadow(accentColor: string): string {
  return [
    `0 1px 2px color-mix(in srgb, ${accentColor} 45%, black)`,
    `0 2px 10px color-mix(in srgb, ${accentColor} 35%, black)`,
  ].join(', ');
}

const GLASS_CARD_BASE = {
  plain: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  banner: {
    background: 'linear-gradient(145deg, rgba(14,100,180,0.10) 0%, rgba(6,30,80,0.12) 100%)',
    border: '1px solid rgba(56,189,248,0.14)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.3)',
    transform: 'translateZ(0)',
    willChange: 'backdrop-filter',
  },
} as const;

const GLASS_BADGE_BASE = {
  banner: {
    backdropFilter: 'blur(6px) saturate(140%)',
    WebkitBackdropFilter: 'blur(6px) saturate(140%)',
    transform: 'translateZ(0)',
    willChange: 'backdrop-filter',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  },
} as const;

const InitiativeBanner: React.FC<{ src: string; animate?: boolean }> = ({ src, animate }) => (
  <div
    className={`pointer-events-none absolute inset-x-0 top-0 h-[min(380px,52vh)] overflow-hidden ${
      animate ? 'mlkch-initiative-banner' : ''
    }`}
  >
    <img
      src={src}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-[center_35%] blur-[1px]"
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(to right, #060B14 0%, transparent 12%, transparent 88%, #060B14 100%),' +
          'linear-gradient(to bottom, rgba(6,11,20,0.08) 0%, rgba(6,11,20,0.35) 38%, rgba(6,11,20,0.82) 72%, #060B14 100%)',
      }}
    />
  </div>
);

// ── Detail panel ──────────────────────────────────────────────────────────
const DetailPanel: React.FC<{
  initiative: Initiative;
  onOpenRoi?: () => void;
  animateSections?: boolean;
}> = ({ initiative, onOpenRoi, animateSections = false }) => {
  const accent = SECTION_ACCENT[initiative.section];
  const hasBanner = Boolean(resolveInitiativeBanner(initiative));
  const cardSurface = hasBanner ? GLASS_CARD_BASE.banner : GLASS_CARD_BASE.plain;
  const statusLabel = STATUS_LABELS[initiative.status];
  const statusTextColor = statusLabel === 'Active' ? '#ffffff' : accent.text;
  const sectionClass = (index: number) =>
    animateSections ? `mlkch-initiative-section mlkch-initiative-section-${index}` : '';

  return (
    <div>
      {/* Status + title */}
      <div className={`flex items-center justify-between gap-4 mb-6 ${sectionClass(0)}`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <h2
            className={`text-2xl md:text-3xl font-black text-white leading-tight min-w-0 ${
              hasBanner ? 'mlkch-banner-title-text' : ''
            }`}
          >
            {initiative.title}
          </h2>
          {initiative.externalUrl && (
            <a
              href={initiative.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open product"
              aria-label={`Open ${initiative.title} product`}
              className="mlkch-external-link flex-shrink-0 p-1.5 rounded-lg text-white transition-colors"
              style={{
                background: hasBanner ? accent.bg.replace('0.08', '0.18') : 'rgba(255,255,255,0.05)',
                border: hasBanner ? `1px solid ${accent.border}` : '1px solid rgba(255,255,255,0.08)',
                ...(hasBanner
                  ? {
                      backdropFilter: GLASS_BADGE_BASE.banner.backdropFilter,
                      WebkitBackdropFilter: GLASS_BADGE_BASE.banner.WebkitBackdropFilter,
                      transform: GLASS_BADGE_BASE.banner.transform,
                      willChange: GLASS_BADGE_BASE.banner.willChange,
                    }
                  : {}),
              }}
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          )}
        </div>
        <span
          className="flex-shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
          style={{
            background: hasBanner ? accent.bg.replace('0.08', '0.18') : accent.bg,
            color: statusTextColor,
            border: `1px solid ${accent.border}`,
            ...(hasBanner ? GLASS_BADGE_BASE.banner : {}),
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Metrics */}
      {initiative.metrics && initiative.metrics.length > 0 && (
        <div className={`mb-7 ${sectionClass(1)}`}>
          <p
            className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${hasBanner ? 'mlkch-banner-title-text' : ''}`}
            style={{ color: accent.text }}
          >
            Metrics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {initiative.metrics.map((m) => {
              const clickable = m.opensRoiBreakdown && onOpenRoi;

              return (
                <div
                  key={m.label}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? onOpenRoi : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOpenRoi?.();
                          }
                        }
                      : undefined
                  }
                  className={`rounded-2xl px-4 py-3.5 ${
                    clickable ? 'cursor-pointer transition-all duration-200 hover:scale-[1.01]' : ''
                  }`}
                  style={cardSurface}
                  onMouseEnter={
                    clickable
                      ? (e) => {
                          (e.currentTarget as HTMLElement).style.border =
                            `1px solid ${accent.border}`;
                        }
                      : undefined
                  }
                  onMouseLeave={
                    clickable
                      ? (e) => {
                          (e.currentTarget as HTMLElement).style.border =
                            '1px solid rgba(255,255,255,0.07)';
                        }
                      : undefined
                  }
                >
                  <AnimatedMetricValue
                    key={`${initiative.id}-${m.label}-${m.value}`}
                    value={m.value}
                    className="text-2xl font-black leading-none mb-1 block"
                    style={{
                      color: accent.text,
                      ...(hasBanner ? { textShadow: accentMetricTextShadow(accent.text) } : {}),
                    }}
                  />
                  <p className={`text-[11px] ${hasBanner ? 'text-white' : 'text-white/40'}`}>
                    {m.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      {initiative.subItems && initiative.subItems.length > 0 && (
        <div className={`mb-7 ${sectionClass(2)}`}>
          <p
            className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${hasBanner ? 'mlkch-banner-title-text' : ''}`}
            style={{ color: accent.text }}
          >
            Milestones
          </p>
          <MilestoneList
            items={initiative.subItems}
            accentColor={accent.text}
            glassSurface={hasBanner}
          />
        </div>
      )}

      {/* Tags — hidden for now
      {initiative.tags && initiative.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <Tag className="w-3 h-3 text-white/20" />
          {initiative.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-1 rounded-full text-white/40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      */}
    </div>
  );
};

// ── Overview / empty state ─────────────────────────────────────────────────
const OverviewPanel: React.FC = () => (
  <div className="h-full flex items-center justify-center min-h-40">
    <div className="text-center">
      <div
        className="w-10 h-10 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)' }}
      >
        <BarChart3 className="w-5 h-5 text-sky-400/50" />
      </div>
      <p className="text-sm text-white/25">Select an initiative to view details</p>
    </div>
  </div>
);


const METRIC_INTRO_CLASSES = [
  'mlkch-intro mlkch-intro-metric-0',
  'mlkch-intro mlkch-intro-metric-1',
  'mlkch-intro mlkch-intro-metric-2',
];

// ── Top metrics row renderer ───────────────────────────────────────────────
const TopMetricsRow: React.FC<{
  metrics: TopMetric[];
  animateIntro: boolean;
  switchKey: string;
  onOpenRoi?: () => void;
}> = ({ metrics, animateIntro, switchKey, onOpenRoi }) => (
  <div
    key={switchKey}
    className={`grid gap-3 ${metrics.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
  >
    {metrics.map((m, i) => (
      <div
        key={m.label}
        className={
          animateIntro
            ? METRIC_INTRO_CLASSES[i] ?? ''
            : `mlkch-metric-switch mlkch-metric-switch-${Math.min(i, 2)}`
        }
      >
        <MetricCard
          label={m.label}
          value={m.value}
          accent={m.accent}
          icon={metricIcon(m.label)}
          onClick={m.opensRoiBreakdown ? onOpenRoi : undefined}
        />
      </div>
    ))}
  </div>
);

// ── Main dashboard content ─────────────────────────────────────────────────
const DashboardContent: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedId,  setSelectedId]  = useState<string>('snapskill-onboarding');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roiModalOpen, setRoiModalOpen] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);

  // Mark intro sequence complete so metric swaps don't re-animate
  useEffect(() => {
    const t = setTimeout(() => setIntroComplete(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setRoiModalOpen(false);
  }, [selectedId]);

  // Mouse-tracking glow — direct DOM update, no re-renders
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!glowRef.current) return;
      const x = (e.clientX / window.innerWidth)  * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      glowRef.current.style.background =
        `radial-gradient(ellipse 10% 8% at ${x}% ${y}%, rgba(56,189,248,0.022) 0%, transparent 55%)`;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const selected     = INITIATIVES.find((i) => i.id === selectedId) ?? null;
  const selectedBanner = selected ? resolveInitiativeBanner(selected) : undefined;
  const topMetrics   = selected ? selected.topMetrics : GLOBAL_TOP_METRICS;
  const roiBreakdown = getRoiBreakdown(selectedId);

  const handleOpenRoi = () => {
    if (roiBreakdown) setRoiModalOpen(true);
  };

  return (
    <div
      className="relative min-h-screen md:h-screen md:overflow-hidden flex flex-col text-white font-sans"
      style={{ background: '#060B14' }}
    >
      {/* Background glow layers — sit behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(14,165,233,0.04) 0%, transparent 60%),' +
              'radial-gradient(ellipse 40% 30% at 0% 100%, rgba(45,212,191,0.025) 0%, transparent 60%)',
          }}
        />
        <div ref={glowRef} className="absolute inset-0" />
      </div>

      {/* All UI content — above glow */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
      <div className="relative flex-shrink-0 px-6 md:px-10 pt-8 pb-5">
        {/* Logo + title */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={PARTNERSHIP_LOGO}
            alt="MLKCH x 12 Ventures"
            className="mlkch-intro mlkch-intro-logo h-9 md:h-11 max-w-[280px] md:max-w-[320px] object-contain"
          />
          <div className="border-l pl-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="mlkch-intro mlkch-intro-title">
              <ShimmerText
                as="h1"
                className="text-base md:text-lg font-black leading-none"
              >
                AI Transformation Program
              </ShimmerText>
            </div>
          </div>
        </div>

        {/* Metrics — update per selected initiative */}
        <TopMetricsRow
          metrics={topMetrics}
          animateIntro={!introComplete}
          switchKey={selectedId}
          onOpenRoi={roiBreakdown ? handleOpenRoi : undefined}
        />
      </div>

      {/* Divider */}
      <div
        className="mlkch-intro mlkch-intro-divider relative flex-shrink-0 mx-6 md:mx-10 h-px"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />

      {/* ── Split view ──────────────────────────────────────────────────── */}
      <div className="relative flex flex-col md:flex-row flex-1 md:overflow-hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="absolute z-20 top-8 left-1 md:left-2 p-1 text-white/30 hover:text-white/70 transition-opacity duration-200"
          title="Expand sidebar"
          aria-label="Expand sidebar"
          aria-hidden={sidebarOpen}
          style={{
            opacity: sidebarOpen ? 0 : 1,
            pointerEvents: sidebarOpen ? 'none' : 'auto',
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* ── Left: collapsible sidebar ───────────────────────────────── */}
        <div
          className="flex-shrink-0 mlkch-intro mlkch-intro-sidebar"
          style={{
            width:      sidebarOpen ? 248 : 0,
            minWidth:   0,
            overflow:   'hidden',
            transition: 'width 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          {/* Inner fixed-width scroll container — prevents text squeezing during animation */}
          <div
            className="mlkch-scroll h-full"
            style={{ width: 248, overflowY: 'auto', height: '100%' }}
          >
            <div className="py-4 px-4 space-y-5">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-1">
                <ShimmerText
                  as="p"
                  className="text-[10px] font-bold tracking-widest uppercase"
                >
                  Initiatives
                </ShimmerText>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-white/25 hover:text-white/60 transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Initiative sections */}
              {SECTIONS.map((section) => {
                const items = getInitiativesBySection(section.key);
                if (items.length === 0) return null;
                return (
                  <div key={section.key}>
                    <div className="flex items-center gap-2 px-1 mb-2">
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        {section.dotPulse && (
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                            style={{ background: section.accent }}
                          />
                        )}
                        <span
                          className="relative inline-flex rounded-full h-2 w-2"
                          style={{ background: section.accent }}
                        />
                      </span>
                      <p
                        className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: section.accent }}
                      >
                        {section.label}
                      </p>
                      <span
                        className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `rgba(${section.key === 'live' ? '45,212,191' : section.key === 'next' ? '56,189,248' : '100,116,139'},0.1)`,
                          color: section.accent,
                        }}
                      >
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((initiative) => (
                        <InitiativeCard
                          key={initiative.id}
                          initiative={initiative}
                          sectionAccent={section.key}
                          isSelected={selectedId === initiative.id}
                          compact
                          onClick={(i) => setSelectedId(i.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              <p className="text-[10px] text-white/15 px-1 pt-2">
                Updated Jun 11, 2026
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: detail panel ─────────────────────────────────────── */}
        <div
          className={`relative flex-1 md:overflow-y-auto mlkch-scroll px-6 md:px-10 py-6 md:py-8 ${
            !introComplete ? 'mlkch-intro mlkch-intro-detail' : ''
          }`}
          style={{ contain: 'layout style' }}
        >
          {selectedBanner && (
            <InitiativeBanner
              key={`banner-${selectedId}`}
              src={selectedBanner}
              animate={introComplete}
            />
          )}

          <div className="relative z-10">
            {selected ? (
              <div
                key={selectedId}
                className={introComplete ? 'mlkch-initiative-enter' : undefined}
              >
                <DetailPanel
                  initiative={selected}
                  animateSections={introComplete}
                  onOpenRoi={roiBreakdown ? handleOpenRoi : undefined}
                />
              </div>
            ) : (
              <OverviewPanel />
            )}
          </div>
        </div>
      </div>

      {roiModalOpen && roiBreakdown && (
        <ROIBreakdownModal
          breakdown={roiBreakdown}
          onClose={() => setRoiModalOpen(false)}
        />
      )}

      {/* AI Copilot */}
      <CopilotWidget />
      </div>
    </div>
  );
};

// Wrap with password gate
const MLKCHDashboard: React.FC = () => (
  <MLKCHPasswordGate>
    <DashboardContent />
  </MLKCHPasswordGate>
);

export default MLKCHDashboard;
