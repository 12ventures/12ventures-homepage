/** Backend style ids are strings; seed uses these six. */
export type StyleId = string;

/**
 * upload — empty stage (choose photo / use demo)
 * style — room on stage, pick personality
 * generating / revealing / result — generate choreography (AI job or curated demo)
 */
export type HavenStep = 'upload' | 'style' | 'generating' | 'revealing' | 'result';

export type HavenJobStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type HavenProductCategory =
  | 'sofa'
  | 'rug'
  | 'table'
  | 'lighting'
  | 'decor'
  | 'chair'
  | 'other';

export interface StylePersonality {
  id: StyleId;
  label: string;
  blurb: string;
  /** Internal only — not primary UI */
  inspiredBy: string[];
  sortOrder?: number;
  /** Empty style shell from generate (GET /styles) */
  baseRoomImageUrl?: string | null;
  baseRoomAspectRatio?: string | null;
  baseRoomWidth?: number | null;
  baseRoomHeight?: number | null;
  /** Picker thumb: base shell or newest furnished room-set for the style */
  previewImageUrl?: string | null;
}

export interface DesignNote {
  id: string;
  text: string;
}

export interface HavenProduct {
  id: string;
  name: string;
  merchant: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  category: HavenProductCategory;
  /** Prefer for store filters — usually the URL host (e.g. wayfair.com). */
  storeKey?: string | null;
  /** Merchant SKU when present (admin / Wayfair subtitle) */
  externalSku?: string;
  createdAt?: string;
}

/** Catalog list filters for GET /products (and client-side admin lists). */
export type ProductCatalogSort = 'name' | 'newest' | 'store';

export interface ProductCatalogFilters {
  category: HavenProductCategory | null;
  /** storeKey value for ?store= */
  store: string | null;
  sort: ProductCatalogSort;
}

export interface ProductStoreOption {
  storeKey: string;
  /** merchant when known, otherwise storeKey */
  label: string;
}

/** Storefront PDP — card fields plus catalog metadata. */
export interface HavenProductDetail extends HavenProduct {
  dimensions?: string | null;
  featured?: boolean;
  featuredSort?: number;
  active?: boolean;
  source?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Cursor page for catalog / related grids. */
export interface HavenProductPage {
  items: HavenProduct[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface HavenHotspot {
  id: string;
  productId: string;
  /** Percent of image width/height (0–100), center of product */
  x: number;
  y: number;
  label: string;
}

/** Admin auto-generate pipeline for a curated room set. */
export type RoomSetGenerateStatus =
  | 'queued'
  | 'ensuring_base_room'
  | 'composing_products'
  | 'placing_batch'
  | 'detecting_hotspots'
  | 'rearranging'
  | 'ready'
  | 'failed'
  | string
  | null;

/** Soft placement bias for studio create / rearrange (percent of image). */
export interface PlacementPin {
  productId: string;
  x: number;
  y: number;
}

export type ComposeMode = 'base' | 'furnish';

/** Studio UI surface — compose modes vs moodboard canvas. */
export type StudioView = 'compose' | 'moodboard';

export type StudioBaseSource = 'style_cache' | 'upload_id' | 'url';

/** Moodboard palette slot roles (fixed 5-slot board). */
export type MoodboardPaletteRole = 'main' | 'contrast' | 'neutral';

export type MoodboardPaletteSlot = {
  role: MoodboardPaletteRole;
  hex: string | null;
};

export type MoodboardItemLink =
  | { type: 'product'; productId: string }
  | { type: 'url'; url: string };

export type MoodboardTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type MoodboardTextAlign = 'left' | 'center' | 'right';

type MoodboardItemLayout = {
  id: string;
  /** Top-left x as % of board width (0–100). */
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  rotationDeg?: number;
};

export type MoodboardImageItem = MoodboardItemLayout & {
  kind: 'image';
  imageUrl: string;
  uploadId?: string | null;
  link?: MoodboardItemLink | null;
  /** Client-only: true while the file is still uploading. */
  uploading?: boolean;
};

export type MoodboardTextItem = MoodboardItemLayout & {
  kind: 'text';
  /** Max 2000 chars; empty allowed for draft boxes. */
  text: string;
  /** Percent of board height (default 4). */
  fontSize: number;
  fontWeight: MoodboardTextWeight;
  textAlign: MoodboardTextAlign;
  color: string;
  backgroundColor: string | null;
};

export type MoodboardItem = MoodboardImageItem | MoodboardTextItem;

export const MOODBOARD_TEXT_MAX_CHARS = 2000;

export function isMoodboardImageItem(item: MoodboardItem): item is MoodboardImageItem {
  return item.kind === 'image';
}

export function isMoodboardTextItem(item: MoodboardItem): item is MoodboardTextItem {
  return item.kind === 'text';
}

/** First image item URL — cover thumbs ignore text items. */
export function moodboardCoverImageUrl(items: MoodboardItem[]): string | null {
  const first = items.find(isMoodboardImageItem);
  return first?.imageUrl?.trim() || null;
}

/** Strip client-only fields before sending items to the API. */
export function serializeMoodboardItems(items: MoodboardItem[]): MoodboardItem[] {
  return items.map((it) => {
    if (it.kind !== 'image') return it;
    const { uploading: _uploading, ...rest } = it;
    return rest;
  });
}

export function createMoodboardTextItem(
  partial?: Partial<MoodboardTextItem> & { id?: string },
): MoodboardTextItem {
  return {
    id: partial?.id ?? `mbi_${crypto.randomUUID()}`,
    kind: 'text',
    text: partial?.text ?? '',
    fontSize: partial?.fontSize ?? 4,
    fontWeight: partial?.fontWeight ?? 'medium',
    textAlign: partial?.textAlign ?? 'left',
    color: partial?.color ?? '#1a1a1a',
    backgroundColor: partial?.backgroundColor ?? null,
    x: partial?.x ?? 10,
    y: partial?.y ?? 70,
    w: partial?.w ?? 40,
    h: partial?.h ?? 12,
    zIndex: partial?.zIndex ?? 0,
    rotationDeg: partial?.rotationDeg ?? 0,
  };
}

export type HavenMoodboardPalette = [
  MoodboardPaletteSlot,
  MoodboardPaletteSlot,
  MoodboardPaletteSlot,
  MoodboardPaletteSlot,
  MoodboardPaletteSlot,
];

export type HavenMoodboard = {
  id: string;
  name: string;
  styleId?: string | null;
  roomSetId?: string | null;
  pendingStudioDraftId?: string | null;
  palette: HavenMoodboardPalette;
  /** Top-left of the on-board palette chip, % of board (0–100). */
  palettePosition?: { x: number; y: number };
  items: MoodboardItem[];
  boardAspectRatio?: string;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PALETTE_POSITION = { x: 4, y: 78 };

export type MoodboardCard = {
  id: string;
  name: string;
  styleId?: string | null;
  roomSetId?: string | null;
  pendingStudioDraftId?: string | null;
  coverImageUrl?: string | null;
  palettePreview: string[];
  itemCount: number;
  updatedAt: string;
};

export type MoodboardPage = {
  items: MoodboardCard[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const EMPTY_MOODBOARD_PALETTE: HavenMoodboardPalette = [
  { role: 'main', hex: null },
  { role: 'main', hex: null },
  { role: 'contrast', hex: null },
  { role: 'neutral', hex: null },
  { role: 'neutral', hex: null },
];

export function createEmptyMoodboard(partial?: Partial<HavenMoodboard>): HavenMoodboard {
  const now = new Date().toISOString();
  return {
    id: partial?.id ?? '',
    name: partial?.name ?? 'Untitled moodboard',
    styleId: partial?.styleId ?? null,
    roomSetId: partial?.roomSetId ?? null,
    pendingStudioDraftId: partial?.pendingStudioDraftId ?? null,
    palette: partial?.palette ?? [...EMPTY_MOODBOARD_PALETTE] as HavenMoodboardPalette,
    palettePosition: partial?.palettePosition ?? { ...DEFAULT_PALETTE_POSITION },
    items: partial?.items ?? [],
    boardAspectRatio: partial?.boardAspectRatio ?? '4:3',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
  };
}

/** Curated shoppable look (default free path). */
export interface RoomSet {
  id: string;
  styleId: StyleId;
  label: string;
  blurb?: string;
  productIds: string[];
  imageUrl: string;
  hotspots: HavenHotspot[];
  tags: string[];
  featured?: boolean;
  enabled?: boolean;
  sortOrder?: number;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  generateStatus?: RoomSetGenerateStatus;
  generateProgress?: number | null;
  generateMessage?: string | null;
  generateError?: string | null;
  generateJobId?: string | null;
}

/** Lean storefront carousel card for a featured look. */
export interface RoomSetCard {
  id: string;
  styleId: StyleId;
  label: string;
  blurb?: string;
  imageUrl: string;
  productCount: number;
  tags: string[];
  featured?: boolean;
  aspectRatio?: string | null;
}

export interface RoomSetGenerateJob {
  jobId: string;
  status: string;
  progress?: number;
  message?: string;
  reusedBaseRoom?: boolean;
  error?: string | null;
}

const IN_PROGRESS_GENERATE: ReadonlySet<string> = new Set([
  'queued',
  'ensuring_base_room',
  'composing_products',
  'placing_batch',
  'detecting_hotspots',
  'rearranging',
]);

export function isRoomSetGenerating(status?: RoomSetGenerateStatus): boolean {
  return status != null && IN_PROGRESS_GENERATE.has(String(status));
}

const PLACING_FUN_LINES = [
  'Adjusting couches…',
  'Straightening paintings…',
  'Fluffing the pillows…',
  'Lining up the lamps…',
  'Nudging the coffee table…',
  'Settling the rugs…',
  'Balancing the bookshelves…',
  'Softening the corners…',
  'Centering the chairs…',
  'Letting the light settle…',
] as const;

/** Parse "batch 2/4" style progress from API messages. */
function parseBatchProgress(message?: string | null): { current: number; total: number } | null {
  if (!message) return null;
  const m = message.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const current = Number(m[1]);
  const total = Number(m[2]);
  if (!Number.isFinite(current) || !Number.isFinite(total) || total < 1) return null;
  return { current, total };
}

function placingCopy(message?: string | null): string {
  const batch = parseBatchProgress(message);
  if (!batch || batch.total <= 1) return 'Placing furniture…';
  const idx = Math.max(0, batch.current - 1) % PLACING_FUN_LINES.length;
  return PLACING_FUN_LINES[idx];
}

export function roomSetGenerateCopy(
  status?: RoomSetGenerateStatus,
  message?: string | null,
): string {
  const msg = message?.trim() ?? '';
  const looksLikeBatch =
    /batch/i.test(msg) || /\d+\s*\/\s*\d+/.test(msg) || /placing furniture/i.test(msg);

  switch (status) {
    case 'queued':
      return 'Queued…';
    case 'ensuring_base_room':
      return 'Preparing base room…';
    case 'composing_products':
      return looksLikeBatch || !msg ? placingCopy(msg) : msg;
    case 'placing_batch':
      return placingCopy(msg);
    case 'detecting_hotspots':
      return 'Finding shoppable pins…';
    case 'rearranging':
      return 'Moving furniture…';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Generation failed';
    default:
      if (looksLikeBatch) return placingCopy(msg);
      if (msg) return msg;
      return 'Generating…';
  }
}

export interface RoomSetDetail extends RoomSet {
  products: HavenProduct[];
}

export interface RoomJob {
  id: string;
  styleId: StyleId;
  originalImageUrl: string;
  styledImageUrl: string;
  notes: DesignNote[];
  products: HavenProduct[];
  hotspots: HavenHotspot[];
  status: HavenJobStatus;
  imageWidth?: number;
  imageHeight?: number;
  /** e.g. "16:9" or "9:16" — stage must match, no cover-crop */
  aspectRatio?: string;
  error?: string | null;
  /** True when result came from a curated room set (no AI job). */
  fromCurated?: boolean;
}

export interface HavenUpload {
  uploadId: string;
  originalImageUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
}

/** CSS aspect-ratio value from API "16:9" → "16 / 9" */
export function aspectRatioToCss(aspectRatio?: string | null): string | undefined {
  if (!aspectRatio) return undefined;
  const m = aspectRatio.trim().match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
  if (!m) return undefined;
  return `${m[1]} / ${m[2]}`;
}

/** Prefer real pixel size (e.g. 1376×768) over a rounded label like "16:9". */
export function dimensionsToCssAspect(
  width?: number | null,
  height?: number | null,
): string | undefined {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return undefined;
  return `${w} / ${h}`;
}

export function resolveStageAspect(opts: {
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
}): string | undefined {
  return dimensionsToCssAspect(opts.width, opts.height) || aspectRatioToCss(opts.aspectRatio);
}

/** Numeric W/H from "1376 / 768" or "16 / 9" for CSS max-width calc. */
export function cssAspectToNumber(aspectCss?: string | null): number {
  if (!aspectCss) return 16 / 9;
  const m = aspectCss.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!m) return 16 / 9;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) return 16 / 9;
  return w / h;
}
