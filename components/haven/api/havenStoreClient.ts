import type {
  HavenProduct,
  HavenProductCategory,
  HavenProductDetail,
  HavenProductPage,
  RoomSetCard,
  RoomSetDetail,
} from '../types';
import { getHavenApiBase, HavenApiError } from './havenClient';
import {
  mapProduct,
  mapProductDetail,
  mapProductPage,
  mapRoomSetCard,
  mapRoomSetDetail,
} from './mappers';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

async function parseEnvelope<T>(res: Response): Promise<T> {
  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new HavenApiError(res.statusText || 'Request failed', res.status);
  }
  if (!res.ok || !json.success) {
    throw new HavenApiError(json.message || res.statusText || 'Request failed', res.status);
  }
  return json.data;
}

async function storeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getHavenApiBase()}${path}`, init);
  return parseEnvelope<T>(res);
}

export type StoreCatalogSort = 'name' | 'newest' | 'store';

export const havenStoreClient = {
  /**
   * Featured looks carousel — room sets with featured=true.
   * Empty list is fine (hide carousel).
   */
  async listFeaturedRoomSets(limit = 12): Promise<RoomSetCard[]> {
    const data = await storeFetch<Record<string, unknown>>(
      `/room-sets/featured?limit=${encodeURIComponent(String(limit))}`,
    );
    const raw = data.items;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((row) => mapRoomSetCard(row as Record<string, unknown>))
      .filter((s) => s.id && s.imageUrl);
  },

  /** @deprecated Prefer listFeaturedRoomSets for storefront hero. */
  async listFeatured(limit = 12): Promise<HavenProduct[]> {
    const data = await storeFetch<Record<string, unknown>>(
      `/products/featured?limit=${encodeURIComponent(String(limit))}`,
    );
    const raw = data.items;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((row) => mapProduct(row as Record<string, unknown>))
      .filter((p) => p.id && p.imageUrl);
  },

  async getRoomSet(id: string): Promise<RoomSetDetail> {
    const data = await storeFetch<Record<string, unknown>>(
      `/room-sets/${encodeURIComponent(id)}`,
    );
    const detail = mapRoomSetDetail(data);
    if (!detail.id) throw new HavenApiError('Look not found', 404);
    return detail;
  },

  async listProducts(opts?: {
    limit?: number;
    cursor?: string | null;
    category?: HavenProductCategory | string | null;
    /** Prefer storeKey from product cards (URL host). */
    store?: string | null;
    sort?: StoreCatalogSort;
  }): Promise<HavenProductPage> {
    const qs = new URLSearchParams({
      limit: String(opts?.limit ?? 24),
      sort: opts?.sort ?? 'name',
    });
    if (opts?.cursor) qs.set('cursor', opts.cursor);
    if (opts?.category) qs.set('category', opts.category);
    if (opts?.store) qs.set('store', opts.store);
    const data = await storeFetch<Record<string, unknown>>(`/products?${qs}`);
    return mapProductPage(data);
  },

  async getProduct(id: string): Promise<HavenProductDetail> {
    const data = await storeFetch<Record<string, unknown>>(
      `/products/${encodeURIComponent(id)}`,
    );
    const product = mapProductDetail(data);
    if (!product.id) throw new HavenApiError('Product not found', 404);
    return product;
  },

  async listRelated(
    id: string,
    opts?: { limit?: number; cursor?: string | null },
  ): Promise<HavenProductPage> {
    const qs = new URLSearchParams({
      limit: String(opts?.limit ?? 24),
    });
    if (opts?.cursor) qs.set('cursor', opts.cursor);
    const data = await storeFetch<Record<string, unknown>>(
      `/products/${encodeURIComponent(id)}/related?${qs}`,
    );
    return mapProductPage(data);
  },
};
