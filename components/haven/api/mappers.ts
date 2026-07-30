import type {
  HavenHotspot,
  HavenJobStatus,
  HavenMoodboard,
  HavenMoodboardPalette,
  HavenProduct,
  HavenProductCategory,
  HavenProductDetail,
  HavenProductPage,
  MoodboardCard,
  MoodboardItem,
  MoodboardItemLink,
  MoodboardPage,
  MoodboardPaletteRole,
  MoodboardPaletteSlot,
  MoodboardTextAlign,
  MoodboardTextWeight,
  RoomJob,
  RoomSet,
  RoomSetCard,
  RoomSetDetail,
  StylePersonality,
} from '../types';
import { formatDimensions } from '../productInputNormalize';
import { EMPTY_MOODBOARD_PALETTE } from '../types';
import type {
  StepStatus,
  TrendBundle,
  TrendCandidate,
  TrendCandidateOrigin,
  TrendConfidence,
  TrendItem,
  TrendRun,
  TrendRunStart,
  TrendRunStatus,
  TrendRunStep,
  TrendSearchRequest,
  TrendSearchResult,
  TrendSourceChip,
  TrendSourceLink,
  TrendSourceStatus,
} from '../trendTypes';
import { TREND_STEP_FALLBACK } from '../trendTypes';

export function itemsOf<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: T[] }).items;
  }
  return [];
}

export function asCategory(raw: string | undefined): HavenProductCategory {
  const allowed: HavenProductCategory[] = [
    'sofa',
    'rug',
    'table',
    'lighting',
    'decor',
    'chair',
    'other',
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as HavenProductCategory;
  return 'other';
}

export function mapStyle(row: Record<string, unknown>): StylePersonality {
  const inspired = row.inspired_by ?? row.inspiredBy;
  const baseUrl = row.baseRoomImageUrl ?? row.base_room_image_url;
  const baseAspect = row.baseRoomAspectRatio ?? row.base_room_aspect_ratio;
  const baseW = row.baseRoomWidth ?? row.base_room_width;
  const baseH = row.baseRoomHeight ?? row.base_room_height;
  const previewUrl = row.previewImageUrl ?? row.preview_image_url;
  return {
    id: String(row.id ?? ''),
    label: String(row.label ?? ''),
    blurb: String(row.blurb ?? ''),
    inspiredBy: Array.isArray(inspired) ? inspired.map(String) : [],
    sortOrder:
      row.sort_order != null
        ? Number(row.sort_order)
        : row.sortOrder != null
          ? Number(row.sortOrder)
          : undefined,
    baseRoomImageUrl: baseUrl != null && String(baseUrl) ? String(baseUrl) : null,
    baseRoomAspectRatio:
      baseAspect != null && String(baseAspect) ? String(baseAspect) : null,
    baseRoomWidth: baseW != null && baseW !== '' ? Number(baseW) : null,
    baseRoomHeight: baseH != null && baseH !== '' ? Number(baseH) : null,
    previewImageUrl: previewUrl != null && String(previewUrl) ? String(previewUrl) : null,
  };
}

/** Style picker thumbnail: furnished preview if present, else empty shell. */
export function stylePickerThumb(style: StylePersonality): string | null {
  return style.previewImageUrl || style.baseRoomImageUrl || null;
}

export function mapProduct(p: Record<string, unknown>): HavenProduct {
  const sku = p.externalSku ?? p.external_sku;
  const storeKey = p.storeKey ?? p.store_key;
  const createdAt = p.createdAt ?? p.created_at;
  const merchantRaw = p.merchant;
  return {
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    merchant: merchantRaw != null ? String(merchantRaw) : '',
    price: Number(p.price ?? 0),
    imageUrl: String(p.imageUrl ?? p.image_url ?? ''),
    affiliateUrl: String(p.affiliateUrl ?? p.affiliate_url ?? ''),
    category: asCategory(String(p.category ?? 'other')),
    storeKey:
      storeKey != null && String(storeKey).trim() ? String(storeKey).trim() : null,
    ...(sku != null && String(sku) ? { externalSku: String(sku) } : {}),
    ...(createdAt != null && String(createdAt)
      ? { createdAt: String(createdAt) }
      : {}),
  };
}

export function mapProductDetail(p: Record<string, unknown>): HavenProductDetail {
  const base = mapProduct(p);
  const dims = p.dimensions;
  const featuredSort = p.featuredSort ?? p.featured_sort;
  const source = p.source;
  const createdAt = p.createdAt ?? p.created_at;
  const updatedAt = p.updatedAt ?? p.updated_at;
  const dimensionsLabel = formatDimensions(dims);
  return {
    ...base,
    dimensions: dimensionsLabel || null,
    featured: Boolean(p.featured),
    featuredSort:
      featuredSort != null && featuredSort !== '' ? Number(featuredSort) : undefined,
    active: p.active !== false,
    source: source != null && String(source) ? String(source) : null,
    createdAt: createdAt != null ? String(createdAt) : undefined,
    updatedAt: updatedAt != null ? String(updatedAt) : undefined,
  };
}

export function mapProductPage(data: Record<string, unknown>): HavenProductPage {
  const rawItems = data.items;
  const items = Array.isArray(rawItems)
    ? rawItems
        .map((row) => mapProduct(row as Record<string, unknown>))
        .filter((p) => p.id)
    : [];
  const next = data.nextCursor ?? data.next_cursor;
  return {
    items,
    nextCursor: next != null && String(next) ? String(next) : null,
    hasMore: Boolean(data.hasMore ?? data.has_more),
    limit: Number(data.limit ?? (items.length || 24)),
  };
}

/** Hotspot coords are percent of image width/height (0–100). Accept 0–1 API values. */
function asHotspotPercent(n: unknown): number {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return 0;
  const pct = v > 0 && v <= 1 ? v * 100 : v;
  return Math.min(100, Math.max(0, pct));
}

export function mapHotspot(h: Record<string, unknown>, index = 0): HavenHotspot {
  const productId = String(h.productId ?? h.product_id ?? '');
  const rawId = h.id != null && String(h.id) ? String(h.id) : '';
  return {
    id: rawId || `hs_${productId || 'p'}_${index}`,
    productId,
    x: asHotspotPercent(h.x),
    y: asHotspotPercent(h.y),
    label: String(h.label ?? ''),
  };
}

export function mapRoomSet(row: Record<string, unknown>): RoomSet {
  const productIds = row.productIds ?? row.product_ids;
  const tags = row.tags;
  const hotspots = row.hotspots;
  const genStatus = row.generateStatus ?? row.generate_status;
  const genProgress = row.generateProgress ?? row.generate_progress;
  const genMessage = row.generateMessage ?? row.generate_message;
  const genError = row.generateError ?? row.generate_error;
  const genJobId = row.generateJobId ?? row.generate_job_id;
  return {
    id: String(row.id ?? ''),
    styleId: String(row.styleId ?? row.style_id ?? ''),
    label: String(row.label ?? ''),
    blurb: row.blurb != null ? String(row.blurb) : undefined,
    productIds: Array.isArray(productIds) ? productIds.map(String) : [],
    imageUrl: String(row.imageUrl ?? row.image_url ?? row.referenceImageUrl ?? row.reference_image_url ?? ''),
    hotspots: Array.isArray(hotspots)
      ? hotspots.map((h, i) => mapHotspot(h as Record<string, unknown>, i))
      : [],
    tags: Array.isArray(tags) ? tags.map(String) : [],
    featured: Boolean(row.featured),
    enabled: row.enabled !== false,
    sortOrder:
      row.sortOrder != null
        ? Number(row.sortOrder)
        : row.sort_order != null
          ? Number(row.sort_order)
          : undefined,
    imageWidth:
      row.imageWidth != null
        ? Number(row.imageWidth)
        : row.image_width != null
          ? Number(row.image_width)
          : undefined,
    imageHeight:
      row.imageHeight != null
        ? Number(row.imageHeight)
        : row.image_height != null
          ? Number(row.image_height)
          : undefined,
    aspectRatio:
      row.aspectRatio != null
        ? String(row.aspectRatio)
        : row.aspect_ratio != null
          ? String(row.aspect_ratio)
          : undefined,
    generateStatus: genStatus != null ? String(genStatus) : null,
    generateProgress:
      genProgress != null && genProgress !== ''
        ? Number(genProgress)
        : null,
    generateMessage: genMessage != null ? String(genMessage) : null,
    generateError: genError != null ? String(genError) : null,
    generateJobId: genJobId != null ? String(genJobId) : null,
  };
}

export function mapRoomSetCard(row: Record<string, unknown>): RoomSetCard {
  const tags = row.tags;
  const count = row.productCount ?? row.product_count;
  const productIds = row.productIds ?? row.product_ids;
  return {
    id: String(row.id ?? ''),
    styleId: String(row.styleId ?? row.style_id ?? ''),
    label: String(row.label ?? ''),
    blurb: row.blurb != null ? String(row.blurb) : undefined,
    imageUrl: String(row.imageUrl ?? row.image_url ?? ''),
    productCount:
      count != null && count !== ''
        ? Number(count)
        : Array.isArray(productIds)
          ? productIds.length
          : 0,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    featured: Boolean(row.featured),
    aspectRatio:
      row.aspectRatio != null
        ? String(row.aspectRatio)
        : row.aspect_ratio != null
          ? String(row.aspect_ratio)
          : null,
  };
}

export function mapRoomSetGenerateJob(row: Record<string, unknown>): {
  jobId: string;
  status: string;
  progress?: number;
  message?: string;
  reusedBaseRoom?: boolean;
  error?: string | null;
} {
  return {
    jobId: String(row.jobId ?? row.job_id ?? row.id ?? ''),
    status: String(row.status ?? ''),
    progress:
      row.progress != null
        ? Number(row.progress)
        : row.generateProgress != null
          ? Number(row.generateProgress)
          : undefined,
    message:
      row.message != null
        ? String(row.message)
        : row.generateMessage != null
          ? String(row.generateMessage)
          : undefined,
    reusedBaseRoom: Boolean(row.reusedBaseRoom ?? row.reused_base_room),
    error:
      row.error != null
        ? String(row.error)
        : row.generateError != null
          ? String(row.generateError)
          : null,
  };
}

export function mapRoomSetDetail(row: Record<string, unknown>): RoomSetDetail {
  // Create/detail may nest under data.roomSet
  const nested =
    row.roomSet && typeof row.roomSet === 'object'
      ? (row.roomSet as Record<string, unknown>)
      : row.room_set && typeof row.room_set === 'object'
        ? (row.room_set as Record<string, unknown>)
        : row;
  const products = nested.products ?? row.products;
  return {
    ...mapRoomSet(nested),
    products: Array.isArray(products)
      ? products.map((p) => mapProduct(p as Record<string, unknown>))
      : [],
  };
}

export function mapJob(data: Record<string, unknown>): RoomJob {
  const status = String(data.status ?? 'failed') as HavenJobStatus;
  const notesRaw = Array.isArray(data.notes) ? data.notes : [];
  const productsRaw = Array.isArray(data.products) ? data.products : [];
  const hotspotsRaw = Array.isArray(data.hotspots) ? data.hotspots : [];

  return {
    id: String(data.id ?? data.jobId ?? ''),
    styleId: String(data.styleId ?? data.style_id ?? ''),
    originalImageUrl: String(data.originalImageUrl ?? data.original_image_url ?? ''),
    styledImageUrl: String(data.styledImageUrl ?? data.styled_image_url ?? ''),
    notes: notesRaw.map((n, i) => {
      const row = n as Record<string, unknown>;
      return {
        id: String(row.id ?? `n${i}`),
        text: String(row.text ?? ''),
      };
    }),
    products: productsRaw.map((p) => mapProduct(p as Record<string, unknown>)),
    hotspots: hotspotsRaw.map((h, i) => mapHotspot(h as Record<string, unknown>, i)),
    status,
    imageWidth:
      data.imageWidth != null
        ? Number(data.imageWidth)
        : data.image_width != null
          ? Number(data.image_width)
          : undefined,
    imageHeight:
      data.imageHeight != null
        ? Number(data.imageHeight)
        : data.image_height != null
          ? Number(data.image_height)
          : undefined,
    aspectRatio:
      data.aspectRatio != null
        ? String(data.aspectRatio)
        : data.aspect_ratio != null
          ? String(data.aspect_ratio)
          : undefined,
    error: data.error != null ? String(data.error) : null,
  };
}

function asPaletteRole(raw: unknown, fallback: MoodboardPaletteRole): MoodboardPaletteRole {
  if (raw === 'main' || raw === 'contrast' || raw === 'neutral') return raw;
  return fallback;
}

function mapPaletteSlot(
  row: unknown,
  fallbackRole: MoodboardPaletteRole,
): MoodboardPaletteSlot {
  if (!row || typeof row !== 'object') return { role: fallbackRole, hex: null };
  const r = row as Record<string, unknown>;
  const hexRaw = r.hex;
  const hex =
    hexRaw != null && String(hexRaw).trim()
      ? String(hexRaw).trim().startsWith('#')
        ? String(hexRaw).trim()
        : `#${String(hexRaw).trim()}`
      : null;
  return {
    role: asPaletteRole(r.role, fallbackRole),
    hex,
  };
}

export function mapMoodboardPalette(raw: unknown): HavenMoodboardPalette {
  const defaults = EMPTY_MOODBOARD_PALETTE;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...defaults] as HavenMoodboardPalette;
  }
  return [
    mapPaletteSlot(raw[0], 'main'),
    mapPaletteSlot(raw[1], 'main'),
    mapPaletteSlot(raw[2], 'contrast'),
    mapPaletteSlot(raw[3], 'neutral'),
    mapPaletteSlot(raw[4], 'neutral'),
  ];
}

function mapMoodboardLink(raw: unknown): MoodboardItemLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const type = String(r.type ?? '');
  if (type === 'product' && r.productId != null) {
    return { type: 'product', productId: String(r.productId) };
  }
  if (type === 'url' && r.url != null && String(r.url).trim()) {
    return { type: 'url', url: String(r.url).trim() };
  }
  return null;
}

function asTextWeight(raw: unknown): MoodboardTextWeight {
  const v = String(raw ?? 'medium');
  if (v === 'regular' || v === 'medium' || v === 'semibold' || v === 'bold') return v;
  return 'medium';
}

function asTextAlign(raw: unknown): MoodboardTextAlign {
  const v = String(raw ?? 'left');
  if (v === 'left' || v === 'center' || v === 'right') return v;
  return 'left';
}

export function mapMoodboardItem(row: Record<string, unknown>, index = 0): MoodboardItem {
  const kindRaw = String(row.kind ?? 'image');
  const layout = {
    id: String(row.id ?? `mb-item-${index}`),
    x: Number(row.x ?? 10),
    y: Number(row.y ?? 10),
    w: Number(row.w ?? (kindRaw === 'text' ? 40 : 28)),
    h: Number(row.h ?? (kindRaw === 'text' ? 12 : 28)),
    zIndex: Number(row.zIndex ?? row.z_index ?? index),
    rotationDeg:
      row.rotationDeg != null
        ? Number(row.rotationDeg)
        : row.rotation_deg != null
          ? Number(row.rotation_deg)
          : kindRaw === 'text'
            ? 0
            : undefined,
  };

  if (kindRaw === 'text') {
    const text = String(row.text ?? '').slice(0, 2000);
    const bg =
      row.backgroundColor != null
        ? String(row.backgroundColor)
        : row.background_color != null
          ? String(row.background_color)
          : null;
    return {
      ...layout,
      kind: 'text',
      text,
      fontSize: Number(row.fontSize ?? row.font_size ?? 4) || 4,
      fontWeight: asTextWeight(row.fontWeight ?? row.font_weight),
      textAlign: asTextAlign(row.textAlign ?? row.text_align),
      color: String(row.color ?? '#1a1a1a'),
      backgroundColor: bg && bg !== 'null' ? bg : null,
    };
  }

  return {
    ...layout,
    kind: 'image',
    imageUrl: String(row.imageUrl ?? row.image_url ?? ''),
    uploadId:
      row.uploadId != null
        ? String(row.uploadId)
        : row.upload_id != null
          ? String(row.upload_id)
          : null,
    link: mapMoodboardLink(row.link),
  };
}

export function mapMoodboard(row: Record<string, unknown>): HavenMoodboard {
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? 'Untitled moodboard'),
    styleId:
      row.styleId != null
        ? String(row.styleId)
        : row.style_id != null
          ? String(row.style_id)
          : null,
    roomSetId:
      row.roomSetId != null
        ? String(row.roomSetId)
        : row.room_set_id != null
          ? String(row.room_set_id)
          : null,
    pendingStudioDraftId:
      row.pendingStudioDraftId != null
        ? String(row.pendingStudioDraftId)
        : row.pending_studio_draft_id != null
          ? String(row.pending_studio_draft_id)
          : null,
    palette: mapMoodboardPalette(row.palette),
    palettePosition: (() => {
      const raw = row.palettePosition ?? row.palette_position;
      if (raw && typeof raw === 'object') {
        const p = raw as Record<string, unknown>;
        return {
          x: Number(p.x ?? 4),
          y: Number(p.y ?? 78),
        };
      }
      return { x: 4, y: 78 };
    })(),
    items: itemsRaw.map((it, i) => mapMoodboardItem(it as Record<string, unknown>, i)),
    boardAspectRatio:
      row.boardAspectRatio != null
        ? String(row.boardAspectRatio)
        : row.board_aspect_ratio != null
          ? String(row.board_aspect_ratio)
          : '4:3',
    createdAt: String(row.createdAt ?? row.created_at ?? ''),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? ''),
  };
}

export function mapMoodboardCard(row: Record<string, unknown>): MoodboardCard {
  const preview = row.palettePreview ?? row.palette_preview;
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? 'Untitled moodboard'),
    styleId:
      row.styleId != null
        ? String(row.styleId)
        : row.style_id != null
          ? String(row.style_id)
          : null,
    roomSetId:
      row.roomSetId != null
        ? String(row.roomSetId)
        : row.room_set_id != null
          ? String(row.room_set_id)
          : null,
    pendingStudioDraftId:
      row.pendingStudioDraftId != null
        ? String(row.pendingStudioDraftId)
        : row.pending_studio_draft_id != null
          ? String(row.pending_studio_draft_id)
          : null,
    coverImageUrl:
      row.coverImageUrl != null
        ? String(row.coverImageUrl)
        : row.cover_image_url != null
          ? String(row.cover_image_url)
          : null,
    palettePreview: Array.isArray(preview) ? preview.map(String) : [],
    itemCount: Number(row.itemCount ?? row.item_count ?? 0),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? ''),
  };
}

export function mapMoodboardPage(data: Record<string, unknown>): MoodboardPage {
  const raw = data.items;
  const items = Array.isArray(raw)
    ? raw.map((r) => mapMoodboardCard(r as Record<string, unknown>)).filter((c) => c.id)
    : [];
  return {
    items,
    nextCursor:
      data.nextCursor != null
        ? String(data.nextCursor)
        : data.next_cursor != null
          ? String(data.next_cursor)
          : null,
    hasMore: Boolean(data.hasMore ?? data.has_more ?? false),
  };
}

function asTrendRunStatus(raw: unknown): TrendRunStatus {
  const v = String(raw ?? '');
  if (v === 'queued' || v === 'processing' || v === 'ready' || v === 'failed') return v;
  return 'queued';
}

function asStepStatus(raw: unknown): StepStatus {
  const v = String(raw ?? '');
  if (v === 'pending' || v === 'active' || v === 'done' || v === 'error' || v === 'skipped') {
    return v;
  }
  return 'pending';
}

function asTrendConfidence(raw: unknown): TrendConfidence {
  const v = String(raw ?? '');
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return 'medium';
}

function asTrendSourceStatus(raw: unknown): TrendSourceStatus {
  const v = String(raw ?? '');
  if (v === 'ok' || v === 'empty' || v === 'error' || v === 'skipped') return v;
  return 'empty';
}

function mapTrendSourceChip(row: Record<string, unknown>): TrendSourceChip {
  return {
    id: String(row.id ?? ''),
    status: asTrendSourceStatus(row.status),
    detail: String(row.detail ?? ''),
    itemCount: Number(row.itemCount ?? row.item_count ?? 0),
  };
}

function mapTrendSourceLink(row: Record<string, unknown>): TrendSourceLink {
  return {
    platform: String(row.platform ?? ''),
    label: String(row.label ?? ''),
    url: row.url != null ? String(row.url) : null,
  };
}

function mapTrendItem(row: Record<string, unknown>): TrendItem {
  const tags = row.styleTags ?? row.style_tags;
  const hints = row.categoryHints ?? row.category_hints;
  const sources = row.sources;
  const queries = row.searchQueries ?? row.search_queries;
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    styleTags: Array.isArray(tags) ? tags.map(String) : [],
    categoryHints: Array.isArray(hints)
      ? hints.map((h) => asCategory(String(h)))
      : [],
    sources: Array.isArray(sources)
      ? sources.map((s) => mapTrendSourceLink(s as Record<string, unknown>))
      : [],
    searchQueries: Array.isArray(queries) ? queries.map(String) : [],
    confidence: asTrendConfidence(row.confidence),
  };
}

function mapTrendCandidate(row: Record<string, unknown>): TrendCandidate {
  const originRaw = String(row.origin ?? 'external');
  const origin: TrendCandidateOrigin =
    originRaw === 'catalog' ? 'catalog' : 'external';
  return {
    origin,
    name: String(row.name ?? ''),
    merchant: row.merchant != null ? String(row.merchant) : null,
    price:
      row.price == null || row.price === ''
        ? null
        : Number(row.price),
    imageUrl:
      row.imageUrl != null
        ? String(row.imageUrl)
        : row.image_url != null
          ? String(row.image_url)
          : null,
    affiliateUrl:
      row.affiliateUrl != null
        ? String(row.affiliateUrl)
        : row.affiliate_url != null
          ? String(row.affiliate_url)
          : null,
    category: row.category != null ? String(row.category) : null,
    productId:
      row.productId != null
        ? String(row.productId)
        : row.product_id != null
          ? String(row.product_id)
          : null,
    matchReason: String(row.matchReason ?? row.match_reason ?? ''),
    confidence: asTrendConfidence(row.confidence),
    alreadyInCatalog: Boolean(row.alreadyInCatalog ?? row.already_in_catalog),
    importReady: Boolean(row.importReady ?? row.import_ready),
  };
}

function mapTrendBundle(row: Record<string, unknown>): TrendBundle {
  const trendRaw = (row.trend ?? {}) as Record<string, unknown>;
  const candidates = row.candidates;
  const queries = row.suggestedImportQueries ?? row.suggested_import_queries;
  return {
    trend: mapTrendItem(trendRaw),
    candidates: Array.isArray(candidates)
      ? candidates.map((c) => mapTrendCandidate(c as Record<string, unknown>))
      : [],
    suggestedImportQueries: Array.isArray(queries) ? queries.map(String) : [],
  };
}

export function mapTrendSearchResult(row: Record<string, unknown>): TrendSearchResult {
  const trends = row.trends;
  const sources = row.sourceStatuses ?? row.source_statuses;
  const notes = row.notes;
  const statsRaw = (row.stats ?? {}) as Record<string, unknown>;
  return {
    trends: Array.isArray(trends)
      ? trends.map((t) => mapTrendBundle(t as Record<string, unknown>))
      : [],
    sourceStatuses: Array.isArray(sources)
      ? sources.map((s) => mapTrendSourceChip(s as Record<string, unknown>))
      : [],
    notes: Array.isArray(notes) ? notes.map(String) : [],
    stats: {
      trendsFound: Number(statsRaw.trendsFound ?? statsRaw.trends_found ?? 0),
      candidatesFound: Number(
        statsRaw.candidatesFound ?? statsRaw.candidates_found ?? 0,
      ),
      catalogMatches: Number(
        statsRaw.catalogMatches ?? statsRaw.catalog_matches ?? 0,
      ),
      externalCandidates: Number(
        statsRaw.externalCandidates ?? statsRaw.external_candidates ?? 0,
      ),
    },
  };
}

function mapTrendStep(row: Record<string, unknown>): TrendRunStep {
  return {
    key: String(row.key ?? ''),
    label: String(row.label ?? row.key ?? ''),
    status: asStepStatus(row.status),
    detail: String(row.detail ?? ''),
    at: row.at != null ? String(row.at) : null,
  };
}

function ensureTrendSteps(steps: TrendRunStep[]): TrendRunStep[] {
  if (steps.length) return steps;
  return TREND_STEP_FALLBACK.map((s) => ({
    key: s.key,
    label: s.label,
    status: 'pending' as const,
    detail: '',
    at: null,
  }));
}

export function mapTrendRunStart(row: Record<string, unknown>): TrendRunStart {
  return {
    runId: String(row.runId ?? row.run_id ?? row.id ?? ''),
    status: asTrendRunStatus(row.status),
    progress: Number(row.progress ?? 0),
    message: String(row.message ?? ''),
  };
}

export function mapTrendRun(row: Record<string, unknown>): TrendRun {
  const stepsRaw = row.steps;
  const sources = row.sourceStatuses ?? row.source_statuses;
  const resultRaw = row.result;
  const requestRaw = (row.request ?? {}) as Record<string, unknown>;
  const triggerRaw = String(row.trigger ?? 'manual');
  const steps = Array.isArray(stepsRaw)
    ? stepsRaw.map((s) => mapTrendStep(s as Record<string, unknown>))
    : [];
  const request: TrendSearchRequest = {
    region: requestRaw.region != null ? String(requestRaw.region) : undefined,
    maxTrends:
      requestRaw.maxTrends != null || requestRaw.max_trends != null
        ? Number(requestRaw.maxTrends ?? requestRaw.max_trends)
        : undefined,
    maxCandidatesPerTrend:
      requestRaw.maxCandidatesPerTrend != null ||
      requestRaw.max_candidates_per_trend != null
        ? Number(
            requestRaw.maxCandidatesPerTrend ?? requestRaw.max_candidates_per_trend,
          )
        : undefined,
    includeExternalCandidates:
      requestRaw.includeExternalCandidates != null ||
      requestRaw.include_external_candidates != null
        ? Boolean(
            requestRaw.includeExternalCandidates ??
              requestRaw.include_external_candidates,
          )
        : undefined,
    includeCatalogMatches:
      requestRaw.includeCatalogMatches != null ||
      requestRaw.include_catalog_matches != null
        ? Boolean(
            requestRaw.includeCatalogMatches ?? requestRaw.include_catalog_matches,
          )
        : undefined,
    trigger:
      requestRaw.trigger === 'scheduled' || requestRaw.trigger === 'manual'
        ? requestRaw.trigger
        : undefined,
  };

  return {
    id: String(row.id ?? ''),
    status: asTrendRunStatus(row.status),
    progress: Math.max(0, Math.min(100, Number(row.progress ?? 0))),
    stage: String(row.stage ?? ''),
    message: String(row.message ?? ''),
    trigger: triggerRaw === 'scheduled' ? 'scheduled' : 'manual',
    request,
    steps: ensureTrendSteps(steps),
    sourceStatuses: Array.isArray(sources)
      ? sources.map((s) => mapTrendSourceChip(s as Record<string, unknown>))
      : [],
    result:
      resultRaw && typeof resultRaw === 'object'
        ? mapTrendSearchResult(resultRaw as Record<string, unknown>)
        : null,
    error: row.error != null ? String(row.error) : null,
    createdAt: String(row.createdAt ?? row.created_at ?? ''),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? ''),
    finishedAt:
      row.finishedAt != null
        ? String(row.finishedAt)
        : row.finished_at != null
          ? String(row.finished_at)
          : null,
  };
}
