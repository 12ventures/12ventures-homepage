import React, { useEffect, useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { InlineEditBlock } from './inline/InlineEditBlock';
import type { MilestoneChild, MilestoneItem } from './data/initiatives';
import { isMilestoneGroup, milestoneLabel, milestoneUrl } from './data/initiatives';

interface MilestoneListProps {
  items: MilestoneItem[];
  accentColor: string;
  glassSurface?: boolean;
  canEdit?: boolean;
  blockIdPrefix?: string;
  onPatchItems?: (items: MilestoneItem[]) => Promise<void>;
}

function milestoneKey(item: MilestoneItem, index: number): string {
  return `${milestoneLabel(item)}-${index}`;
}

const fieldInputClass =
  'w-full min-w-0 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/18 transition-colors placeholder:text-white/25';

const MILESTONE_SURFACE = {
  plain: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  glass: {
    background: 'linear-gradient(145deg, rgba(14,100,180,0.08) 0%, rgba(6,30,80,0.10) 100%)',
    border: '1px solid rgba(56,189,248,0.12)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 12px rgba(0,0,0,0.25)',
    transform: 'translateZ(0)',
    willChange: 'backdrop-filter',
  },
} as const;

function childToDraft(child: MilestoneChild): { text: string; url: string } {
  if (typeof child === 'string') return { text: child, url: '' };
  return { text: child.label, url: child.url };
}

function draftToChild(draft: { text: string; url: string }): MilestoneChild {
  const text = draft.text.trim();
  const url = draft.url.trim();
  if (url) return { label: text || url, url };
  return text || 'New milestone';
}

/** Preserve raw input while editing; trim/normalize only on save */
function applyDraftPatch(
  current: { text: string; url: string },
  patch: Partial<{ text: string; url: string }>,
): MilestoneChild {
  const next = { ...current, ...patch };
  if (next.url) {
    return { label: next.text, url: next.url };
  }
  return next.text;
}

function getItemDraft(drafts: MilestoneItem[], index: number, fallback: MilestoneItem) {
  const entry = drafts[index] ?? fallback;
  if (isMilestoneGroup(entry)) {
    return { text: entry.label, url: '' };
  }
  return childToDraft(entry as MilestoneChild);
}

function getGroupChildDraft(
  drafts: MilestoneItem[],
  groupIndex: number,
  childIndex: number,
  fallback: MilestoneChild,
) {
  const group = drafts[groupIndex];
  if (!isMilestoneGroup(group)) return childToDraft(fallback);
  return childToDraft(group.children[childIndex] ?? fallback);
}

function updateItemDraft(
  drafts: MilestoneItem[],
  index: number,
  patch: Partial<{ text: string; url: string }>,
): MilestoneItem[] {
  return drafts.map((entry, i) => {
    if (i !== index || isMilestoneGroup(entry)) return entry;
    const current = childToDraft(entry as MilestoneChild);
    return applyDraftPatch(current, patch);
  });
}

function updateGroupChildDraft(
  drafts: MilestoneItem[],
  groupIndex: number,
  childIndex: number,
  patch: Partial<{ text: string; url: string }>,
): MilestoneItem[] {
  return drafts.map((item, i) => {
    if (i !== groupIndex || !isMilestoneGroup(item)) return item;
    return {
      ...item,
      children: item.children.map((child, ci) => {
        if (ci !== childIndex) return child;
        return applyDraftPatch(childToDraft(child), patch);
      }),
    };
  });
}

const MilestoneRow: React.FC<{
  label: string;
  url?: string;
  accentColor: string;
  surface?: (typeof MILESTONE_SURFACE)[keyof typeof MILESTONE_SURFACE];
  textClassName?: string;
  dotClassName?: string;
  dotOpacity?: number;
  className?: string;
}> = ({
  label,
  url,
  accentColor,
  surface,
  textClassName = 'text-sm text-white/80',
  dotClassName = 'w-1.5 h-1.5',
  dotOpacity = 1,
  className = 'group flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors duration-150',
}) => {
  const content = (
    <>
      <span
        className={`${dotClassName} rounded-full flex-shrink-0 mt-0.5`}
        style={{ background: accentColor, opacity: dotOpacity }}
      />
      <span className={`${textClassName} flex-1 min-w-0`}>{label}</span>
      {url && (
        <ExternalLink
          className="w-3.5 h-3.5 flex-shrink-0 opacity-45 group-hover:opacity-90 transition-opacity"
          style={{ color: accentColor }}
        />
      )}
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:bg-white/[0.04]`}
        style={surface}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} style={surface}>
      {content}
    </div>
  );
};

const MilestoneList: React.FC<MilestoneListProps> = ({
  items,
  accentColor,
  glassSurface = false,
  canEdit = false,
  blockIdPrefix = 'milestones',
  onPatchItems,
}) => {
  const surface = glassSurface ? MILESTONE_SURFACE.glass : MILESTONE_SURFACE.plain;
  const editable = canEdit && Boolean(onPatchItems);
  const [drafts, setDrafts] = useState(items);

  useEffect(() => {
    setDrafts(items);
  }, [items]);

  const patchItems = async (next: MilestoneItem[]) => {
    if (!onPatchItems) return;
    await onPatchItems(next);
  };

  const updateItem = (index: number, next: MilestoneItem) => {
    const updated = items.map((item, i) => (i === index ? next : item));
    return patchItems(updated);
  };

  const updateGroupChild = (groupIndex: number, childIndex: number, next: MilestoneChild) => {
    const updated = items.map((item, i) => {
      if (i !== groupIndex || !isMilestoneGroup(item)) return item;
      return {
        ...item,
        children: item.children.map((child, ci) => (ci === childIndex ? next : child)),
      };
    });
    return patchItems(updated);
  };

  const renderEditableChild = (
    child: MilestoneChild,
    childIndex: number,
    groupIndex: number,
    rowProps: Partial<React.ComponentProps<typeof MilestoneRow>>,
  ) => {
    const blockId = `${blockIdPrefix}-group-${groupIndex}-child-${childIndex}`;

    return (
      <InlineEditBlock
        key={blockId}
        blockId={blockId}
        canEdit={editable}
        className="min-w-0"
        editClassName="px-1 -mx-1"
        controlsPlacement="inset"
        onCancel={() => setDrafts(items)}
        onSave={async () => {
          const draft = getGroupChildDraft(drafts, groupIndex, childIndex, child);
          await updateGroupChild(groupIndex, childIndex, draftToChild(draft));
        }}
      >
        {(editing) => {
          const draft = getGroupChildDraft(drafts, groupIndex, childIndex, child);

          return editing ? (
            <div className="space-y-1.5 py-0.5">
              <input
                autoFocus
                value={draft.text}
                onChange={(e) =>
                  setDrafts((prev) =>
                    updateGroupChildDraft(prev, groupIndex, childIndex, {
                      text: e.target.value,
                    }),
                  )
                }
                className={fieldInputClass}
                placeholder="Milestone text"
              />
              <input
                value={draft.url}
                onChange={(e) =>
                  setDrafts((prev) =>
                    updateGroupChildDraft(prev, groupIndex, childIndex, {
                      url: e.target.value,
                    }),
                  )
                }
                className={fieldInputClass}
                placeholder="https:// (optional)"
              />
            </div>
          ) : (
            <MilestoneRow
              label={milestoneLabel(child)}
              url={milestoneUrl(child)}
              accentColor={accentColor}
              {...rowProps}
            />
          );
        }}
      </InlineEditBlock>
    );
  };

  const renderEditableItem = (item: MilestoneItem, index: number) => {
    if (isMilestoneGroup(item)) {
      const blockId = `${blockIdPrefix}-group-${index}`;

      return (
        <div key={milestoneKey(item, index)} className="rounded-xl px-3 py-2.5" style={surface}>
          <InlineEditBlock
            blockId={blockId}
            canEdit={editable}
            className="min-w-0"
            editClassName="px-1 -mx-1"
            controlsPlacement="inset"
            onCancel={() => setDrafts(items)}
            onSave={async () => {
              const draftItem = drafts[index];
              if (!isMilestoneGroup(draftItem)) return;
              await updateItem(index, {
                ...item,
                label: draftItem.label.trim() || item.label,
              });
            }}
          >
            {(editing) =>
              editing ? (
                <input
                  autoFocus
                  value={isMilestoneGroup(drafts[index]) ? drafts[index].label : item.label}
                  onChange={(e) =>
                    setDrafts((prev) =>
                      prev.map((entry, i) =>
                        i === index && isMilestoneGroup(entry)
                          ? { ...entry, label: e.target.value }
                          : entry,
                      ),
                    )
                  }
                  className={fieldInputClass}
                  placeholder="Group title"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: accentColor }}
                  />
                  <span className="text-sm text-white/85">{item.label}</span>
                </div>
              )
            }
          </InlineEditBlock>

          {item.children.length > 0 && (
            <ul className="mt-2 ml-5 space-y-1.5">
              {item.children.map((child, childIndex) => (
                <li key={`${milestoneLabel(child)}-${childIndex}`}>
                  {renderEditableChild(child, childIndex, index, {
                    textClassName: 'text-sm text-white/60',
                    dotClassName: 'w-1 h-1',
                    dotOpacity: 0.55,
                    className:
                      'group flex items-start gap-2.5 py-0.5 rounded-md transition-colors duration-150',
                  })}
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <p className="mt-2 ml-5 text-[10px] text-white/25">
              Add or remove group items in Advanced
            </p>
          )}
        </div>
      );
    }

    const blockId = `${blockIdPrefix}-item-${index}`;

    return (
      <InlineEditBlock
        key={milestoneKey(item, index)}
        blockId={blockId}
        canEdit={editable}
        className="min-w-0"
        editClassName="px-1 -mx-1"
        controlsPlacement="inset"
        onCancel={() => setDrafts(items)}
        onSave={async () => {
          const draft = getItemDraft(drafts, index, item);
          await updateItem(index, draftToChild(draft));
        }}
      >
        {(editing) => {
          const draft = getItemDraft(drafts, index, item);

          return editing ? (
            <div
              className="space-y-1.5 rounded-xl px-3 py-2.5"
              style={surface}
            >
              <input
                autoFocus
                value={draft.text}
                onChange={(e) =>
                  setDrafts((prev) =>
                    updateItemDraft(prev, index, { text: e.target.value }),
                  )
                }
                className={fieldInputClass}
                placeholder="Milestone text"
              />
              <input
                value={draft.url}
                onChange={(e) =>
                  setDrafts((prev) =>
                    updateItemDraft(prev, index, { url: e.target.value }),
                  )
                }
                className={fieldInputClass}
                placeholder="https:// (optional)"
              />
            </div>
          ) : (
            <MilestoneRow
              label={milestoneLabel(item)}
              url={milestoneUrl(item)}
              accentColor={accentColor}
              surface={surface}
            />
          );
        }}
      </InlineEditBlock>
    );
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => renderEditableItem(item, index))}

      {editable && (
        <button
          type="button"
          onClick={() => void patchItems([...items, 'New milestone'])}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add milestone
        </button>
      )}
    </div>
  );
};

export default MilestoneList;
