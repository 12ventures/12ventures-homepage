import type {
  HavenHotspot,
  HavenJobStatus,
  HavenProduct,
  HavenProductCategory,
  RoomJob,
  RoomSet,
  RoomSetDetail,
  StylePersonality,
} from '../types';

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
  };
}

export function mapProduct(p: Record<string, unknown>): HavenProduct {
  const sku = p.externalSku ?? p.external_sku;
  return {
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    merchant: String(p.merchant ?? ''),
    price: Number(p.price ?? 0),
    imageUrl: String(p.imageUrl ?? p.image_url ?? ''),
    affiliateUrl: String(p.affiliateUrl ?? p.affiliate_url ?? ''),
    category: asCategory(String(p.category ?? 'other')),
    ...(sku != null && String(sku) ? { externalSku: String(sku) } : {}),
  };
}

/** Hotspot coords are percent of image width/height (0–100). Accept 0–1 API values. */
function asHotspotPercent(n: unknown): number {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return 0;
  const pct = v > 0 && v <= 1 ? v * 100 : v;
  return Math.min(100, Math.max(0, pct));
}

export function mapHotspot(h: Record<string, unknown>): HavenHotspot {
  return {
    id: String(h.id ?? ''),
    productId: String(h.productId ?? h.product_id ?? ''),
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
      ? hotspots.map((h) => mapHotspot(h as Record<string, unknown>))
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
    hotspots: hotspotsRaw.map((h) => mapHotspot(h as Record<string, unknown>)),
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
