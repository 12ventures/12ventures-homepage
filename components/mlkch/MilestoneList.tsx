import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
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

function childEquals(a: MilestoneChild, b: MilestoneChild): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (typeof a === 'object' && typeof b === 'object') {
    return a.label === b.label && a.url === b.url;
  }
  return false;
}

function milestoneEquals(a: MilestoneItem, b: MilestoneItem): boolean {
  if (isMilestoneGroup(a) !== isMilestoneGroup(b)) return false;
  if (isMilestoneGroup(a) && isMilestoneGroup(b)) {
    return (
      a.label === b.label &&
      a.children.length === b.children.length &&
      a.children.every((child, i) => childEquals(child, b.children[i]))
    );
  }
  return childEquals(a as MilestoneChild, b as MilestoneChild);
}

function itemsEqual(a: MilestoneItem[], b: MilestoneItem[]): boolean {
  return a.length === b.length && a.every((item, i) => milestoneEquals(item, b[i]));
}

function createMilestoneUid(): string {
  return `ms-${crypto.randomUUID()}`;
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
  const labelClassName = url
    ? 'text-sm text-sky-400 underline underline-offset-2 decoration-sky-400/50 hover:text-sky-300 hover:decoration-sky-300/70 flex-1 min-w-0'
    : `${textClassName} flex-1 min-w-0`;

  const content = (
    <>
      <span
        className={`${dotClassName} rounded-full flex-shrink-0 mt-0.5`}
        style={{ background: accentColor, opacity: dotOpacity }}
      />
      <span className={labelClassName}>{label}</span>
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

// Wrapper that gives each MilestoneItem a stable uid for Reorder keys
type OrderedMilestone = { uid: string; item: MilestoneItem };

function syncOrderedFromItems(
  items: MilestoneItem[],
  prev: OrderedMilestone[],
): OrderedMilestone[] {
  const unmatched = [...prev];
  return items.map((item) => {
    const matchIndex = unmatched.findIndex((entry) => milestoneEquals(entry.item, item));
    if (matchIndex >= 0) {
      const [found] = unmatched.splice(matchIndex, 1);
      return { uid: found.uid, item };
    }
    return { uid: createMilestoneUid(), item };
  });
}

// Per-item drag wrapper (needs its own useDragControls)
const DraggableMilestoneItem: React.FC<{
  value: OrderedMilestone;
  canDrag: boolean;
  onDragEnd: () => void;
  children: React.ReactNode;
}> = ({ value, canDrag, onDragEnd, children }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{ opacity: 0.9, scale: 1.01, zIndex: 30 }}
      style={{ listStyle: 'none' }}
    >
      <div className="group/drag flex items-center gap-1 min-w-0">
        {canDrag && (
          <div
            className="flex-shrink-0 opacity-0 group-hover/drag:opacity-20 hover:!opacity-55 cursor-grab active:cursor-grabbing touch-none select-none p-0.5 transition-opacity duration-150"
            onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
          >
            <GripVertical className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
          </div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </Reorder.Item>
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
  const [ordered, setOrdered] = useState<OrderedMilestone[]>(() => syncOrderedFromItems(items, []));
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const orderedRef = useRef<OrderedMilestone[]>(ordered);

  useEffect(() => {
    if (isSavingOrder) return;

    const currentItems = orderedRef.current.map((entry) => entry.item);
    if (itemsEqual(items, currentItems)) {
      const synced = syncOrderedFromItems(items, orderedRef.current);
      setDrafts(items);
      setOrdered(synced);
      orderedRef.current = synced;
      return;
    }

    const synced = syncOrderedFromItems(items, orderedRef.current);
    setDrafts(items);
    setOrdered(synced);
    orderedRef.current = synced;
  }, [items, isSavingOrder]);

  const patchItems = async (next: MilestoneItem[]) => {
    if (!onPatchItems) return;
    await onPatchItems(next);
  };

  const handleReorder = (newOrder: OrderedMilestone[]) => {
    if (isSavingOrder) return;
    setOrdered(newOrder);
    orderedRef.current = newOrder;
    setDrafts(newOrder.map((entry) => entry.item));
  };

  const handleDragEnd = async () => {
    if (isSavingOrder) return;

    const next = orderedRef.current.map((entry) => entry.item);
    if (itemsEqual(next, items)) return;

    setIsSavingOrder(true);
    try {
      await patchItems(next);
    } catch {
      const reverted = syncOrderedFromItems(items, orderedRef.current);
      setOrdered(reverted);
      orderedRef.current = reverted;
      setDrafts(items);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const removeItem = (index: number) => patchItems(items.filter((_, i) => i !== index));

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

  const removeGroupChild = (groupIndex: number, childIndex: number) => {
    const updated = items.map((entry, i) => {
      if (i !== groupIndex || !isMilestoneGroup(entry)) return entry;
      return {
        ...entry,
        children: entry.children.filter((_, ci) => ci !== childIndex),
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
        onRemove={async () => removeGroupChild(groupIndex, childIndex)}
        removeLabel={milestoneLabel(child)}
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
            onRemove={async () => removeItem(index)}
            removeLabel={item.label}
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

          {editable && item.children.length === 0 && (
            <p className="mt-2 ml-5 text-[10px] text-white/25">
              Add group items in Advanced
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
        onRemove={async () => removeItem(index)}
        removeLabel={milestoneLabel(item)}
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
    <div className="relative">
      {isSavingOrder && (
        <span
          className="pointer-events-none absolute -top-0.5 right-0 z-10 h-1.5 w-1.5 rounded-full bg-sky-400/60 animate-pulse"
          aria-hidden
        />
      )}
      <Reorder.Group
        as="div"
        axis="y"
        values={ordered}
        onReorder={handleReorder}
        className={`space-y-1.5 transition-opacity duration-150${
          isSavingOrder ? ' opacity-45 pointer-events-none' : ''
        }`}
        style={{ listStyle: 'none' }}
        aria-busy={isSavingOrder}
      >
        {ordered.map((wrapped, index) => (
          <DraggableMilestoneItem
            key={wrapped.uid}
            value={wrapped}
            canDrag={editable && !isSavingOrder}
            onDragEnd={() => void handleDragEnd()}
          >
            {renderEditableItem(wrapped.item, index)}
          </DraggableMilestoneItem>
        ))}
      </Reorder.Group>

      {editable && (
        <button
          type="button"
          disabled={isSavingOrder}
          onClick={() => void patchItems([...items, 'New milestone'])}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus className="w-3.5 h-3.5" />
          Add milestone
        </button>
      )}
    </div>
  );
};

export default MilestoneList;
