import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { havenStoreClient } from './api/havenStoreClient';
import { HavenProductFilterMenu } from './HavenProductFilterMenu';
import { HavenStoreProductCard } from './HavenStoreProductCard';
import { HavenSkeletonGrid, HavenStoreSkeleton } from './HavenSkeleton';
import {
  collectStoreOptions,
  DEFAULT_PRODUCT_FILTERS,
} from './productFilters';
import type { HavenProduct, ProductCatalogFilters, RoomSetCard } from './types';
import './haven-store.css';

const HavenStore: React.FC = () => {
  const [featured, setFeatured] = useState<RoomSetCard[]>([]);
  const [items, setItems] = useState<HavenProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [filters, setFilters] = useState<ProductCatalogFilters>(DEFAULT_PRODUCT_FILTERS);
  const [knownStores, setKnownStores] = useState<HavenProduct[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    document.title = 'Haven · Store';
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const feat = await havenStoreClient.listFeaturedRoomSets(12);
        if (!cancelled) {
          setFeatured(feat);
          setCarouselIndex(0);
        }
      } catch {
        if (!cancelled) setFeatured([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const page = await havenStoreClient.listProducts({
          limit: 24,
          sort: filters.sort,
          category: filters.category,
          store: filters.store,
        });
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setKnownStores((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const extra = page.items.filter((p) => p.id && !seen.has(p.id));
          return extra.length ? [...prev, ...extra] : prev;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load the store.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await havenStoreClient.listProducts({
        limit: 24,
        cursor: nextCursor,
        sort: filters.sort,
        category: filters.category,
        store: filters.store,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = page.items.filter((p) => p.id && !seen.has(p.id));
        return [...prev, ...next];
      });
      setKnownStores((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const extra = page.items.filter((p) => p.id && !seen.has(p.id));
        return extra.length ? [...prev, ...extra] : prev;
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more products.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, filters]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    if (featured.length < 2 || carouselPaused) return;
    const id = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % featured.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [featured.length, carouselPaused]);

  const storeOptions = useMemo(
    () => collectStoreOptions(knownStores.length ? knownStores : items),
    [knownStores, items],
  );

  const active = featured[carouselIndex] ?? null;

  const goToSlide = (i: number) => {
    setCarouselPaused(true);
    setCarouselIndex(i);
  };

  return (
    <div className="hv-store">
      <div className="hv-store__shell">
        <header className="hv-store__top">
          <div>
            <p className="hv-store__eyebrow">Haven</p>
            <h1 className="hv-store__title">Store</h1>
            <p className="hv-store__sub">Shop curated looks, then the pieces inside them.</p>
          </div>
          <div className="hv-store__links">
            <Link to="/haven" className="hv-store__btn hv-store__btn--ghost">
              Room studio
            </Link>
            <Link to="/haven/admin" className="hv-store__btn hv-store__btn--ghost">
              Admin
            </Link>
          </div>
        </header>

        {error && (
          <p className="hv-store__msg hv-store__msg--error" role="alert">
            {error}
          </p>
        )}

        {loading && !items.length && !featured.length ? (
          <HavenStoreSkeleton />
        ) : (
          <>
            {active && (
              <section className="hv-store__hero" aria-label="Featured looks">
                <div className="hv-store__hero-stage">
                  {featured.map((set, i) => (
                    <Link
                      key={set.id}
                      to={`/haven/store/look/${encodeURIComponent(set.id)}`}
                      className={`hv-store__hero-slide${i === carouselIndex ? ' is-active' : ''}`}
                      aria-hidden={i !== carouselIndex}
                      tabIndex={i === carouselIndex ? 0 : -1}
                    >
                      {set.imageUrl ? <img src={set.imageUrl} alt="" /> : null}
                    </Link>
                  ))}
                  <div className="hv-store__hero-veil" aria-hidden="true" />
                  <div className="hv-store__hero-copy">
                    <p className="hv-store__hero-kicker">Featured look</p>
                    <h2 className="hv-store__hero-name">{active.label}</h2>
                    {active.blurb ? (
                      <p className="hv-store__hero-meta">{active.blurb}</p>
                    ) : (
                      <p className="hv-store__hero-meta">
                        {active.productCount} piece{active.productCount === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                  {featured.length > 1 && (
                    <div className="hv-store__hero-dots" role="tablist" aria-label="Featured looks">
                      {featured.map((set, i) => (
                        <button
                          key={set.id}
                          type="button"
                          role="tab"
                          aria-selected={i === carouselIndex}
                          className={`hv-store__hero-dot${i === carouselIndex ? ' is-active' : ''}`}
                          aria-label={`Show ${set.label}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToSlide(i);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="hv-store__grid-section" aria-label="All products">
              <div className="hv-store__section-head">
                <h2 className="hv-store__section-title">All pieces</h2>
                <HavenProductFilterMenu
                  value={filters}
                  onChange={setFilters}
                  storeOptions={storeOptions}
                  disabled={loading}
                  align="end"
                />
              </div>
              {loading ? (
                <HavenSkeletonGrid count={8} />
              ) : items.length === 0 ? (
                <p className="hv-store__empty">No products match these filters.</p>
              ) : (
                <div className="hv-store__grid">
                  {items.map((p) => (
                    <HavenStoreProductCard
                      key={p.id}
                      product={p}
                      to={`/haven/store/product/${encodeURIComponent(p.id)}`}
                    />
                  ))}
                </div>
              )}
              <div ref={sentinelRef} className="hv-store__sentinel" aria-hidden="true" />
              {loadingMore && <HavenSkeletonGrid count={4} />}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default HavenStore;
