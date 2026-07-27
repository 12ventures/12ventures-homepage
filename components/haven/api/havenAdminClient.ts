import type {
  HavenHotspot,
  HavenProduct,
  RoomSet,
  RoomSetDetail,
  RoomSetGenerateJob,
  StylePersonality,
} from '../types';
import { getHavenApiBase } from './havenClient';
import {
  itemsOf,
  mapHotspot,
  mapProduct,
  mapRoomSet,
  mapRoomSetDetail,
  mapRoomSetGenerateJob,
  mapStyle,
} from './mappers';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export interface ProductImportResult {
  created: number;
  updated: number;
  skipped: number;
  credits_used_estimate?: number;
  creditsUsedEstimate?: number;
  ids: string[];
  errors: string[];
}

export interface ProductImportBody {
  queries: string[];
  page?: number;
  max_per_query?: number;
  category?: string | null;
  fetch_details_when_no_image?: boolean;
}

export interface CreateRoomSetInput {
  styleId: string;
  label: string;
  blurb?: string;
  productIds: string[];
  tags?: string[];
  /** Always 16:9 — ignored if passed; kept for call-site clarity. */
  aspectRatio?: '16:9';
  autoGenerate?: boolean;
  enabled?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

export interface CreateRoomSetResult {
  roomSet: RoomSet;
  generateJob?: RoomSetGenerateJob;
}

export interface PatchRoomSetInput {
  styleId?: string;
  label?: string;
  blurb?: string;
  productIds?: string[];
  tags?: string[];
  enabled?: boolean;
  featured?: boolean;
  sortOrder?: number;
  aspectRatio?: string;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(res.statusText || 'Request failed');
  }
  if (!res.ok || !json.success) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }
  return json.data;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getHavenApiBase()}${path}`, init);
  return parseEnvelope<T>(res);
}

function unwrapCreateResult(data: Record<string, unknown>): CreateRoomSetResult {
  if (data.roomSet || data.room_set) {
    const setRow = (data.roomSet ?? data.room_set) as Record<string, unknown>;
    const jobRow = (data.generateJob ?? data.generate_job) as Record<string, unknown> | undefined;
    return {
      roomSet: mapRoomSet(setRow),
      generateJob: jobRow ? mapRoomSetGenerateJob(jobRow) : undefined,
    };
  }
  return { roomSet: mapRoomSet(data) };
}

export const havenAdminClient = {
  async seedStyles(): Promise<StylePersonality[]> {
    const data = await adminFetch<unknown>('/admin/styles/seed', { method: 'POST' });
    return itemsOf<Record<string, unknown>>(data).map(mapStyle).filter((s) => s.id);
  },

  async listStyles(): Promise<StylePersonality[]> {
    try {
      const data = await adminFetch<unknown>('/admin/styles');
      const styles = itemsOf<Record<string, unknown>>(data).map(mapStyle).filter((s) => s.id);
      if (styles.length) return styles.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } catch {
      /* fall through to consumer list */
    }
    const data = await adminFetch<unknown>('/styles');
    return itemsOf<Record<string, unknown>>(data)
      .map(mapStyle)
      .filter((s) => s.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },

  /**
   * Upload a room photo → AI prime/clean → durable style with baseRoomImageUrl.
   * Expect 30–90s. Creates a real haven_styles doc (not a one-off studio upload).
   */
  async createStyleFromRoom(input: {
    file: File;
    label: string;
    blurb?: string;
    styleId?: string;
    aspectRatio?: '16:9' | '9:16';
  }): Promise<{
    style: StylePersonality;
    originalImageUrl: string;
    primedImageUrl: string;
  }> {
    const fd = new FormData();
    fd.append('file', input.file);
    fd.append('label', input.label.trim());
    if (input.blurb?.trim()) fd.append('blurb', input.blurb.trim());
    if (input.styleId?.trim()) fd.append('styleId', input.styleId.trim());
    if (input.aspectRatio) fd.append('aspectRatio', input.aspectRatio);

    const data = await adminFetch<Record<string, unknown>>('/admin/styles/from-room', {
      method: 'POST',
      body: fd,
    });

    const styleRow = (data.style ?? data) as Record<string, unknown>;
    const style = mapStyle(styleRow);
    const primed =
      data.primedImageUrl ??
      data.primed_image_url ??
      style.baseRoomImageUrl ??
      '';
    const original = data.originalImageUrl ?? data.original_image_url ?? '';

    if (!style.id) throw new Error('Style create failed: missing style id.');
    if (!style.baseRoomImageUrl && primed) {
      style.baseRoomImageUrl = String(primed);
    }
    if (!style.previewImageUrl) {
      style.previewImageUrl = style.baseRoomImageUrl;
    }

    return {
      style,
      originalImageUrl: String(original || ''),
      primedImageUrl: String(primed || style.baseRoomImageUrl || ''),
    };
  },

  async listProducts(): Promise<HavenProduct[]> {
    const data = await adminFetch<unknown>('/admin/products');
    return itemsOf<Record<string, unknown>>(data).map(mapProduct).filter((p) => p.id);
  },

  async createProduct(input: {
    name: string;
    merchant?: string;
    price?: number | null;
    imageUrl?: string;
    affiliateUrl?: string;
    category?: string;
    active?: boolean;
    externalSku?: string | null;
    source?: string | null;
  }): Promise<HavenProduct> {
    const data = await adminFetch<Record<string, unknown>>('/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        merchant: input.merchant ?? '',
        price: input.price ?? null,
        imageUrl: input.imageUrl ?? '',
        affiliateUrl: input.affiliateUrl ?? '',
        category: input.category ?? 'other',
        active: input.active ?? true,
        ...(input.externalSku != null ? { externalSku: input.externalSku } : {}),
        ...(input.source != null ? { source: input.source } : {}),
      }),
    });
    return mapProduct(data);
  },

  async previewProductFromUrl(url: string): Promise<{
    preview: {
      name: string;
      merchant: string;
      price: number | null;
      imageUrl: string;
      affiliateUrl: string;
      category: string;
      active: boolean;
      source?: string;
      externalSku?: string | null;
    };
    matched: boolean;
    matchConfidence: string;
    sourceUrl: string;
    notes: string[];
  }> {
    const data = await adminFetch<Record<string, unknown>>('/admin/products/from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const previewRaw = (data.preview ?? {}) as Record<string, unknown>;
    const notes = data.notes;
    return {
      preview: {
        name: String(previewRaw.name ?? ''),
        merchant: String(previewRaw.merchant ?? ''),
        price:
          previewRaw.price == null || previewRaw.price === ''
            ? null
            : Number(previewRaw.price),
        imageUrl: String(previewRaw.imageUrl ?? previewRaw.image_url ?? ''),
        affiliateUrl: String(previewRaw.affiliateUrl ?? previewRaw.affiliate_url ?? url),
        category: String(previewRaw.category ?? 'other'),
        active: previewRaw.active !== false,
        source: previewRaw.source != null ? String(previewRaw.source) : undefined,
        externalSku:
          previewRaw.externalSku != null
            ? String(previewRaw.externalSku)
            : previewRaw.external_sku != null
              ? String(previewRaw.external_sku)
              : null,
      },
      matched: Boolean(data.matched),
      matchConfidence: String(data.matchConfidence ?? data.match_confidence ?? 'none'),
      sourceUrl: String(data.sourceUrl ?? data.source_url ?? url),
      notes: Array.isArray(notes) ? notes.map(String) : [],
    };
  },

  async uploadProductImage(productId: string, file: File): Promise<HavenProduct> {
    const fd = new FormData();
    fd.append('file', file);
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/products/${encodeURIComponent(productId)}/image`,
      { method: 'POST', body: fd },
    );
    return mapProduct(data);
  },

  async setProductImageUrl(productId: string, imageUrl: string): Promise<HavenProduct> {
    const fd = new FormData();
    fd.append('image_url', imageUrl);
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/products/${encodeURIComponent(productId)}/image`,
      { method: 'POST', body: fd },
    );
    return mapProduct(data);
  },

  async importProducts(body: ProductImportBody): Promise<ProductImportResult> {
    const data = await adminFetch<Record<string, unknown>>('/admin/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: body.queries,
        page: body.page ?? 1,
        max_per_query: body.max_per_query ?? 5,
        category: body.category ?? null,
        fetch_details_when_no_image: body.fetch_details_when_no_image ?? true,
      }),
    });
    const errors = data.errors;
    const ids = data.ids;
    return {
      created: Number(data.created ?? 0),
      updated: Number(data.updated ?? 0),
      skipped: Number(data.skipped ?? 0),
      credits_used_estimate:
        data.credits_used_estimate != null
          ? Number(data.credits_used_estimate)
          : data.creditsUsedEstimate != null
            ? Number(data.creditsUsedEstimate)
            : undefined,
      ids: Array.isArray(ids) ? ids.map(String) : [],
      errors: Array.isArray(errors) ? errors.map(String) : [],
    };
  },

  async listRoomSets(opts?: { styleId?: string; tag?: string }): Promise<RoomSet[]> {
    const params = new URLSearchParams();
    if (opts?.styleId) params.set('styleId', opts.styleId);
    if (opts?.tag) params.set('tag', opts.tag);
    const q = params.toString() ? `?${params}` : '';
    const data = await adminFetch<unknown>(`/admin/room-sets${q}`);
    return itemsOf<Record<string, unknown>>(data).map(mapRoomSet).filter((r) => r.id);
  },

  async getRoomSet(id: string): Promise<RoomSetDetail> {
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/room-sets/${encodeURIComponent(id)}`,
    );
    return mapRoomSetDetail(data);
  },

  async createRoomSet(input: CreateRoomSetInput): Promise<CreateRoomSetResult> {
    const data = await adminFetch<Record<string, unknown>>('/admin/room-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleId: input.styleId,
        label: input.label,
        blurb: input.blurb ?? '',
        productIds: input.productIds,
        tags: input.tags ?? [],
        aspectRatio: '16:9',
        autoGenerate: input.autoGenerate ?? true,
        enabled: input.enabled ?? true,
        featured: input.featured ?? false,
        sortOrder: input.sortOrder ?? 0,
      }),
    });
    return unwrapCreateResult(data);
  },

  /** LLM-curate label/products + start generate. Only styleId required. */
  async autoCreateRoomSet(input: {
    styleId: string;
    prompt?: string | null;
    theme?: string | null;
  }): Promise<CreateRoomSetResult> {
    const data = await adminFetch<Record<string, unknown>>('/admin/room-sets/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleId: input.styleId,
        prompt: input.prompt ?? null,
        theme: input.theme ?? null,
      }),
    });
    return unwrapCreateResult(data);
  },

  /** Consumer upload — used as a custom studio base room. */
  async uploadBaseImage(file: File): Promise<{
    uploadId: string;
    originalImageUrl: string;
    width: number;
    height: number;
    aspectRatio: string;
  }> {
    const fd = new FormData();
    fd.append('file', file);
    const data = await adminFetch<Record<string, unknown>>('/uploads', {
      method: 'POST',
      body: fd,
    });
    return {
      uploadId: String(data.uploadId ?? data.upload_id ?? ''),
      originalImageUrl: String(data.originalImageUrl ?? data.original_image_url ?? ''),
      width: Number(data.width ?? 0),
      height: Number(data.height ?? 0),
      aspectRatio: String(data.aspectRatio ?? data.aspect_ratio ?? '16:9'),
    };
  },

  async createStudioRoomSet(input: {
    styleId: string;
    label: string;
    blurb?: string;
    tags?: string[];
    productIds: string[];
    baseSource?: 'style_cache' | 'upload_id' | 'url';
    baseImageUrl?: string | null;
    uploadId?: string | null;
    composeMode?: 'base' | 'furnish';
    placementPins?: { productId: string; x: number; y: number }[];
    enabled?: boolean;
    featured?: boolean;
  }): Promise<CreateRoomSetResult> {
    const data = await adminFetch<Record<string, unknown>>('/admin/room-sets/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleId: input.styleId,
        label: input.label,
        blurb: input.blurb ?? '',
        tags: input.tags ?? [],
        productIds: input.productIds,
        baseSource: input.baseSource ?? 'style_cache',
        baseImageUrl: input.baseImageUrl ?? null,
        uploadId: input.uploadId ?? null,
        composeMode: input.composeMode ?? 'base',
        placementPins: input.placementPins ?? [],
        aspectRatio: '16:9',
        enabled: input.enabled ?? true,
        featured: input.featured ?? false,
      }),
    });
    return unwrapCreateResult(data);
  },

  async rearrangeRoomSet(
    id: string,
    pins: { productId: string; x: number; y: number }[],
  ): Promise<RoomSetGenerateJob> {
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/room-sets/${encodeURIComponent(id)}/rearrange`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pins }),
      },
    );
    return mapRoomSetGenerateJob(data);
  },

  async regenerateRoomSet(id: string): Promise<CreateRoomSetResult> {
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/room-sets/${encodeURIComponent(id)}/generate`,
      { method: 'POST' },
    );
    return unwrapCreateResult(data);
  },

  async getRoomSetJob(jobId: string): Promise<RoomSetGenerateJob> {
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/room-set-jobs/${encodeURIComponent(jobId)}`,
    );
    return mapRoomSetGenerateJob(data);
  },

  async patchRoomSet(id: string, input: PatchRoomSetInput): Promise<RoomSet> {
    const body: Record<string, unknown> = {};
    if (input.styleId != null) body.styleId = input.styleId;
    if (input.label != null) body.label = input.label;
    if (input.blurb != null) body.blurb = input.blurb;
    if (input.productIds != null) body.productIds = input.productIds;
    if (input.tags != null) body.tags = input.tags;
    if (input.enabled != null) body.enabled = input.enabled;
    if (input.featured != null) body.featured = input.featured;
    if (input.sortOrder != null) body.sortOrder = input.sortOrder;
    if (input.aspectRatio != null) body.aspectRatio = input.aspectRatio;
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/room-sets/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (data.roomSet || data.room_set) {
      return mapRoomSet((data.roomSet ?? data.room_set) as Record<string, unknown>);
    }
    return mapRoomSet(data);
  },

  async uploadRoomSetImage(id: string, file: File): Promise<RoomSet> {
    const fd = new FormData();
    fd.append('file', file);
    const data = await adminFetch<Record<string, unknown>>(
      `/admin/room-sets/${encodeURIComponent(id)}/image`,
      { method: 'POST', body: fd },
    );
    if (data.roomSet || data.room_set) {
      return mapRoomSet((data.roomSet ?? data.room_set) as Record<string, unknown>);
    }
    return mapRoomSet(data);
  },

  async saveHotspots(id: string, hotspots: HavenHotspot[]): Promise<HavenHotspot[]> {
    const data = await adminFetch<{ hotspots?: unknown } | unknown>(
      `/admin/room-sets/${encodeURIComponent(id)}/hotspots`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotspots: hotspots.map((h) => ({
            id: h.id,
            productId: h.productId,
            x: h.x,
            y: h.y,
            label: h.label,
          })),
        }),
      },
    );
    const list =
      data && typeof data === 'object' && Array.isArray((data as { hotspots?: unknown }).hotspots)
        ? (data as { hotspots: Record<string, unknown>[] }).hotspots
        : Array.isArray(data)
          ? data
          : [];
    return list.map((h, i) => mapHotspot(h as Record<string, unknown>, i));
  },

  async deleteRoomSet(id: string): Promise<void> {
    await adminFetch<unknown>(`/admin/room-sets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
