import type {
  HavenProduct,
  HavenProductCategory,
  ProductCatalogFilters,
  ProductStoreOption,
} from './types';

export const PRODUCT_CATEGORIES: HavenProductCategory[] = [
  'sofa',
  'rug',
  'table',
  'lighting',
  'decor',
  'chair',
  'other',
];

export const DEFAULT_PRODUCT_FILTERS: ProductCatalogFilters = {
  category: null,
  store: null,
  sort: 'name',
};

export function productStoreKey(p: HavenProduct): string | null {
  const key = p.storeKey?.trim();
  if (key) return key.toLowerCase();
  const url = p.affiliateUrl?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase() || null;
  } catch {
    return null;
  }
}

export function collectStoreOptions(products: HavenProduct[]): ProductStoreOption[] {
  const byKey = new Map<string, ProductStoreOption>();
  for (const p of products) {
    const key = productStoreKey(p);
    if (!key) continue;
    const existing = byKey.get(key);
    const merchant = p.merchant?.trim();
    if (!existing) {
      byKey.set(key, {
        storeKey: key,
        label: merchant || key,
      });
      continue;
    }
    if (merchant && existing.label === existing.storeKey) {
      byKey.set(key, { storeKey: key, label: merchant });
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
  );
}

export function productFiltersActive(filters: ProductCatalogFilters): boolean {
  return Boolean(filters.category || filters.store || filters.sort !== 'name');
}

export function applyProductFilters(
  products: HavenProduct[],
  filters: ProductCatalogFilters,
): HavenProduct[] {
  let next = products;
  if (filters.category) {
    next = next.filter((p) => p.category === filters.category);
  }
  if (filters.store) {
    const want = filters.store.toLowerCase();
    next = next.filter((p) => productStoreKey(p) === want);
  }
  const sorted = [...next];
  if (filters.sort === 'store') {
    sorted.sort((a, b) => {
      const sa = productStoreKey(a) || a.merchant || '';
      const sb = productStoreKey(b) || b.merchant || '';
      const byStore = sa.localeCompare(sb, undefined, { sensitivity: 'base' });
      if (byStore !== 0) return byStore;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  } else if (filters.sort === 'newest') {
    sorted.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (ta !== tb) return tb - ta;
      return b.id.localeCompare(a.id);
    });
  } else {
    sorted.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }
  return sorted;
}

export function categoryLabel(category: HavenProductCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
