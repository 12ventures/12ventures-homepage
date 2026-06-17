import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import GlassDropdown from './ui/GlassDropdown';
import type {
  Initiative,
  InitiativeMetric,
  InitiativeSection,
  InitiativeStatus,
  MetricAccent,
  MilestoneChild,
  MilestoneItem,
  TopMetric,
} from './data/initiatives';
import { isMilestoneGroup } from './data/initiatives';
import type { InitiativeInput } from './api/mlkchApi';

const SECTIONS: InitiativeSection[] = ['live', 'next', 'backlog'];
const STATUSES: InitiativeStatus[] = ['active', 'planning', 'backlog'];
const ACCENTS: MetricAccent[] = ['teal', 'sky', 'purple', 'green'];

const SECTION_OPTIONS = SECTIONS.map((section) => ({
  value: section,
  label: section.charAt(0).toUpperCase() + section.slice(1),
}));

const STATUS_OPTIONS = STATUSES.map((status) => ({
  value: status,
  label:
    status === 'active' ? 'Live' : status === 'planning' ? 'Active' : 'Planning',
}));

const ACCENT_OPTIONS = ACCENTS.map((accent) => ({
  value: accent,
  label: accent.charAt(0).toUpperCase() + accent.slice(1),
}));

const MILESTONE_TYPE_OPTIONS: { value: MilestoneDraftType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
  { value: 'group', label: 'Group' },
];

const MILESTONE_CHILD_TYPE_OPTIONS: { value: 'text' | 'link'; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
];

const EDIT_PANEL_MENU_Z = 70;

type MilestoneDraftType = 'text' | 'link' | 'group';

interface MilestoneDraft {
  type: MilestoneDraftType;
  text: string;
  label: string;
  url: string;
  children: MilestoneChild[];
}

interface Props {
  open: boolean;
  initiative: Initiative | null;
  defaultSection?: InitiativeSection;
  defaultSortOrder?: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: InitiativeInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const inputClass =
  'w-full rounded-xl px-3 py-2 text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-sky-400/40 placeholder:text-white/25';

const labelClass = 'text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1.5 block';

function emptyDraft(): MilestoneDraft {
  return { type: 'text', text: '', label: '', url: '', children: [] };
}

function milestoneToDraft(item: MilestoneItem): MilestoneDraft {
  if (typeof item === 'string') {
    return { type: 'text', text: item, label: '', url: '', children: [] };
  }
  if (isMilestoneGroup(item)) {
    return { type: 'group', text: '', label: item.label, url: '', children: [...item.children] };
  }
  return { type: 'link', text: '', label: item.label, url: item.url, children: [] };
}

function draftToMilestone(draft: MilestoneDraft): MilestoneItem | null {
  if (draft.type === 'text') {
    const text = draft.text.trim();
    return text || null;
  }
  if (draft.type === 'link') {
    if (!draft.label.trim() || !draft.url.trim()) return null;
    return { label: draft.label.trim(), url: draft.url.trim() };
  }
  if (!draft.label.trim() || draft.children.length === 0) return null;
  return { label: draft.label.trim(), children: draft.children };
}

function childToDraft(child: MilestoneChild): MilestoneDraft {
  if (typeof child === 'string') {
    return { type: 'text', text: child, label: '', url: '', children: [] };
  }
  return { type: 'link', text: '', label: child.label, url: child.url, children: [] };
}

function draftToChild(draft: MilestoneDraft): MilestoneChild | null {
  if (draft.type === 'text') {
    const text = draft.text.trim();
    return text || null;
  }
  if (!draft.label.trim() || !draft.url.trim()) return null;
  return { label: draft.label.trim(), url: draft.url.trim() };
}

function emptyTopMetric(): TopMetric {
  return { label: '', value: '', accent: 'sky' };
}

function emptyMetric(): InitiativeMetric {
  return { label: '', value: '' };
}

function buildDefaultInput(section: InitiativeSection, sortOrder: number): InitiativeInput {
  return {
    title: '',
    section,
    status: section === 'live' ? 'active' : section === 'next' ? 'planning' : 'backlog',
    description: '',
    sortOrder,
    topMetrics: [],
    subItems: [],
    metrics: [],
    tags: [],
    bannerImage: null,
    externalUrl: null,
  };
}

const InitiativeEditPanel: React.FC<Props> = ({
  open,
  initiative,
  defaultSection = 'next',
  defaultSortOrder = 0,
  saving = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<InitiativeInput>(() => buildDefaultInput(defaultSection, defaultSortOrder));
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (initiative) {
      setForm({
        title: initiative.title,
        section: initiative.section,
        status: initiative.status,
        description: initiative.description,
        sortOrder: initiative.sortOrder ?? 0,
        topMetrics: initiative.topMetrics ?? [],
        subItems: initiative.subItems ?? [],
        metrics: initiative.metrics ?? [],
        tags: initiative.tags ?? [],
        bannerImage: initiative.bannerImage ?? null,
        externalUrl: initiative.externalUrl ?? null,
      });
      setMilestones((initiative.subItems ?? []).map(milestoneToDraft));
    } else {
      setForm(buildDefaultInput(defaultSection, defaultSortOrder));
      setMilestones([]);
    }
    setSaveError(null);
  }, [open, initiative, defaultSection, defaultSortOrder]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.title.trim()) {
      setSaveError('Title is required.');
      return;
    }

    const subItems = milestones
      .map(draftToMilestone)
      .filter((item): item is MilestoneItem => item !== null);

    try {
      setSaveError(null);
      await onSave({ ...form, title: form.title.trim(), subItems });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!initiative || !onDelete) return;
    if (!window.confirm(`Delete "${initiative.title}"? This cannot be undone.`)) return;

    try {
      setSaveError(null);
      await onDelete(initiative.id);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const updateMilestone = (index: number, patch: Partial<MilestoneDraft>) => {
    setMilestones((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateGroupChild = (milestoneIndex: number, childIndex: number, patch: Partial<MilestoneDraft>) => {
    setMilestones((prev) =>
      prev.map((item, i) => {
        if (i !== milestoneIndex) return item;
        const children = item.children.map((child, ci) => {
          if (ci !== childIndex) return child;
          const draft = { ...childToDraft(child), ...patch };
          return draftToChild(draft) ?? child;
        });
        return { ...item, children };
      }),
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close editor"
        onClick={onClose}
      />

      <aside
        className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#070d16]/95 shadow-2xl"
        style={{ backdropFilter: 'blur(16px) saturate(140%)' }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-sky-400/80">
              {initiative ? 'Edit Initiative' : 'New Initiative'}
            </p>
            <h2 className="text-lg font-black text-white mt-0.5">
              {initiative ? initiative.title : 'Create initiative'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mlkch-scroll flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <section className="space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-[88px] resize-y`}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Section</label>
                <GlassDropdown
                  variant="field"
                  align="left"
                  menuZIndex={EDIT_PANEL_MENU_Z}
                  value={form.section}
                  options={SECTION_OPTIONS}
                  onChange={(section) => setForm((prev) => ({ ...prev, section }))}
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <GlassDropdown
                  variant="field"
                  align="left"
                  menuZIndex={EDIT_PANEL_MENU_Z}
                  value={form.status}
                  options={STATUS_OPTIONS}
                  onChange={(status) => setForm((prev) => ({ ...prev, status }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Banner Image URL</label>
                <input
                  className={inputClass}
                  value={form.bannerImage ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bannerImage: e.target.value || null }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className={labelClass}>External URL</label>
                <input
                  className={inputClass}
                  value={form.externalUrl ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, externalUrl: e.target.value || null }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Sort Order</label>
              <input
                type="number"
                className={inputClass}
                value={form.sortOrder ?? 0}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className={labelClass.replace(' mb-1.5', '')}>Top Metrics</p>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, topMetrics: [...prev.topMetrics, emptyTopMetric()] }))
                }
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.topMetrics.map((metric, index) => (
                <div key={index} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={inputClass}
                      placeholder="Label"
                      value={metric.label}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          topMetrics: prev.topMetrics.map((m, i) =>
                            i === index ? { ...m, label: e.target.value } : m,
                          ),
                        }))
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Value"
                      value={metric.value}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          topMetrics: prev.topMetrics.map((m, i) =>
                            i === index ? { ...m, value: e.target.value } : m,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <GlassDropdown
                        variant="field"
                        align="left"
                        menuZIndex={EDIT_PANEL_MENU_Z}
                        value={metric.accent}
                        options={ACCENT_OPTIONS}
                        onChange={(accent) =>
                          setForm((prev) => ({
                            ...prev,
                            topMetrics: prev.topMetrics.map((m, i) =>
                              i === index ? { ...m, accent } : m,
                            ),
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          topMetrics: prev.topMetrics.filter((_, i) => i !== index),
                        }))
                      }
                      className="p-2 text-white/30 hover:text-red-300 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className={labelClass.replace(' mb-1.5', '')}>Detail Metrics</p>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, metrics: [...prev.metrics, emptyMetric()] }))
                }
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.metrics.map((metric, index) => (
                <div key={index} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={inputClass}
                      placeholder="Label"
                      value={metric.label}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          metrics: prev.metrics.map((m, i) =>
                            i === index ? { ...m, label: e.target.value } : m,
                          ),
                        }))
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Value"
                      value={metric.value}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          metrics: prev.metrics.map((m, i) =>
                            i === index ? { ...m, value: e.target.value } : m,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          metrics: prev.metrics.filter((_, i) => i !== index),
                        }))
                      }
                      className="p-2 text-white/30 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className={labelClass.replace(' mb-1.5', '')}>Milestones</p>
              <button
                type="button"
                onClick={() => setMilestones((prev) => [...prev, emptyDraft()])}
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((draft, index) => (
                <div key={index} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <GlassDropdown
                        variant="field"
                        align="left"
                        menuZIndex={EDIT_PANEL_MENU_Z}
                        value={draft.type}
                        options={MILESTONE_TYPE_OPTIONS}
                        onChange={(type) =>
                          updateMilestone(index, {
                            type,
                            text: '',
                            label: '',
                            url: '',
                            children: [],
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== index))}
                      className="p-2 text-white/30 hover:text-red-300 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {draft.type === 'text' && (
                    <input
                      className={inputClass}
                      placeholder="Milestone text"
                      value={draft.text}
                      onChange={(e) => updateMilestone(index, { text: e.target.value })}
                    />
                  )}

                  {draft.type === 'link' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={inputClass}
                        placeholder="Label"
                        value={draft.label}
                        onChange={(e) => updateMilestone(index, { label: e.target.value })}
                      />
                      <input
                        className={inputClass}
                        placeholder="URL"
                        value={draft.url}
                        onChange={(e) => updateMilestone(index, { url: e.target.value })}
                      />
                    </div>
                  )}

                  {draft.type === 'group' && (
                    <div className="space-y-2">
                      <input
                        className={inputClass}
                        placeholder="Group label"
                        value={draft.label}
                        onChange={(e) => updateMilestone(index, { label: e.target.value })}
                      />
                      {draft.children.map((child, childIndex) => {
                        const childDraft = childToDraft(child);
                        return (
                          <div key={childIndex} className="rounded-lg border border-white/[0.05] p-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <GlassDropdown
                                  variant="field"
                                  align="left"
                                  menuZIndex={EDIT_PANEL_MENU_Z}
                                  value={childDraft.type === 'group' ? 'text' : childDraft.type}
                                  options={MILESTONE_CHILD_TYPE_OPTIONS}
                                  onChange={(type) => {
                                    updateGroupChild(index, childIndex, {
                                      type,
                                      text: '',
                                      label: '',
                                      url: '',
                                    });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateMilestone(index, {
                                    children: draft.children.filter((_, ci) => ci !== childIndex),
                                  })
                                }
                                className="p-1.5 text-white/30 hover:text-red-300 flex-shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {childDraft.type === 'text' ? (
                              <input
                                className={inputClass}
                                placeholder="Child text"
                                value={childDraft.text}
                                onChange={(e) =>
                                  updateGroupChild(index, childIndex, { text: e.target.value })
                                }
                              />
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className={inputClass}
                                  placeholder="Label"
                                  value={childDraft.label}
                                  onChange={(e) =>
                                    updateGroupChild(index, childIndex, { label: e.target.value })
                                  }
                                />
                                <input
                                  className={inputClass}
                                  placeholder="URL"
                                  value={childDraft.url}
                                  onChange={(e) =>
                                    updateGroupChild(index, childIndex, { url: e.target.value })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          updateMilestone(index, { children: [...draft.children, ''] })
                        }
                        className="text-xs text-sky-400 hover:text-sky-300"
                      >
                        + Add child
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {saveError && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {saveError}
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-5 py-4 flex items-center gap-2">
          {initiative && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white/60 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-bold text-[#060B14] bg-gradient-to-r from-sky-400 to-teal-400 hover:opacity-95 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default InitiativeEditPanel;
