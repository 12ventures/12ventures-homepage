import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import MLKCHPasswordGate from './MLKCHPasswordGate';
import InitiativeCard from './InitiativeCard';
import CopilotWidget from './CopilotWidget';
import ShimmerText from './ShimmerText';
import DetailPanel from './DetailPanel';
import InitiativeEditPanel from './InitiativeEditPanel';
import TopMetricsRow from './TopMetricsRow';
import { InlineEditProvider } from './inline/InlineEditProvider';
import { GLOBAL_TOP_METRICS, getInitiativesBySection, resolveInitiativeBanner } from './data/initiatives';
import { getRoiBreakdown } from './data/snapSkillRoi';
import ROIBreakdownModal from './ROIBreakdownModal';
import { useInitiatives } from './hooks/useInitiatives';
import type { Initiative, InitiativeSection } from './data/initiatives';
import type { InitiativeInput } from './api/mlkchApi';

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


// ── Main dashboard content ─────────────────────────────────────────────────
const DashboardContent: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roiModalOpen, setRoiModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Initiative | null>(null);
  const [editSection, setEditSection] = useState<InitiativeSection>('next');
  const glowRef = useRef<HTMLDivElement>(null);

  const {
    initiatives,
    loading,
    error,
    source,
    mutating,
    create,
    update,
    remove,
    patch,
    canEdit,
  } = useInitiatives();

  // Mark intro sequence complete so metric swaps don't re-animate
  useEffect(() => {
    const t = setTimeout(() => setIntroComplete(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setRoiModalOpen(false);
  }, [selectedId]);

  useEffect(() => {
    if (initiatives.length === 0) {
      setSelectedId('');
      return;
    }
    if (!initiatives.some((item) => item.id === selectedId)) {
      setSelectedId(initiatives[0].id);
    }
  }, [initiatives, selectedId]);

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

  const selected     = initiatives.find((i) => i.id === selectedId) ?? null;
  const selectedBanner = selected ? resolveInitiativeBanner(selected) : undefined;
  const topMetrics   = selected ? selected.topMetrics : GLOBAL_TOP_METRICS;
  const roiBreakdown = getRoiBreakdown(selectedId);

  const handleOpenRoi = () => {
    if (roiBreakdown) setRoiModalOpen(true);
  };

  const openCreateEditor = (section: InitiativeSection = 'next') => {
    setEditTarget(null);
    setEditSection(section);
    setEditOpen(true);
  };

  const openAdvancedEditor = () => {
    if (!selected) return;
    setEditTarget(selected);
    setEditSection(selected.section);
    setEditOpen(true);
  };

  const handleSaveInitiative = async (input: InitiativeInput) => {
    if (editTarget) {
      await update(editTarget.id, input);
      setSelectedId(editTarget.id);
      return;
    }

    const created = await create(input);
    setSelectedId(created.id);
  };

  const handleDeleteInitiative = async (id: string) => {
    await remove(id);
    setSelectedId((current) => (current === id ? '' : current));
  };

  const lastUpdated = initiatives.reduce<string | undefined>((latest, item) => {
    if (!item.updatedAt) return latest;
    if (!latest || item.updatedAt > latest) return item.updatedAt;
    return latest;
  }, undefined);

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Jun 11, 2026';

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
      <InlineEditProvider resetTrigger={selectedId}>
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
          switchKey={selectedId || 'overview'}
          onOpenRoi={roiBreakdown ? handleOpenRoi : undefined}
          canEdit={canEdit && Boolean(selected)}
          blockIdPrefix={selectedId || 'overview'}
          onPatchMetrics={
            selected
              ? async (metrics) => {
                  await patch(selected.id, { topMetrics: metrics });
                }
              : undefined
          }
        />

        {error && (
          <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Could not reach the MLKCH API ({error}). Showing local fallback data.
          </p>
        )}
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
          className={`flex-shrink-0 ${!introComplete ? 'mlkch-intro mlkch-intro-sidebar' : ''}`}
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
              {loading ? (
                <div className="space-y-3 px-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  ))}
                </div>
              ) : (
                SECTIONS.map((section) => {
                  const items = getInitiativesBySection(section.key, initiatives);
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
                })
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => openCreateEditor('next')}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-sky-300 border border-sky-400/20 bg-sky-400/5 hover:bg-sky-400/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Initiative
                </button>
              )}

              <p className="text-[10px] text-white/15 px-1 pt-2">
                Updated {updatedLabel}
                {source === 'api' ? '' : ' · offline data'}
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
              <div className={introComplete ? 'mlkch-initiative-enter' : undefined}>
                <DetailPanel
                  initiative={selected}
                  animateSections={introComplete}
                  onOpenRoi={roiBreakdown ? handleOpenRoi : undefined}
                  canEdit={canEdit}
                  onPatch={async (partial) => {
                    await patch(selected.id, partial);
                  }}
                  onAdvancedEdit={canEdit ? openAdvancedEditor : undefined}
                />
              </div>
            ) : (
              <OverviewPanel />
            )}
          </div>
        </div>
      </div>
      </InlineEditProvider>

      {roiModalOpen && roiBreakdown && (
        <ROIBreakdownModal
          breakdown={roiBreakdown}
          onClose={() => setRoiModalOpen(false)}
        />
      )}

      <InitiativeEditPanel
        open={editOpen}
        initiative={editTarget}
        defaultSection={editSection}
        defaultSortOrder={initiatives.length}
        saving={mutating}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveInitiative}
        onDelete={editTarget ? handleDeleteInitiative : undefined}
      />

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
