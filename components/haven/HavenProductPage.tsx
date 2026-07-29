import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HavenApiError } from './api/havenClient';
import { havenStoreClient } from './api/havenStoreClient';
import { formatPrice, HavenStoreProductCard } from './HavenStoreProductCard';
import { HavenProductSkeleton, HavenSkeletonGrid } from './HavenSkeleton';
import type { HavenProduct, HavenProductDetail } from './types';
import './haven-store.css';

const HavenProductPage: React.FC = () => {
  const { productId = '' } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<HavenProductDetail | null>(null);
  const [related, setRelated] = useState<HavenProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    document.title = product?.name ? `Haven · ${product.name}` : 'Haven · Product';
  }, [product?.name]);

  useEffect(() => {
    if (!productId) {
      setError('Missing product.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    setRelated([]);
    setNextCursor(null);
    setHasMore(false);
    window.scrollTo(0, 0);

    void (async () => {
      try {
        const [detail, page] = await Promise.all([
          havenStoreClient.getProduct(productId),
          havenStoreClient.listRelated(productId, { limit: 24 }),
        ]);
        if (cancelled) return;
        setProduct(detail);
        setRelated(page.items.filter((p) => p.id !== detail.id));
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof HavenApiError && err.status === 404) {
          setError('This piece isn’t available.');
        } else {
          setError(err instanceof Error ? err.message : 'Could not load this product.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const loadMore = useCallback(async () => {
    if (!productId || !hasMore || !nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await havenStoreClient.listRelated(productId, {
        limit: 24,
        cursor: nextCursor,
      });
      setRelated((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        seen.add(productId);
        const next = page.items.filter((p) => p.id && !seen.has(p.id));
        return [...prev, ...next];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more suggestions.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [productId, hasMore, nextCursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  const metaBits = product
    ? [
        product.category,
        product.externalSku ? `SKU ${product.externalSku}` : null,
        product.dimensions,
      ].filter(Boolean)
    : [];

  return (
    <div className="hv-store">
      <div className="hv-store__shell">
        <header className="hv-store__top hv-store__top--pdp">
          <Link to="/haven/store" className="hv-store__back">
            ← Store
          </Link>
          <div className="hv-store__links">
            <Link to="/haven" className="hv-store__btn hv-store__btn--ghost">
              Room studio
            </Link>
          </div>
        </header>

        {error && (
          <p className="hv-store__msg hv-store__msg--error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <HavenProductSkeleton />
        ) : product ? (
          <>
            <section className="hv-store__pdp" aria-label={product.name}>
              <div className="hv-store__pdp-stage">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="hv-store__pdp-bg"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="hv-store__pdp-empty" aria-hidden="true" />
                )}
                <div className="hv-store__pdp-veil" aria-hidden="true" />
                <div className="hv-store__pdp-layout">
                  <div className="hv-store__pdp-main">
                    <p className="hv-store__pdp-merchant">{product.merchant || 'Haven'}</p>
                    <div className="hv-store__pdp-mid">
                      <h1 className="hv-store__pdp-title" title={product.name}>
                        {product.name}
                      </h1>
                      {metaBits.length > 0 ? (
                        <p className="hv-store__pdp-meta">{metaBits.join(' · ')}</p>
                      ) : null}
                    </div>
                    {product.affiliateUrl ? (
                      <a
                        className="hv-store__pdp-buy"
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buy
                      </a>
                    ) : (
                      <span className="hv-store__pdp-buy-spacer" aria-hidden="true" />
                    )}
                  </div>
                  {product.imageUrl ? (
                    <div className="hv-store__pdp-focus">
                      <img src={product.imageUrl} alt="" className="hv-store__pdp-focus-img" />
                      {product.price > 0 ? (
                        <span className="hv-store__pdp-price">{formatPrice(product.price)}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="hv-store__more" aria-label="More like this">
              <h2 className="hv-store__section-title">More like this</h2>
              {related.length === 0 ? (
                <p className="hv-store__empty">No suggestions yet.</p>
              ) : (
                <div className="hv-store__grid">
                  {related.map((p) => (
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
        ) : null}
      </div>
    </div>
  );
};

export default HavenProductPage;
