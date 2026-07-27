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
  /** Merchant SKU when present (admin / Wayfair subtitle) */
  externalSku?: string;
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

export type StudioBaseSource = 'style_cache' | 'upload_id' | 'url';

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
