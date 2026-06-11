import React, { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, DollarSign, Tag, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import MLKCHPasswordGate from './MLKCHPasswordGate';
import MetricCard from './MetricCard';
import InitiativeCard from './InitiativeCard';
import CopilotWidget from './CopilotWidget';
import ShimmerText from './ShimmerText';
import AnimatedMetricValue from './AnimatedMetricValue';
import { INITIATIVES, GLOBAL_TOP_METRICS, getInitiativesBySection } from './data/initiatives';
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
  planning: 'Planning',
  backlog:  'Backlog',
};

// Icon map for global metric row
const GLOBAL_ICONS = [
  <Users className="w-4 h-4" />,
  <DollarSign className="w-4 h-4" />,
  <TrendingUp className="w-4 h-4" />,
];

const METRIC_INTRO_CLASSES = [
  'mlkch-intro mlkch-intro-metric-0',
  'mlkch-intro mlkch-intro-metric-1',
  'mlkch-intro mlkch-intro-metric-2',
];

// ── Detail panel ──────────────────────────────────────────────────────────
const DetailPanel: React.FC<{ initiative: Initiative }> = ({ initiative }) => {
  const accent = SECTION_ACCENT[initiative.section];

  return (
    <div>
      {/* Status + title */}
      <div className="mb-6">
        <span
          className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-3"
          style={{ background: accent.bg, color: accent.text, border: `1px solid ${accent.border}` }}
        >
          {STATUS_LABELS[initiative.status]}
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
          {initiative.title}
        </h2>
      </div>

      {/* Metrics */}
      {initiative.metrics && initiative.metrics.length > 0 && (
        <div className="mb-7">
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ color: accent.text }}
          >
            Metrics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {initiative.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <AnimatedMetricValue
                  key={`${initiative.id}-${m.label}-${m.value}`}
                  value={m.value}
                  className="text-2xl font-black leading-none mb-1 block"
                  style={{ color: accent.text }}
                />
                <p className="text-[11px] text-white/40">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work items */}
      {initiative.subItems && initiative.subItems.length > 0 && (
        <div className="mb-7">
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ color: accent.text }}
          >
            Work Items
          </p>
          <div className="space-y-1.5">
            {initiative.subItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent.text }} />
                <span className="text-sm text-white/60">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
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


// ── Top metrics row renderer ───────────────────────────────────────────────
const TopMetricsRow: React.FC<{ metrics: TopMetric[]; animateIntro: boolean }> = ({
  metrics,
  animateIntro,
}) => (
  <div className="grid grid-cols-3 gap-3">
    {metrics.map((m, i) => (
      <div
        key={m.label}
        className={animateIntro ? METRIC_INTRO_CLASSES[i] ?? '' : undefined}
      >
        <MetricCard
          label={m.label}
          value={m.value}
          accent={m.accent}
          icon={GLOBAL_ICONS[i]}
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
  const glowRef = useRef<HTMLDivElement>(null);

  // Mark intro sequence complete so metric swaps don't re-animate
  useEffect(() => {
    const t = setTimeout(() => setIntroComplete(true), 1600);
    return () => clearTimeout(t);
  }, []);

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
  const topMetrics   = selected ? selected.topMetrics : GLOBAL_TOP_METRICS;

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
            className="mlkch-intro mlkch-intro-logo h-9 md:h-11 object-contain"
          />
          <div className="border-l pl-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="mlkch-intro mlkch-intro-partner">
              <ShimmerText
                as="p"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Strategic Partnership
              </ShimmerText>
            </div>
            <h1 className="mlkch-intro mlkch-intro-title text-base md:text-lg font-black text-white leading-none mt-0.5">
              AI Transformation Program
            </h1>
          </div>
        </div>

        {/* Metrics — update per selected initiative */}
        <TopMetricsRow metrics={topMetrics} animateIntro={!introComplete} />
      </div>

      {/* Divider */}
      <div
        className="mlkch-intro mlkch-intro-divider relative flex-shrink-0 mx-6 md:mx-10 h-px"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />

      {/* ── Split view ──────────────────────────────────────────────────── */}
      <div className="relative flex flex-col md:flex-row flex-1 md:overflow-hidden">
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
        <div className="flex-1 md:overflow-y-auto mlkch-scroll mlkch-intro mlkch-intro-detail px-6 md:px-10 py-6 md:py-8">
          {/* Expand toggle — only when sidebar is collapsed */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out origin-top-left"
            style={{
              width:      sidebarOpen ? 0 : 27,
              height:     sidebarOpen ? 0 : 27,
              opacity:    sidebarOpen ? 0 : 1,
              transform:  sidebarOpen ? 'scale(0.5)' : 'scale(1)',
              marginBottom: sidebarOpen ? 0 : 20,
              pointerEvents: sidebarOpen ? 'none' : 'auto',
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-white/25 hover:text-white/60 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {selected ? <DetailPanel initiative={selected} /> : <OverviewPanel />}
        </div>
      </div>

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
