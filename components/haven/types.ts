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
  | 'detecting_hotspots'
  | 'ready'
  | 'failed'
  | string
  | null;

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
  'detecting_hotspots',
]);

export function isRoomSetGenerating(status?: RoomSetGenerateStatus): boolean {
  return status != null && IN_PROGRESS_GENERATE.has(String(status));
}

export function roomSetGenerateCopy(
  status?: RoomSetGenerateStatus,
  message?: string | null,
): string {
  if (message?.trim()) return message.trim();
  switch (status) {
    case 'queued':
      return 'Queued…';
    case 'ensuring_base_room':
      return 'Preparing style base room…';
    case 'composing_products':
      return 'Placing furniture in the room…';
    case 'detecting_hotspots':
      return 'Finding shoppable pins…';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Generation failed';
    default:
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
