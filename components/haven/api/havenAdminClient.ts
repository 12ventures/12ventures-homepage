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

  async listProducts(): Promise<HavenProduct[]> {
    const data = await adminFetch<unknown>('/admin/products');
    return itemsOf<Record<string, unknown>>(data).map(mapProduct).filter((p) => p.id);
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
    return list.map((h) => mapHotspot(h as Record<string, unknown>));
  },

  async deleteRoomSet(id: string): Promise<void> {
    await adminFetch<unknown>(`/admin/room-sets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
