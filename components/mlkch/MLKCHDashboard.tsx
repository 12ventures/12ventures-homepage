import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import MLKCHPasswordGate from './MLKCHPasswordGate';
import InitiativeCard from './InitiativeCard';
import CopilotWidget from './CopilotWidget';
import ShimmerText from './ShimmerText';
import DetailPanel from './DetailPanel';
import InitiativeEditPanel from './InitiativeEditPanel';
import TopMetricsRow from './TopMetricsRow';
import { InlineEditProvider } from './inline/InlineEditProvider';
import { InlineEditBlock } from './inline/InlineEditBlock';
import { GLOBAL_TOP_METRICS, getInitiativesBySectionId, hexToRgb, resolveInitiativeBanner } from './data/initiatives';
import { getRoiBreakdown } from './data/snapSkillRoi';
import ROIBreakdownModal from './ROIBreakdownModal';
import { useInitiatives } from './hooks/useInitiatives';
import { useSections } from './hooks/useSections';
import type { DashboardSection, Initiative } from './data/initiatives';
import type { InitiativeInput } from './api/mlkchApi';

const PARTNERSHIP_LOGO = '/logos/mlkch-x-12v-logo.png';

const sectionLabelInputClass =
  'min-w-0 flex-1 rounded-md bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase text-white outline-none focus:border-white/18';

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


// ── Drag-to-reorder: single initiative row ─────────────────────────────────
const DraggableInitiativeRow: React.FC<{
  initiative: Initiative;
  accentColor: string;
  isSelected: boolean;
  onSelect: () => void;
  canEdit: boolean;
  onDragEnd: () => void;
}> = ({ initiative, accentColor, isSelected, onSelect, canEdit, onDragEnd }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={initiative}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      layout="position"
      whileDrag={{ opacity: 0.9, scale: 1.01, zIndex: 50 }}
      dragTransition={{ bounceStiffness: 350, bounceDamping: 32 }}
      style={{ listStyle: 'none' }}
    >
      <div className="group/drag flex items-center gap-1 min-w-0">
        {canEdit && (
          <div
            className="flex-shrink-0 opacity-0 group-hover/drag:opacity-25 hover:!opacity-65 cursor-grab active:cursor-grabbing touch-none select-none p-0.5 transition-opacity duration-150"
            onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
          >
            <GripVertical className="w-3 h-3 text-white" strokeWidth={2} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <InitiativeCard
            initiative={initiative}
            accentColor={accentColor}
            isSelected={isSelected}
            compact
            onClick={() => onSelect()}
          />
        </div>
      </div>
    </Reorder.Item>
  );
};

// ── Drag-to-reorder: section group ─────────────────────────────────────────
const DraggableSectionGroup: React.FC<{
  section: DashboardSection;
  items: Initiative[];
  selectedId: string;
  onSelect: (id: string) => void;
  canEdit: boolean;
  onSectionDragEnd: () => void;
  onItemsReordered: (reordered: Initiative[]) => void;
  onRenameSection: (id: string, label: string) => Promise<void>;
  onDeleteSection: (id: string) => Promise<void>;
  onAddInitiative: () => void;
}> = ({
  section,
  items,
  selectedId,
  onSelect,
  canEdit,
  onSectionDragEnd,
  onItemsReordered,
  onRenameSection,
  onDeleteSection,
  onAddInitiative,
}) => {
  const sectionControls = useDragControls();
  const [localItems, setLocalItems] = useState(items);
  const [labelDraft, setLabelDraft] = useState(section.label);
  const localRef = useRef(items);

  useEffect(() => {
    setLocalItems(items);
    localRef.current = items;
  }, [items]);

  useEffect(() => {
    setLabelDraft(section.label);
  }, [section.label]);

  const handleReorder = (newOrder: Initiative[]) => {
    setLocalItems(newOrder);
    localRef.current = newOrder;
  };

  const accentRgb = hexToRgb(section.accentColor);

  return (
    <Reorder.Item
      as="div"
      value={section}
      dragListener={false}
      dragControls={sectionControls}
      onDragEnd={onSectionDragEnd}
      layout="position"
      whileDrag={{ opacity: 0.95, zIndex: 50 }}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
      style={{ listStyle: 'none' }}
    >
      <div className="group/section flex items-center gap-2 px-1 mb-2 min-w-0">
        {canEdit && (
          <div
            className="flex-shrink-0 opacity-0 group-hover/section:opacity-30 hover:!opacity-70 cursor-grab active:cursor-grabbing touch-none select-none p-0.5 -ml-1 transition-opacity duration-150"
            onPointerDown={(e) => {
              e.preventDefault();
              sectionControls.start(e);
            }}
          >
            <GripVertical
              className="w-3.5 h-3.5"
              style={{ color: section.accentColor }}
              strokeWidth={1.75}
            />
          </div>
        )}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {section.dotPulse && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
              style={{ background: section.accentColor }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: section.accentColor }}
          />
        </span>
        <InlineEditBlock
          blockId={`sidebar-section-${section.id}`}
          canEdit={canEdit}
          className="min-w-0 shrink"
          controlsPlacement="inline"
          onCancel={() => setLabelDraft(section.label)}
          onSave={async () => {
            const next = labelDraft.trim() || section.label;
            await onRenameSection(section.id, next);
          }}
        >
          {(editing) =>
            editing ? (
              <input
                autoFocus
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                className={sectionLabelInputClass}
                style={{ color: section.accentColor }}
              />
            ) : (
              <p
                className="text-[10px] font-bold tracking-widest uppercase whitespace-nowrap"
                style={{ color: section.accentColor }}
              >
                {section.label}
              </p>
            )
          }
        </InlineEditBlock>
        {canEdit && items.length === 0 && (
          <button
            type="button"
            title="Remove empty group"
            onClick={() => void onDeleteSection(section.id)}
            className="opacity-0 group-hover/section:opacity-30 hover:!opacity-70 p-0.5 text-white/40 hover:text-red-300 transition-opacity"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        <span
          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: `rgba(${accentRgb},0.1)`,
            color: section.accentColor,
          }}
        >
          {items.length}
        </span>
      </div>

      <Reorder.Group
        as="div"
        axis="y"
        values={localItems}
        onReorder={handleReorder}
        className="space-y-1.5"
        style={{ listStyle: 'none' }}
      >
        {localItems.map((initiative) => (
          <DraggableInitiativeRow
            key={initiative.id}
            initiative={initiative}
            accentColor={section.accentColor}
            isSelected={selectedId === initiative.id}
            onSelect={() => onSelect(initiative.id)}
            canEdit={canEdit}
            onDragEnd={() => onItemsReordered(localRef.current)}
          />
        ))}
      </Reorder.Group>

      {canEdit && (
        <div className="mt-1.5 flex items-center gap-1 min-w-0">
          <div className="flex-shrink-0 p-0.5 opacity-0 pointer-events-none" aria-hidden>
            <GripVertical className="w-3 h-3" strokeWidth={2} />
          </div>
          <button
            type="button"
            onClick={onAddInitiative}
            className="flex-1 min-w-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/30 hover:text-white/55 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: section.accentColor, opacity: 0.7 }} />
            Add initiative
          </button>
        </div>
      )}
    </Reorder.Item>
  );
};

// ── Main dashboard content ─────────────────────────────────────────────────
const DashboardContent: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roiModalOpen, setRoiModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Initiative | null>(null);
  const [editSectionId, setEditSectionId] = useState<string>('sec_next');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const glowRef = useRef<HTMLDivElement>(null);

  const {
    initiatives,
    loading: initiativesLoading,
    error: initiativesError,
    source,
    mutating,
    create,
    update,
    remove,
    patch,
    reorderSection,
    canEdit,
  } = useInitiatives();

  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    create: createSection,
    patch: patchSection,
    remove: removeSection,
    reorderSections,
  } = useSections();

  const loading = initiativesLoading || sectionsLoading;
  const error = initiativesError ?? sectionsError;

  const [orderedSections, setOrderedSections] = useState<DashboardSection[]>(sections);
  const orderedSectionsRef = useRef(sections);

  useEffect(() => {
    setOrderedSections(sections);
    orderedSectionsRef.current = sections;
  }, [sections]);

  const handleSectionDragEnd = () => {
    void reorderSections(orderedSectionsRef.current);
  };

  const handleRenameSection = async (id: string, label: string) => {
    await patchSection(id, { label });
  };

  const handleDeleteSection = async (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    if (!window.confirm(`Remove group "${section.label}"?`)) return;
    try {
      await removeSection(id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not remove group');
    }
  };

  const handleAddSection = async () => {
    const label = window.prompt('New group name');
    if (!label?.trim()) return;
    const maxOrder = sections.reduce((max, s) => Math.max(max, s.sortOrder), 0);
    try {
      await createSection({
        label: label.trim(),
        sortOrder: maxOrder + 10,
        accentColor: '#64748b',
        dotPulse: false,
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not create group');
    }
  };

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

  const openCreateEditor = (sectionId: string) => {
    const sectionItems = getInitiativesBySectionId(sectionId, initiatives);
    const nextSortOrder =
      sectionItems.length > 0
        ? Math.max(...sectionItems.map((i) => i.sortOrder ?? 0)) + 10
        : 0;

    setEditTarget(null);
    setEditSectionId(sectionId);
    setEditSortOrder(nextSortOrder);
    setEditOpen(true);
  };

  const openAdvancedEditor = () => {
    if (!selected) return;
    setEditTarget(selected);
    setEditSectionId(selected.sectionId);
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
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={orderedSections}
                  onReorder={(newOrder) => {
                    setOrderedSections(newOrder);
                    orderedSectionsRef.current = newOrder;
                  }}
                  className="space-y-5"
                  style={{ listStyle: 'none' }}
                >
                  {orderedSections.map((section) => {
                    const sectionItems = getInitiativesBySectionId(section.id, initiatives);
                    if (sectionItems.length === 0 && !canEdit) return null;
                    return (
                      <DraggableSectionGroup
                        key={section.id}
                        section={section}
                        items={sectionItems}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        canEdit={canEdit}
                        onSectionDragEnd={handleSectionDragEnd}
                        onItemsReordered={(reordered) => void reorderSection(section.id, reordered)}
                        onRenameSection={handleRenameSection}
                        onDeleteSection={handleDeleteSection}
                        onAddInitiative={() => openCreateEditor(section.id)}
                      />
                    );
                  })}
                </Reorder.Group>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => void handleAddSection()}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium text-white/35 border border-white/[0.06] hover:text-white/60 hover:border-white/12 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Group
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
                  sections={sections}
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
        sections={sections}
        defaultSectionId={editSectionId}
        defaultSortOrder={editSortOrder}
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
