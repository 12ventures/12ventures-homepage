import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import { HavenProductFilterMenu } from './HavenProductFilterMenu';
import {
  applyProductFilters,
  categoryLabel,
  collectStoreOptions,
  DEFAULT_PRODUCT_FILTERS,
} from './productFilters';
import type {
  HavenMoodboard,
  HavenProduct,
  MoodboardCard,
  MoodboardItem,
  MoodboardPaletteSlot,
  MoodboardTextAlign,
  MoodboardTextItem,
  MoodboardTextWeight,
  ProductCatalogFilters,
} from './types';
import {
  aspectRatioToCss,
  createMoodboardTextItem,
  DEFAULT_PALETTE_POSITION,
  isMoodboardImageItem,
  MOODBOARD_TEXT_MAX_CHARS,
} from './types';
import './haven-moodboard.css';

const TEXT_WEIGHT_CSS: Record<MoodboardTextWeight, number> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const MAX_ITEMS = 24;
const RESIZE_ZONE_PX = 14;
const MIN_ITEM_SIZE = 8;

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function hitResizeCorner(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  zone = RESIZE_ZONE_PX,
): ResizeCorner | null {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  const left = clientX - r.left;
  const top = clientY - r.top;
  const nearL = left <= zone;
  const nearR = r.width - left <= zone;
  const nearT = top <= zone;
  const nearB = r.height - top <= zone;
  if (nearT && nearL) return 'nw';
  if (nearT && nearR) return 'ne';
  if (nearB && nearL) return 'sw';
  if (nearB && nearR) return 'se';
  return null;
}

function cursorForCorner(corner: ResizeCorner | null): string {
  if (!corner) return 'grab';
  return corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize';
}

function applyCornerResize(
  orig: MoodboardItem,
  corner: ResizeCorner,
  dx: number,
  dy: number,
): Pick<MoodboardItem, 'x' | 'y' | 'w' | 'h'> {
  let x = orig.x;
  let y = orig.y;
  let w = orig.w;
  let h = orig.h;

  if (corner === 'se' || corner === 'ne') {
    w = clamp(orig.w + dx, MIN_ITEM_SIZE, 100 - orig.x);
  } else {
    const newW = clamp(orig.w - dx, MIN_ITEM_SIZE, orig.x + orig.w);
    x = orig.x + orig.w - newW;
    w = newW;
  }

  if (corner === 'se' || corner === 'sw') {
    h = clamp(orig.h + dy, MIN_ITEM_SIZE, 100 - orig.y);
  } else {
    const newH = clamp(orig.h - dy, MIN_ITEM_SIZE, orig.y + orig.h);
    y = orig.y + orig.h - newH;
    h = newH;
  }

  x = clamp(x, 0, 100 - w);
  y = clamp(y, 0, 100 - h);
  return { x, y, w, h };
}

function normalizeHex(raw: string, fallback: string): string {
  const t = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toLowerCase()}`;
  return fallback;
}

/** Local-only color editor — portaled to body so it isn’t clipped by the board. */
const PaletteColorPopover: React.FC<{
  role: string;
  initialHex: string;
  busy?: boolean;
  anchorRect: DOMRect;
  onApply: (hex: string) => void;
  onCancel: () => void;
}> = ({ role, initialHex, busy = false, anchorRect, onApply, onCancel }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(initialHex);
  const [pos, setPos] = useState(() => ({
    top: Math.round(anchorRect.bottom + 8),
    left: Math.round(anchorRect.left),
  }));

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const panel = el.getBoundingClientRect();
    let top = anchorRect.bottom + 8;
    let left = anchorRect.left + anchorRect.width / 2 - panel.width / 2;
    if (top + panel.height > window.innerHeight - 12) {
      top = anchorRect.top - panel.height - 8;
    }
    if (left + panel.width > window.innerWidth - 12) {
      left = window.innerWidth - panel.width - 12;
    }
    left = Math.max(12, left);
    top = Math.max(12, top);
    setPos({ top: Math.round(top), left: Math.round(left) });
  }, [anchorRect]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    const onReposition = () => onCancel();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [onCancel]);

  const canApply = /^#[0-9a-fA-F]{6}$/.test(draft);

  const colorBackdrop = useBackdropDismiss(onCancel);

  return createPortal(
    <div className="hv-mb__color-layer" role="presentation">
      <div
        className="hv-mb__color-backdrop"
        aria-hidden="true"
        onMouseDown={colorBackdrop.onMouseDown}
        onClick={colorBackdrop.onClick}
      />
      <div
        ref={rootRef}
        className="hv-mb__color-popover hv-mb__color-popover--portal"
        role="dialog"
        aria-label={`Pick ${role} color`}
        style={{ top: pos.top, left: pos.left }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label className="hv-admin__field hv-mb__color-field">
          <span className="hv-admin__label">Color</span>
          <input
            type="color"
            className="hv-mb__color-wheel"
            value={canApply ? draft : initialHex}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <label className="hv-admin__field hv-mb__color-field">
          <span className="hv-admin__label">Hex</span>
          <input
            className="hv-admin__input"
            value={draft}
            disabled={busy}
            spellCheck={false}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (/^#?[0-9a-fA-F]{0,6}$/.test(raw)) {
                setDraft(raw.startsWith('#') ? raw : raw ? `#${raw}` : '#');
              }
            }}
            onBlur={() => setDraft((d) => normalizeHex(d, initialHex))}
          />
        </label>
        <div className="hv-mb__color-actions">
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--primary"
            disabled={busy || !canApply}
            onClick={() => onApply(normalizeHex(draft, initialHex))}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/** Sample dominant-ish colors from an image URL (client-side Photo colors). */
export async function extractPhotoColors(
  imageUrl: string,
  count = 8,
): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve([]);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<string, number>();
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;
          // Skip near-white / near-black noise
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max > 245 && min > 230) continue;
          if (max < 18) continue;
          const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
        const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, count);
        resolve(
          sorted.map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
            return hex;
          }),
        );
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

function percentFromPointer(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
  const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
}

export type HavenMoodboardEditorProps = {
  board: HavenMoodboard;
  library: MoodboardCard[];
  busy?: boolean;
  /** Soft context for badges */
  linkedRoomSetId?: string | null;
  pendingStudioDraftId?: string | null;
  /** Product images available to drop onto the board (e.g. studio selection). */
  poolProducts?: HavenProduct[];
  /** Full catalog for “add more products” modal. */
  catalogProducts?: HavenProduct[];
  onChange: (board: HavenMoodboard) => void;
  onSave?: () => void;
  onSelectBoard?: (id: string) => void;
  onCreateBoard?: () => void;
  onDeleteBoard?: (id: string) => void;
  onLink?: () => void;
  onUnlink?: () => void;
  onUploadImages?: (files: FileList) => void;
};

export const HavenMoodboardEditor: React.FC<HavenMoodboardEditorProps> = ({
  board,
  library,
  busy = false,
  linkedRoomSetId = null,
  pendingStudioDraftId = null,
  poolProducts = [],
  catalogProducts = [],
  onChange,
  onSave,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onLink,
  onUnlink,
  onUploadImages,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Inline text editing on the board (double-click). */
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const inlineTextRef = useRef<HTMLTextAreaElement>(null);
  /** Slot selected for Photo colors targeting / open editor. */
  const [paletteSlot, setPaletteSlot] = useState<number | null>(null);
  const [paletteEditing, setPaletteEditing] = useState(false);
  const [paletteAnchor, setPaletteAnchor] = useState<DOMRect | null>(null);
  const [photoColors, setPhotoColors] = useState<string[]>([]);
  const [extraPoolIds, setExtraPoolIds] = useState<string[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogPickIds, setCatalogPickIds] = useState<string[]>([]);
  const [catalogFilters, setCatalogFilters] =
    useState<ProductCatalogFilters>(DEFAULT_PRODUCT_FILTERS);
  const dragRef = useRef<{
    id: string;
    mode: 'move' | 'resize';
    corner: ResizeCorner | null;
    startX: number;
    startY: number;
    orig: MoodboardItem;
  } | null>(null);
  const paletteDragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [hoverCursor, setHoverCursor] = useState<Record<string, string>>({});
  const palettePos = board.palettePosition ?? DEFAULT_PALETTE_POSITION;

  const aspectCss = aspectRatioToCss(board.boardAspectRatio) || '4 / 3';
  const selected = board.items.find((i) => i.id === selectedId) ?? null;
  const isLinked =
    Boolean(board.roomSetId && linkedRoomSetId && board.roomSetId === linkedRoomSetId) ||
    Boolean(
      board.pendingStudioDraftId &&
        pendingStudioDraftId &&
        board.pendingStudioDraftId === pendingStudioDraftId,
    );

  useEffect(() => {
    if (!selected || !isMoodboardImageItem(selected)) {
      setPhotoColors([]);
      return;
    }
    void extractPhotoColors(selected.imageUrl).then(setPhotoColors);
  }, [selected]);

  useEffect(() => {
    if (!editingTextId) return;
    const el = inlineTextRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editingTextId]);

  useEffect(() => {
    if (!editingTextId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingTextId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingTextId]);

  const updateItems = useCallback(
    (items: MoodboardItem[]) => {
      onChange({ ...board, items, updatedAt: new Date().toISOString() });
    },
    [board, onChange],
  );

  const updatePalette = useCallback(
    (palette: HavenMoodboard['palette']) => {
      onChange({ ...board, palette, updatedAt: new Date().toISOString() });
    },
    [board, onChange],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      const el = boardRef.current;
      if (!drag || !el) return;
      const cur = percentFromPointer(el, e.clientX, e.clientY);
      const dx = cur.x - drag.startX;
      const dy = cur.y - drag.startY;
      updateItems(
        board.items.map((it) => {
          if (it.id !== drag.id) return it;
          if (drag.mode === 'move' || !drag.corner) {
            return {
              ...it,
              x: clamp(drag.orig.x + dx, 0, 100 - it.w),
              y: clamp(drag.orig.y + dy, 0, 100 - it.h),
            };
          }
          return {
            ...it,
            ...applyCornerResize(drag.orig, drag.corner, dx, dy),
          };
        }),
      );
    },
    [board.items, updateItems],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [onPointerMove]);

  const onPalettePointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = paletteDragRef.current;
      const el = boardRef.current;
      if (!drag || !el) return;
      const cur = percentFromPointer(el, e.clientX, e.clientY);
      const next = {
        x: clamp(drag.origX + (cur.x - drag.startX), 0, 88),
        y: clamp(drag.origY + (cur.y - drag.startY), 0, 90),
      };
      onChange({
        ...board,
        palettePosition: next,
        updatedAt: new Date().toISOString(),
      });
    },
    [board, onChange],
  );

  const endPaletteDrag = useCallback(() => {
    paletteDragRef.current = null;
    window.removeEventListener('pointermove', onPalettePointerMove);
    window.removeEventListener('pointerup', endPaletteDrag);
  }, [onPalettePointerMove]);

  const startPaletteDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const boardEl = boardRef.current;
    if (!boardEl || busy) return;
    const start = percentFromPointer(boardEl, e.clientX, e.clientY);
    const pos = board.palettePosition ?? DEFAULT_PALETTE_POSITION;
    paletteDragRef.current = {
      startX: start.x,
      startY: start.y,
      origX: pos.x,
      origY: pos.y,
    };
    setPaletteEditing(false);
    setPaletteAnchor(null);
    window.addEventListener('pointermove', onPalettePointerMove);
    window.addEventListener('pointerup', endPaletteDrag);
  };

  const startItemPointer = (item: MoodboardItem, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const boardEl = boardRef.current;
    if (!boardEl || busy) return;
    if (editingTextId && editingTextId !== item.id) setEditingTextId(null);
    if (editingTextId === item.id) return;
    const uploading = item.kind === 'image' && item.uploading;
    const corner = uploading
      ? null
      : hitResizeCorner(e.currentTarget, e.clientX, e.clientY);
    const start = percentFromPointer(boardEl, e.clientX, e.clientY);
    dragRef.current = {
      id: item.id,
      mode: corner ? 'resize' : 'move',
      corner,
      startX: start.x,
      startY: start.y,
      orig: { ...item },
    };
    setSelectedId(item.id);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  };

  const beginTextEdit = (item: MoodboardItem, e: React.MouseEvent) => {
    if (item.kind !== 'text' || busy) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = null;
    setSelectedId(item.id);
    setEditingTextId(item.id);
  };

  const onItemHoverMove = (item: MoodboardItem, e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current || busy) return;
    if (item.kind === 'image' && item.uploading) {
      setHoverCursor((prev) =>
        prev[item.id] === 'grab' ? prev : { ...prev, [item.id]: 'grab' },
      );
      return;
    }
    const corner = hitResizeCorner(e.currentTarget, e.clientX, e.clientY);
    const cursor = cursorForCorner(corner);
    setHoverCursor((prev) =>
      prev[item.id] === cursor ? prev : { ...prev, [item.id]: cursor },
    );
  };

  const onItemHoverLeave = (itemId: string) => {
    setHoverCursor((prev) => {
      if (!prev[itemId]) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const bringForward = () => {
    if (!selected) return;
    const maxZ = Math.max(0, ...board.items.map((i) => i.zIndex));
    updateItems(
      board.items.map((i) => (i.id === selected.id ? { ...i, zIndex: maxZ + 1 } : i)),
    );
  };

  const sendBack = () => {
    if (!selected) return;
    const minZ = Math.min(0, ...board.items.map((i) => i.zIndex));
    updateItems(
      board.items.map((i) => (i.id === selected.id ? { ...i, zIndex: minZ - 1 } : i)),
    );
  };

  const removeSelected = () => {
    if (!selected) return;
    updateItems(board.items.filter((i) => i.id !== selected.id));
    setSelectedId(null);
    setEditingTextId(null);
  };

  const addTextBox = () => {
    if (busy || board.items.length >= MAX_ITEMS) return;
    const maxZ = Math.max(0, ...board.items.map((i) => i.zIndex));
    const item = createMoodboardTextItem({
      text: '',
      zIndex: maxZ + 1,
      x: 12 + (board.items.length % 3) * 4,
      y: 62 + (board.items.length % 2) * 4,
    });
    updateItems([...board.items, item]);
    setSelectedId(item.id);
    setEditingTextId(item.id);
  };

  const patchTextItem = (id: string, patch: Partial<MoodboardTextItem>) => {
    updateItems(
      board.items.map((i) =>
        i.id === id && i.kind === 'text'
          ? {
              ...i,
              ...patch,
              text:
                patch.text != null
                  ? patch.text.slice(0, MOODBOARD_TEXT_MAX_CHARS)
                  : i.text,
            }
          : i,
      ),
    );
  };

  const patchSelectedText = (patch: Partial<MoodboardTextItem>) => {
    if (!selected || selected.kind !== 'text') return;
    patchTextItem(selected.id, patch);
  };

  const imagePool = useMemo(() => {
    const byId = new Map<string, HavenProduct>();
    for (const p of poolProducts) {
      if (p.id && p.imageUrl?.trim()) byId.set(p.id, p);
    }
    for (const id of extraPoolIds) {
      if (byId.has(id)) continue;
      const p = catalogProducts.find((c) => c.id === id);
      if (p?.imageUrl?.trim()) byId.set(p.id, p);
    }
    return [...byId.values()];
  }, [poolProducts, extraPoolIds, catalogProducts]);

  const catalogWithImages = useMemo(
    () => catalogProducts.filter((p) => Boolean(p.imageUrl?.trim())),
    [catalogProducts],
  );

  const catalogStoreOptions = useMemo(
    () => collectStoreOptions(catalogWithImages),
    [catalogWithImages],
  );

  const filteredCatalogProducts = useMemo(
    () => applyProductFilters(catalogWithImages, catalogFilters),
    [catalogWithImages, catalogFilters],
  );

  const addProductImage = (product: HavenProduct) => {
    if (busy || !product.imageUrl?.trim() || board.items.length >= MAX_ITEMS) return;
    const maxZ = Math.max(0, ...board.items.map((i) => i.zIndex));
    const n = board.items.filter((i) => i.kind === 'image').length;
    const col = n % 3;
    const row = Math.floor(n / 3);
    const item: MoodboardItem = {
      id: `item_${crypto.randomUUID()}`,
      kind: 'image',
      imageUrl: product.imageUrl,
      uploadId: null,
      x: clamp(8 + col * 30, 0, 72),
      y: clamp(14 + row * 26, 0, 72),
      w: 26,
      h: 26,
      zIndex: maxZ + 1,
      link: null,
    };
    updateItems([...board.items, item]);
    setSelectedId(item.id);
  };

  const openCatalogModal = () => {
    setCatalogPickIds(extraPoolIds);
    setCatalogOpen(true);
  };

  const confirmCatalogPicks = () => {
    setExtraPoolIds(catalogPickIds);
    setCatalogOpen(false);
  };

  const toggleCatalogPick = (id: string) => {
    setCatalogPickIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const setSlotHex = (index: number, hex: string | null) => {
    const next = board.palette.map((s, i) =>
      i === index ? { ...s, hex } : s,
    ) as HavenMoodboard['palette'];
    updatePalette(next);
  };

  const cancelPaletteEditor = useCallback(() => {
    setPaletteEditing(false);
    setPaletteAnchor(null);
  }, []);

  const openPaletteEditor = (index: number, anchorEl: HTMLElement) => {
    setPaletteSlot(index);
    setPaletteEditing(true);
    setPaletteAnchor(anchorEl.getBoundingClientRect());
  };

  const applyPhotoColor = (hex: string) => {
    if (paletteSlot != null) {
      setSlotHex(paletteSlot, hex);
      return;
    }
    const empty = board.palette.findIndex((s) => !s.hex);
    if (empty >= 0) setSlotHex(empty, hex);
    else setSlotHex(0, hex);
  };

  const closeCatalog = useCallback(() => setCatalogOpen(false), []);
  const catalogBackdrop = useBackdropDismiss(closeCatalog, catalogOpen);

  const sortedItems = useMemo(
    () => [...board.items].sort((a, b) => a.zIndex - b.zIndex),
    [board.items],
  );

  const hasUploadingItems = board.items.some(
    (it) => it.kind === 'image' && it.uploading,
  );

  return (
    <div className="hv-mb">
      <div className="hv-mb__stage-wrap">
        <div
          ref={boardRef}
          className="hv-mb__board"
          style={{ aspectRatio: aspectCss }}
          onPointerDown={() => {
            setSelectedId(null);
            setEditingTextId(null);
          }}
        >
          <div className="hv-mb__board-title" aria-hidden="true">
            {board.name}
          </div>
          {sortedItems.map((item) => {
            const open = selectedId === item.id;
            const editing = editingTextId === item.id;
            const rot = item.rotationDeg ? `rotate(${item.rotationDeg}deg)` : undefined;
            const cursor = editing ? 'text' : hoverCursor[item.id] ?? 'grab';
            if (item.kind === 'text') {
              return (
                <div
                  key={item.id}
                  className={`hv-mb__item hv-mb__item--text${open ? ' is-selected' : ''}${!item.text.trim() && !editing ? ' is-empty' : ''}${editing ? ' is-editing' : ''}`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${item.w}%`,
                    height: `${item.h}%`,
                    zIndex: item.zIndex + 1,
                    transform: rot,
                    color: item.color,
                    backgroundColor: item.backgroundColor ?? 'transparent',
                    fontSize: `${item.fontSize}cqh`,
                    fontWeight: TEXT_WEIGHT_CSS[item.fontWeight],
                    textAlign: item.textAlign,
                    cursor,
                  }}
                  onPointerDown={(e) => startItemPointer(item, e)}
                  onPointerMove={(e) => {
                    if (!editing) onItemHoverMove(item, e);
                  }}
                  onPointerLeave={() => onItemHoverLeave(item.id)}
                  onDoubleClick={(e) => beginTextEdit(item, e)}
                >
                  {editing ? (
                    <textarea
                      ref={inlineTextRef}
                      className="hv-mb__text-edit"
                      value={item.text}
                      disabled={busy}
                      maxLength={MOODBOARD_TEXT_MAX_CHARS}
                      placeholder="Type here…"
                      aria-label="Edit text"
                      style={{
                        color: item.color,
                        fontWeight: TEXT_WEIGHT_CSS[item.fontWeight],
                        textAlign: item.textAlign,
                        fontSize: 'inherit',
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={(e) => patchTextItem(item.id, { text: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                    />
                  ) : (
                    <div className="hv-mb__text">
                      {item.text.trim() ? item.text : 'Text'}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div
                key={item.id}
                className={`hv-mb__item${open ? ' is-selected' : ''}${item.uploading ? ' is-uploading' : ''}`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: `${item.h}%`,
                  zIndex: item.zIndex + 1,
                  transform: rot,
                  cursor,
                }}
                onPointerDown={(e) => startItemPointer(item, e)}
                onPointerMove={(e) => onItemHoverMove(item, e)}
                onPointerLeave={() => onItemHoverLeave(item.id)}
              >
                <img src={item.imageUrl} alt="" draggable={false} />
                {item.uploading ? (
                  <div className="hv-mb__upload-veil" aria-busy="true" aria-label="Uploading">
                    <span className="hv-mb__upload-spinner" />
                  </div>
                ) : null}
              </div>
            );
          })}
          {board.items.length === 0 ? (
            <div className="hv-mb__empty">
              <p>Add images or text to build this moodboard</p>
              <div className="hv-mb__empty-actions">
                <button
                  type="button"
                  className="hv-admin__btn hv-admin__btn--ghost"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                >
                  Add images
                </button>
                <button
                  type="button"
                  className="hv-admin__btn hv-admin__btn--ghost"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    addTextBox();
                  }}
                >
                  Add text
                </button>
              </div>
            </div>
          ) : null}

          <div
            className={`hv-mb__palette-chip${paletteEditing ? ' is-editing' : ''}`}
            style={{ left: `${palettePos.x}%`, top: `${palettePos.y}%` }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="hv-mb__palette-grip"
              aria-label="Drag palette"
              title="Drag palette"
              disabled={busy}
              onPointerDown={startPaletteDrag}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="hv-mb__swatches hv-mb__swatches--chip">
              {board.palette.map((slot: MoodboardPaletteSlot, i) => (
                <button
                  key={`${slot.role}-${i}`}
                  type="button"
                  className={`hv-mb__swatch${paletteSlot === i && paletteEditing ? ' is-active' : ''}`}
                  style={slot.hex ? { background: slot.hex } : undefined}
                  title={`${slot.role}${slot.hex ? ` · ${slot.hex}` : ''}`}
                  disabled={busy}
                  onClick={(e) => {
                    if (paletteEditing && paletteSlot === i) {
                      cancelPaletteEditor();
                      return;
                    }
                    openPaletteEditor(i, e.currentTarget);
                  }}
                  aria-label={`Edit ${slot.role} color`}
                >
                  {!slot.hex ? <span>+</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {paletteEditing && paletteSlot != null && paletteAnchor ? (
        <PaletteColorPopover
          key={paletteSlot}
          role={board.palette[paletteSlot]?.role ?? 'color'}
          initialHex={board.palette[paletteSlot]?.hex ?? '#5f6f52'}
          busy={busy}
          anchorRect={paletteAnchor}
          onCancel={cancelPaletteEditor}
          onApply={(hex) => {
            setSlotHex(paletteSlot, hex);
            cancelPaletteEditor();
          }}
        />
      ) : null}

      <aside className="hv-mb__rail">
        <label className="hv-admin__field">
          <span className="hv-admin__label">Board name</span>
          <input
            className="hv-admin__input"
            value={board.name}
            disabled={busy}
            onChange={(e) =>
              onChange({
                ...board,
                name: e.target.value,
                updatedAt: new Date().toISOString(),
              })
            }
            placeholder="Modern Coastal"
          />
        </label>

        {selected && photoColors.length > 0 ? (
          <div className="hv-mb__photo-colors">
            <p className="hv-admin__label">Photo colors</p>
            <div className="hv-mb__swatches hv-mb__swatches--photo">
              {photoColors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className="hv-mb__swatch"
                  style={{ background: hex }}
                  title={hex}
                  disabled={busy}
                  onClick={() => applyPhotoColor(hex)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {(poolProducts.length > 0 || catalogWithImages.length > 0) ? (
          <div className="hv-mb__pool">
            <div className="hv-mb__rail-head">
              <p className="hv-admin__label">Product images</p>
              <p className="hv-admin__panel-meta">{imagePool.length} in pool</p>
            </div>
            {imagePool.length > 0 ? (
              <div className="hv-mb__pool-grid">
                {imagePool.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="hv-mb__pool-thumb"
                    disabled={busy || board.items.length >= MAX_ITEMS}
                    title={`Add ${p.name}`}
                    aria-label={`Add ${p.name} to moodboard`}
                    onClick={() => addProductImage(p)}
                  >
                    <img src={p.imageUrl!} alt="" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="hv-admin__panel-meta">No product images in the pool yet.</p>
            )}
            {catalogWithImages.length > 0 ? (
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={busy}
                onClick={openCatalogModal}
              >
                Browse catalog
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="hv-mb__rail-actions">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hv-admin__file-input"
            onChange={(e) => {
              if (e.target.files?.length) onUploadImages?.(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--ghost"
            disabled={busy || board.items.length >= MAX_ITEMS}
            onClick={() => fileRef.current?.click()}
          >
            Add images
          </button>
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--ghost"
            disabled={busy || board.items.length >= MAX_ITEMS}
            onClick={addTextBox}
          >
            Add text
          </button>
          {onSave ? (
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--primary"
              disabled={busy || hasUploadingItems}
              onClick={onSave}
              title={hasUploadingItems ? 'Wait for uploads to finish' : undefined}
            >
              Save board
            </button>
          ) : null}
        </div>

        {selected ? (
          <div className="hv-mb__item-tools">
            <p className="hv-admin__label">
              Selected {selected.kind === 'text' ? 'text' : 'image'}
            </p>
            <div className="hv-mb__row">
              <button type="button" className="hv-admin__btn hv-admin__btn--ghost" onClick={bringForward} disabled={busy}>
                Forward
              </button>
              <button type="button" className="hv-admin__btn hv-admin__btn--ghost" onClick={sendBack} disabled={busy}>
                Back
              </button>
              <button type="button" className="hv-admin__btn hv-admin__btn--ghost" onClick={removeSelected} disabled={busy}>
                Remove
              </button>
            </div>
            {selected.kind === 'text' ? (
              <>
                <label className="hv-admin__field">
                  <span className="hv-admin__label">Text</span>
                  <textarea
                    className="hv-admin__input hv-mb__text-input"
                    value={selected.text}
                    disabled={busy}
                    rows={3}
                    maxLength={MOODBOARD_TEXT_MAX_CHARS}
                    placeholder="Soft linen · warm oak"
                    onChange={(e) => patchSelectedText({ text: e.target.value })}
                  />
                </label>
                <label className="hv-admin__field">
                  <span className="hv-admin__label">Size (% of board height)</span>
                  <input
                    className="hv-admin__input"
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    value={selected.fontSize}
                    disabled={busy}
                    onChange={(e) =>
                      patchSelectedText({
                        fontSize: clamp(Number(e.target.value) || 4, 1, 24),
                      })
                    }
                  />
                </label>
                <label className="hv-admin__field">
                  <span className="hv-admin__label">Weight</span>
                  <select
                    className="hv-admin__input"
                    value={selected.fontWeight}
                    disabled={busy}
                    onChange={(e) =>
                      patchSelectedText({
                        fontWeight: e.target.value as MoodboardTextWeight,
                      })
                    }
                  >
                    <option value="regular">Regular</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                  </select>
                </label>
                <label className="hv-admin__field">
                  <span className="hv-admin__label">Align</span>
                  <select
                    className="hv-admin__input"
                    value={selected.textAlign}
                    disabled={busy}
                    onChange={(e) =>
                      patchSelectedText({
                        textAlign: e.target.value as MoodboardTextAlign,
                      })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="hv-admin__field">
                  <span className="hv-admin__label">Color</span>
                  <input
                    className="hv-admin__input"
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(selected.color) ? selected.color : '#1a1a1a'}
                    disabled={busy}
                    onChange={(e) => patchSelectedText({ color: e.target.value })}
                  />
                </label>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="hv-mb__library">
          <div className="hv-mb__rail-head">
            <p className="hv-admin__label">Your moodboards</p>
            {onCreateBoard ? (
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={busy}
                onClick={onCreateBoard}
              >
                New
              </button>
            ) : null}
          </div>
          <div className="hv-mb__link-row">
            {isLinked ? (
              <span className="hv-mb__badge">Linked to this room set</span>
            ) : (
              <span className="hv-mb__badge hv-mb__badge--muted">Not linked</span>
            )}
            {isLinked && onUnlink ? (
              <button type="button" className="hv-admin__btn hv-admin__btn--ghost" disabled={busy} onClick={onUnlink}>
                Unlink
              </button>
            ) : null}
            {!isLinked && onLink ? (
              <button type="button" className="hv-admin__btn hv-admin__btn--ghost" disabled={busy} onClick={onLink}>
                Link here
              </button>
            ) : null}
          </div>
          <ul className="hv-mb__lib-list">
            {library.map((card) => {
              const active = card.id === board.id;
              const linked =
                Boolean(linkedRoomSetId && card.roomSetId === linkedRoomSetId) ||
                Boolean(
                  pendingStudioDraftId && card.pendingStudioDraftId === pendingStudioDraftId,
                );
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    className={`hv-mb__lib-item${active ? ' is-active' : ''}`}
                    disabled={busy}
                    onClick={() => onSelectBoard?.(card.id)}
                  >
                    <span className="hv-mb__lib-thumb">
                      {card.coverImageUrl ? (
                        <img src={card.coverImageUrl} alt="" />
                      ) : (
                        <span className="hv-mb__lib-thumb-empty" />
                      )}
                    </span>
                    <span className="hv-mb__lib-copy">
                      <span className="hv-mb__lib-name">{card.name}</span>
                      <span className="hv-mb__lib-meta">
                        {card.itemCount} item{card.itemCount === 1 ? '' : 's'}
                        {linked ? ' · linked' : ''}
                      </span>
                    </span>
                  </button>
                  {onDeleteBoard && active ? (
                    <button
                      type="button"
                      className="hv-mb__lib-del"
                      disabled={busy}
                      aria-label={`Delete ${card.name}`}
                      onClick={() => onDeleteBoard(card.id)}
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {catalogOpen ? (
        <div
          className="hv-mb__catalog-modal"
          role="dialog"
          aria-label="Add products to image pool"
          onMouseDown={catalogBackdrop.onMouseDown}
          onClick={catalogBackdrop.onClick}
        >
          <div
            className="hv-mb__catalog-card"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="hv-mb__rail-head">
              <p className="hv-admin__label">
                Catalog · {catalogPickIds.length} selected for pool
              </p>
              <div className="hv-admin__studio-rail-tools">
                <HavenProductFilterMenu
                  value={catalogFilters}
                  onChange={setCatalogFilters}
                  storeOptions={catalogStoreOptions}
                  disabled={busy}
                  align="end"
                />
                <button
                  type="button"
                  className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
                  onClick={() => setCatalogOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="hv-mb__catalog-grid">
              {filteredCatalogProducts.length === 0 ? (
                <p className="hv-admin__empty">No products match these filters.</p>
              ) : null}
              {filteredCatalogProducts.map((p) => {
                const picked = catalogPickIds.includes(p.id);
                const inStudioPool = poolProducts.some((x) => x.id === p.id);
                const selected = picked || inStudioPool;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`hv-mb__catalog-tile${selected ? ' is-selected' : ''}`}
                    disabled={busy || inStudioPool}
                    title={
                      inStudioPool
                        ? `${p.name} (already in room set pool)`
                        : picked
                          ? `Remove ${p.name}`
                          : `Add ${p.name}`
                    }
                    onClick={() => {
                      if (inStudioPool) return;
                      toggleCatalogPick(p.id);
                    }}
                  >
                    <img src={p.imageUrl!} alt="" />
                    <span className="hv-mb__catalog-tile-copy">
                      <span className="hv-mb__catalog-tile-name">{p.name}</span>
                      {p.category ? (
                        <span className="hv-mb__catalog-tile-meta">
                          {categoryLabel(p.category)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="hv-mb__color-actions">
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                onClick={() => setCatalogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary"
                disabled={busy}
                onClick={confirmCatalogPicks}
              >
                Add to pool
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HavenMoodboardEditor;
