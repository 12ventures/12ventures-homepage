import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
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

type PaletteColorPickerState = {
  index: number;
  draft: string;
  left: number;
  top: number;
};

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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5h9M5.5 3.5V2.5h3v1M4 3.5l.5 8h5l.5-8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  /** True while a save request is in flight. */
  saving?: boolean;
  /** Dismiss the editor without saving (e.g. close standalone panel). */
  onCancel?: () => void;
  onSelectBoard?: (id: string) => void;
  onCreateBoard?: () => void;
  onDeleteBoard?: (id: string) => void;
  onLink?: () => void;
  onUnlink?: () => void;
  /** Upload a local file → CDN URL for the session image pool (not the board). */
  uploadImageFile?: (
    file: File,
  ) => Promise<{ imageUrl: string; uploadId: string | null }>;
};

type SessionPoolImage = {
  id: string;
  imageUrl: string;
  uploadId: string | null;
  name: string;
  uploading?: boolean;
};

type PoolThumb = {
  id: string;
  imageUrl: string;
  uploadId: string | null;
  name: string;
  uploading?: boolean;
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
  saving = false,
  onCancel,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onLink,
  onUnlink,
  uploadImageFile,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardStateRef = useRef(board);
  const fileRef = useRef<HTMLInputElement>(null);
  const colorPickerElRef = useRef<HTMLDivElement>(null);
  const colorPickerDraftRef = useRef<string | null>(null);
  const colorPickerIndexRef = useRef<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  /** Inline text editing on the board (double-click). */
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const inlineTextRef = useRef<HTMLTextAreaElement>(null);
  /** Slot selected for Photo colors targeting / last opened swatch. */
  const [paletteSlot, setPaletteSlot] = useState<number | null>(null);
  /** Custom picker popover — draft only until dismissed. */
  const [colorPicker, setColorPicker] = useState<PaletteColorPickerState | null>(
    null,
  );
  const [photoColors, setPhotoColors] = useState<string[]>([]);
  /** Keep last good swatches per item — CDN re-extract often fails (CORS). */
  const photoColorCacheRef = useRef<Map<string, string[]>>(new Map());
  const [extraPoolIds, setExtraPoolIds] = useState<string[]>([]);
  const [sessionUploads, setSessionUploads] = useState<SessionPoolImage[]>([]);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileDragDepthRef = useRef(0);
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
    const itemId = selected.id;
    const imageUrl = selected.imageUrl;
    const cached = photoColorCacheRef.current.get(itemId);
    if (cached?.length) setPhotoColors(cached);

    let cancelled = false;
    void extractPhotoColors(imageUrl).then((colors) => {
      if (cancelled) return;
      if (colors.length) {
        photoColorCacheRef.current.set(itemId, colors);
        setPhotoColors(colors);
        return;
      }
      // Failed extract (common after blob→CDN) — keep prior swatches if any.
      if (!cached?.length) setPhotoColors([]);
    });
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.kind === 'image' ? selected.imageUrl : null]);

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

  // Keep a mutable board snapshot for async upload updates without stale closures.
  useEffect(() => {
    boardStateRef.current = board;
  }, [board]);

  // Fresh image pool when switching boards / starting a new session.
  useEffect(() => {
    setExtraPoolIds([]);
    setSessionUploads([]);
    setCatalogOpen(false);
    setCatalogPickIds([]);
    photoColorCacheRef.current.clear();
    setPhotoColors([]);
  }, [board.id]);

  // When the first image lands on an empty palette, fill swatches from that image.
  const imageCountRef = useRef(
    board.items.filter((i) => isMoodboardImageItem(i)).length,
  );
  const autofillBoardIdRef = useRef(board.id);
  useEffect(() => {
    const images = board.items.filter(isMoodboardImageItem);
    const count = images.length;

    if (autofillBoardIdRef.current !== board.id) {
      autofillBoardIdRef.current = board.id;
      imageCountRef.current = count;
      return;
    }

    const wasEmpty = imageCountRef.current === 0;
    imageCountRef.current = count;
    if (!wasEmpty || count === 0) return;
    if (!boardStateRef.current.palette.every((s) => !s.hex)) return;

    const imageUrl = images[0]?.imageUrl?.trim();
    if (!imageUrl) return;

    let cancelled = false;
    const firstId = images[0]?.id;
    void extractPhotoColors(imageUrl, boardStateRef.current.palette.length).then(
      (colors) => {
        if (cancelled || !colors.length) return;
        if (firstId) {
          photoColorCacheRef.current.set(firstId, colors);
          if (selectedIdRef.current === firstId) setPhotoColors(colors);
        }
        const current = boardStateRef.current;
        if (!current.palette.every((s) => !s.hex)) return;
        if (!current.items.some(isMoodboardImageItem)) return;
        const next = {
          ...current,
          palette: current.palette.map((slot, i) => ({
            ...slot,
            hex: colors[i] ?? null,
          })) as HavenMoodboard['palette'],
          updatedAt: new Date().toISOString(),
        };
        boardStateRef.current = next;
        onChange(next);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [board.id, board.items, onChange]);

  const updateItems = useCallback(
    (items: MoodboardItem[]) => {
      const next = { ...board, items, updatedAt: new Date().toISOString() };
      boardStateRef.current = next;
      onChange(next);
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

  const removeItem = (id: string) => {
    updateItems(board.items.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingTextId === id) setEditingTextId(null);
  };

  const removeSelected = () => {
    if (!selected) return;
    removeItem(selected.id);
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

  const imagePool = useMemo((): PoolThumb[] => {
    const byId = new Map<string, PoolThumb>();
    for (const p of poolProducts) {
      if (p.id && p.imageUrl?.trim()) {
        byId.set(`product:${p.id}`, {
          id: `product:${p.id}`,
          imageUrl: p.imageUrl,
          uploadId: null,
          name: p.name,
        });
      }
    }
    for (const id of extraPoolIds) {
      const key = `product:${id}`;
      if (byId.has(key)) continue;
      const p = catalogProducts.find((c) => c.id === id);
      if (p?.imageUrl?.trim()) {
        byId.set(key, {
          id: key,
          imageUrl: p.imageUrl,
          uploadId: null,
          name: p.name,
        });
      }
    }
    for (const u of sessionUploads) {
      byId.set(u.id, {
        id: u.id,
        imageUrl: u.imageUrl,
        uploadId: u.uploadId,
        name: u.name,
        uploading: u.uploading,
      });
    }
    return [...byId.values()];
  }, [poolProducts, extraPoolIds, catalogProducts, sessionUploads]);

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

  const addPoolImageToBoard = (thumb: PoolThumb) => {
    if (busy || thumb.uploading || !thumb.imageUrl?.trim() || board.items.length >= MAX_ITEMS) {
      return;
    }
    const maxZ = Math.max(0, ...board.items.map((i) => i.zIndex));
    const n = board.items.filter((i) => i.kind === 'image').length;
    const col = n % 3;
    const row = Math.floor(n / 3);
    const item: MoodboardItem = {
      id: `item_${crypto.randomUUID()}`,
      kind: 'image',
      imageUrl: thumb.imageUrl,
      uploadId: thumb.uploadId,
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

  const uploadFilesToPool = (files: FileList | File[] | null) => {
    if (!files?.length || !uploadImageFile || busy) return;
    const current = boardStateRef.current;
    const room = Math.max(0, MAX_ITEMS - current.items.length);
    const list = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, Math.max(room, 0));
    if (!list.length) return;

    const maxZ = Math.max(0, ...current.items.map((i) => i.zIndex));
    const existingImages = current.items.filter((i) => i.kind === 'image').length;

    const placeholders: (SessionPoolImage & {
      file: File;
      blobUrl: string;
      boardItem: MoodboardItem;
    })[] = list.map((file, i) => {
      const blobUrl = URL.createObjectURL(file);
      const id = `upload_${crypto.randomUUID()}`;
      const col = (existingImages + i) % 3;
      const row = Math.floor((existingImages + i) / 3);
      return {
        id,
        imageUrl: blobUrl,
        uploadId: null,
        name: file.name.replace(/\.[^.]+$/, '') || 'Upload',
        uploading: true,
        file,
        blobUrl,
        boardItem: {
          id,
          kind: 'image' as const,
          imageUrl: blobUrl,
          uploadId: null,
          uploading: true,
          x: clamp(8 + col * 30, 0, 72),
          y: clamp(14 + row * 26, 0, 72),
          w: 26,
          h: 26,
          zIndex: maxZ + 1 + i,
          link: null,
        },
      };
    });

    setSessionUploads((prev) => [
      ...placeholders.map(({ file: _f, blobUrl: _b, boardItem: _i, ...rest }) => rest),
      ...prev,
    ]);

    const withBoardItems = {
      ...current,
      items: [...current.items, ...placeholders.map((p) => p.boardItem)],
      updatedAt: new Date().toISOString(),
    };
    boardStateRef.current = withBoardItems;
    onChange(withBoardItems);
    const selectId = placeholders[placeholders.length - 1]?.id ?? null;
    setSelectedId(selectId);

    // Sample colors from local blobs before they are revoked after CDN upload.
    for (const entry of placeholders) {
      void extractPhotoColors(entry.blobUrl).then((colors) => {
        if (!colors.length) return;
        photoColorCacheRef.current.set(entry.id, colors);
        if (selectedIdRef.current === entry.id) setPhotoColors(colors);
      });
    }

    void (async () => {
      for (const entry of placeholders) {
        try {
          const uploaded = await uploadImageFile(entry.file);
          setSessionUploads((prev) =>
            prev.map((u) =>
              u.id === entry.id
                ? {
                    ...u,
                    imageUrl: uploaded.imageUrl,
                    uploadId: uploaded.uploadId,
                    uploading: false,
                  }
                : u,
            ),
          );
          const latest = boardStateRef.current;
          if (!latest.items.some((it) => it.id === entry.id)) continue;
          const next = {
            ...latest,
            items: latest.items.map((it) =>
              it.id === entry.id && it.kind === 'image'
                ? {
                    ...it,
                    imageUrl: uploaded.imageUrl,
                    uploadId: uploaded.uploadId,
                    uploading: false,
                  }
                : it,
            ),
            updatedAt: new Date().toISOString(),
          };
          boardStateRef.current = next;
          onChange(next);
        } catch {
          setSessionUploads((prev) => prev.filter((u) => u.id !== entry.id));
          const latest = boardStateRef.current;
          if (!latest.items.some((it) => it.id === entry.id)) continue;
          const next = {
            ...latest,
            items: latest.items.filter((it) => it.id !== entry.id),
            updatedAt: new Date().toISOString(),
          };
          boardStateRef.current = next;
          onChange(next);
        } finally {
          if (entry.blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(entry.blobUrl);
          }
        }
      }
    })();
  };

  const openCatalogModal = () => {
    setCatalogPickIds(extraPoolIds);
    setCatalogOpen(true);
  };

  const confirmCatalogPicks = () => {
    const prevPool = new Set(extraPoolIds);
    const toPlace = catalogPickIds.filter((id) => !prevPool.has(id));
    setExtraPoolIds(catalogPickIds);
    setCatalogOpen(false);

    if (!toPlace.length || busy) return;

    const current = boardStateRef.current;
    let items = [...current.items];
    let maxZ = Math.max(0, ...items.map((i) => i.zIndex));
    let imageCount = items.filter((i) => i.kind === 'image').length;
    let lastId: string | null = null;

    for (const id of toPlace) {
      if (items.length >= MAX_ITEMS) break;
      const p = catalogProducts.find((c) => c.id === id);
      if (!p?.imageUrl?.trim()) continue;
      const col = imageCount % 3;
      const row = Math.floor(imageCount / 3);
      const itemId = `item_${crypto.randomUUID()}`;
      items = [
        ...items,
        {
          id: itemId,
          kind: 'image' as const,
          imageUrl: p.imageUrl,
          uploadId: null,
          x: clamp(8 + col * 30, 0, 72),
          y: clamp(14 + row * 26, 0, 72),
          w: 26,
          h: 26,
          zIndex: ++maxZ,
          link: null,
        },
      ];
      imageCount += 1;
      lastId = itemId;
    }

    if (items.length === current.items.length) return;
    const next = {
      ...current,
      items,
      updatedAt: new Date().toISOString(),
    };
    boardStateRef.current = next;
    onChange(next);
    if (lastId) setSelectedId(lastId);
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

  const applyPaletteHex = useCallback(
    (index: number, hex: string) => {
      const current = boardStateRef.current;
      const next = {
        ...current,
        palette: current.palette.map((s, i) =>
          i === index ? { ...s, hex } : s,
        ) as HavenMoodboard['palette'],
        updatedAt: new Date().toISOString(),
      };
      boardStateRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const openSwatchColorPicker = (index: number, anchor: HTMLElement) => {
    if (colorPickerIndexRef.current === index) {
      discardColorPicker();
      return;
    }

    const hex = boardStateRef.current.palette[index]?.hex ?? '#5f6f52';
    const rect = anchor.getBoundingClientRect();
    const width = 200;
    const height = 230;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8,
    );
    const top = Math.min(
      rect.bottom + 6,
      window.innerHeight - height - 8,
    );
    setPaletteSlot(index);
    colorPickerIndexRef.current = index;
    colorPickerDraftRef.current = hex;
    setColorPicker({ index, draft: hex, left, top });
  };

  const setColorPickerDraft = (hex: string) => {
    colorPickerDraftRef.current = hex;
    setColorPicker((prev) => (prev ? { ...prev, draft: hex } : null));
  };

  const discardColorPicker = useCallback(() => {
    colorPickerIndexRef.current = null;
    colorPickerDraftRef.current = null;
    setColorPicker(null);
  }, []);

  const applyColorPicker = useCallback(() => {
    const index = colorPickerIndexRef.current;
    const hex = colorPickerDraftRef.current;
    colorPickerIndexRef.current = null;
    colorPickerDraftRef.current = null;
    setColorPicker(null);
    if (index == null || !hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    applyPaletteHex(index, hex);
  }, [applyPaletteHex]);

  useEffect(() => {
    if (!colorPicker) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (colorPickerElRef.current?.contains(target)) return;
      // Let chip swatches open/switch without fighting the dismiss handler.
      if (target.closest?.('.hv-mb__swatches--chip .hv-mb__swatch')) return;
      discardColorPicker();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') discardColorPicker();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [colorPicker, discardColorPicker]);

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

  const hasUploadingItems =
    board.items.some((it) => it.kind === 'image' && it.uploading) ||
    sessionUploads.some((u) => Boolean(u.uploading));

  return (
    <div className="hv-mb">
      <div className="hv-mb__stage-wrap">
        <div
          ref={boardRef}
          className={`hv-mb__board${fileDragOver ? ' is-file-drag' : ''}`}
          style={{ aspectRatio: aspectCss }}
          onPointerDown={() => {
            setSelectedId(null);
            setEditingTextId(null);
          }}
          onDragEnter={(e) => {
            if (!uploadImageFile || busy) return;
            if (![...e.dataTransfer.types].includes('Files')) return;
            e.preventDefault();
            e.stopPropagation();
            fileDragDepthRef.current += 1;
            setFileDragOver(true);
          }}
          onDragOver={(e) => {
            if (!uploadImageFile || busy) return;
            if (![...e.dataTransfer.types].includes('Files')) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            if (!uploadImageFile || busy) return;
            e.preventDefault();
            e.stopPropagation();
            fileDragDepthRef.current = Math.max(0, fileDragDepthRef.current - 1);
            if (fileDragDepthRef.current === 0) setFileDragOver(false);
          }}
          onDrop={(e) => {
            if (!uploadImageFile || busy) return;
            e.preventDefault();
            e.stopPropagation();
            fileDragDepthRef.current = 0;
            setFileDragOver(false);
            uploadFilesToPool(e.dataTransfer.files);
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
                ) : (
                  <button
                    type="button"
                    className="hv-mb__item-trash"
                    disabled={busy}
                    aria-label="Remove from moodboard"
                    title="Remove from moodboard"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
          {fileDragOver ? (
            <div className="hv-mb__drop-veil" aria-hidden="true">
              Drop to upload
            </div>
          ) : null}

          {board.items.length === 0 ? (
            <div className="hv-mb__empty">
              <p>Add images or text to build this moodboard</p>
              <div className="hv-mb__empty-actions">
                <button
                  type="button"
                  className="hv-admin__btn hv-admin__btn--ghost"
                  disabled={busy || !uploadImageFile}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                >
                  Upload
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
            className="hv-mb__palette-chip"
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
              {board.palette.map((slot: MoodboardPaletteSlot, i) => {
                const previewHex =
                  colorPicker?.index === i ? colorPicker.draft : slot.hex;
                return (
                  <button
                    key={`${slot.role}-${i}`}
                    type="button"
                    className={`hv-mb__swatch${paletteSlot === i ? ' is-active' : ''}`}
                    style={previewHex ? { background: previewHex } : undefined}
                    title={`${slot.role}${previewHex ? ` · ${previewHex}` : ''}`}
                    disabled={busy}
                    onClick={(e) => openSwatchColorPicker(i, e.currentTarget)}
                    aria-label={`Edit ${slot.role} color`}
                    aria-expanded={colorPicker?.index === i}
                  >
                    {!previewHex ? <span>+</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {colorPicker
        ? createPortal(
            <div
              ref={colorPickerElRef}
              className="hv-mb__color-popover"
              style={{ left: colorPicker.left, top: colorPicker.top }}
              role="dialog"
              aria-label="Pick palette color"
            >
              <HexColorPicker
                color={
                  /^#[0-9a-fA-F]{6}$/.test(colorPicker.draft)
                    ? colorPicker.draft
                    : (colorPickerDraftRef.current ?? '#5f6f52')
                }
                onChange={setColorPickerDraft}
              />
              <div className="hv-mb__color-row">
                <label className="hv-mb__color-hex">
                  <span>Hex</span>
                  <input
                    type="text"
                    value={colorPicker.draft}
                    spellCheck={false}
                    aria-label="Hex color"
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setColorPicker((prev) =>
                        prev ? { ...prev, draft: v } : null,
                      );
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                        colorPickerDraftRef.current = v;
                      }
                    }}
                    onBlur={() => {
                      const valid = colorPickerDraftRef.current;
                      if (valid) setColorPickerDraft(valid);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyColorPicker();
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="hv-mb__color-apply"
                  onClick={applyColorPicker}
                >
                  Apply
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <aside className="hv-mb__rail">
        <div className="hv-mb__rail-body">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hv-admin__file-input"
          onChange={(e) => {
            uploadFilesToPool(e.target.files);
            e.target.value = '';
          }}
        />
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

        {catalogWithImages.length > 0 || imagePool.length > 0 || uploadImageFile ? (
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
                    className={`hv-mb__pool-thumb${p.uploading ? ' is-uploading' : ''}`}
                    disabled={busy || Boolean(p.uploading) || board.items.length >= MAX_ITEMS}
                    title={
                      p.uploading
                        ? `Uploading ${p.name}…`
                        : `Add ${p.name} to moodboard`
                    }
                    aria-label={
                      p.uploading
                        ? `Uploading ${p.name}`
                        : `Add ${p.name} to moodboard`
                    }
                    onClick={() => addPoolImageToBoard(p)}
                  >
                    <img src={p.imageUrl} alt="" />
                    {p.uploading ? (
                      <span className="hv-mb__pool-thumb-veil" aria-hidden="true">
                        <span className="hv-mb__upload-spinner" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="hv-admin__panel-meta">
                Pool is empty. Upload or browse the catalog, then click a thumb to
                place images on the board.
              </p>
            )}
            <div className="hv-mb__pool-actions">
              {uploadImageFile ? (
                <button
                  type="button"
                  className="hv-admin__btn hv-admin__btn--ghost"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  Upload
                </button>
              ) : null}
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
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={busy || board.items.length >= MAX_ITEMS}
                onClick={addTextBox}
              >
                Add text
              </button>
            </div>
          </div>
        ) : (
          <div className="hv-mb__rail-actions">
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--ghost"
              disabled={busy || board.items.length >= MAX_ITEMS}
              onClick={addTextBox}
            >
              Add text
            </button>
          </div>
        )}

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
        </div>

        {onSave || onCancel ? (
          <div className="hv-mb__rail-footer">
            {onCancel ? (
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={busy}
                onClick={onCancel}
              >
                Close
              </button>
            ) : null}
            {onSave ? (
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary"
                disabled={busy || hasUploadingItems || saving}
                onClick={onSave}
                aria-busy={saving}
                title={
                  hasUploadingItems
                    ? 'Wait for uploads to finish'
                    : saving
                      ? 'Saving moodboard…'
                      : undefined
                }
              >
                {saving ? 'Saving…' : 'Save board'}
              </button>
            ) : null}
          </div>
        ) : null}
      </aside>

      {catalogOpen ? (
        <div
          className="hv-mb__catalog-modal"
          role="dialog"
          aria-label="Add products"
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
                Catalog · {catalogPickIds.length} selected
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
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HavenMoodboardEditor;
