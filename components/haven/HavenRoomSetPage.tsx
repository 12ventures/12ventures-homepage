import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HavenApiError } from './api/havenClient';
import { havenStoreClient } from './api/havenStoreClient';
import { formatHavenPrice, HavenProductCard } from './HavenProductCard';
import { HavenLookSkeleton } from './HavenSkeleton';
import {
  cssAspectToNumber,
  resolveStageAspect,
  type RoomSetCard,
  type RoomSetDetail,
} from './types';
import './haven-store.css';
import './haven-product.css';

const HavenRoomSetPage: React.FC = () => {
  const { roomSetId = '' } = useParams<{ roomSetId: string }>();
  const [look, setLook] = useState<RoomSetDetail | null>(null);
  const [moreLooks, setMoreLooks] = useState<RoomSetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const hotspotLeaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.title = look?.label ? `Haven · ${look.label}` : 'Haven · Look';
  }, [look?.label]);

  useEffect(() => {
    if (!roomSetId) {
      setError('Missing look.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLook(null);
    setMoreLooks([]);
    setActiveHotspot(null);
    window.scrollTo(0, 0);

    void (async () => {
      try {
        const [detail, featured] = await Promise.all([
          havenStoreClient.getRoomSet(roomSetId),
          havenStoreClient.listFeaturedRoomSets(12).catch(() => [] as RoomSetCard[]),
        ]);
        if (cancelled) return;
        setLook(detail);
        setMoreLooks(featured.filter((s) => s.id && s.id !== roomSetId && s.imageUrl));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof HavenApiError && err.status === 404) {
          setError('This look isn’t available.');
        } else {
          setError(err instanceof Error ? err.message : 'Could not load this look.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomSetId]);

  useEffect(() => {
    return () => {
      if (hotspotLeaveTimerRef.current != null) {
        window.clearTimeout(hotspotLeaveTimerRef.current);
      }
    };
  }, []);

  const products = useMemo(
    () => (look?.products ?? []).filter((p) => p.id && p.imageUrl),
    [look?.products],
  );

  const productsById = useMemo(() => {
    const map = new Map((look?.products ?? []).map((p) => [p.id, p]));
    return map;
  }, [look?.products]);

  const stageAspect = resolveStageAspect({
    width: look?.imageWidth,
    height: look?.imageHeight,
    aspectRatio: look?.aspectRatio,
  });
  const stageAr = cssAspectToNumber(stageAspect);
  const stageStyle: React.CSSProperties = {
    aspectRatio: stageAspect || '16 / 9',
    width: `min(100%, calc(min(78vh, 820px) * ${stageAr}))`,
    maxHeight: 'min(78vh, 820px)',
  };

  const openHotspot = useCallback((id: string) => {
    if (hotspotLeaveTimerRef.current != null) {
      window.clearTimeout(hotspotLeaveTimerRef.current);
      hotspotLeaveTimerRef.current = null;
    }
    setActiveHotspot(id);
  }, []);

  const scheduleCloseHotspot = useCallback(() => {
    if (hotspotLeaveTimerRef.current != null) {
      window.clearTimeout(hotspotLeaveTimerRef.current);
    }
    hotspotLeaveTimerRef.current = window.setTimeout(() => {
      setActiveHotspot(null);
      hotspotLeaveTimerRef.current = null;
    }, 160);
  }, []);

  const hotspots = look?.hotspots ?? [];

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
          <HavenLookSkeleton />
        ) : look ? (
          <>
          <section className="hv-store__look" aria-label={look.label}>
            <div className="hv-store__look-media">
              <div className="hv-store__look-stage" style={stageStyle}>
                {look.imageUrl ? (
                  <img src={look.imageUrl} alt="" className="hv-store__look-img" />
                ) : (
                  <div className="hv-store__look-empty">No image</div>
                )}
                <div className="hv-store__look-veil" aria-hidden="true" />
                <div className="hv-store__look-copy">
                  <p className="hv-store__hero-kicker">Look</p>
                  <h1 className="hv-store__look-title">{look.label}</h1>
                  {look.blurb ? <p className="hv-store__look-blurb">{look.blurb}</p> : null}
                </div>

                {hotspots.length > 0 && (
                  <div className="hv-hotspots">
                    {hotspots.map((h, i) => {
                      const product = productsById.get(h.productId);
                      if (!product) return null;
                      const open = activeHotspot === h.id;
                      const placement =
                        h.y > 72 ? 'above' : h.y < 28 ? 'below' : h.x < 55 ? 'right' : 'left';
                      return (
                        <div
                          key={h.id}
                          className={`hv-hotspot-wrap${open ? ' hv-hotspot-wrap--open' : ''}`}
                          style={
                            {
                              left: `${h.x}%`,
                              top: `${h.y}%`,
                              '--hv-hotspot-i': i,
                            } as React.CSSProperties
                          }
                          onMouseEnter={() => openHotspot(h.id)}
                          onMouseLeave={scheduleCloseHotspot}
                        >
                          <button
                            type="button"
                            className="hv-hotspot"
                            aria-label={`${product.name}, ${formatHavenPrice(product.price)}`}
                            aria-expanded={open}
                            aria-controls={`hv-hotspot-card-${h.id}`}
                            onFocus={() => openHotspot(h.id)}
                            onBlur={(e) => {
                              if (
                                !e.currentTarget.parentElement?.contains(e.relatedTarget as Node)
                              ) {
                                scheduleCloseHotspot();
                              }
                            }}
                            onClick={() => {
                              if (activeHotspot === h.id) scheduleCloseHotspot();
                              else openHotspot(h.id);
                            }}
                          />
                          <HavenProductCard
                            id={`hv-hotspot-card-${h.id}`}
                            product={product}
                            className={`hv-hotspot-card hv-hotspot-card--${placement}`}
                            role="dialog"
                            aria-label={product.name}
                            aria-hidden={!open}
                            buyTabIndex={open ? 0 : -1}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside className="hv-store__look-rail" aria-label="Pieces in this look">
              <div className="hv-store__look-rail-head">
                <h2 className="hv-store__look-rail-title">Shop the pieces</h2>
                <p className="hv-store__look-rail-meta">
                  {products.length} piece{products.length === 1 ? '' : 's'}
                </p>
              </div>
              {products.length === 0 ? (
                <p className="hv-store__empty">No products linked to this look yet.</p>
              ) : (
                <div className="hv-store__look-rail-list">
                  {products.map((p) => (
                    <HavenProductCard
                      key={p.id}
                      product={p}
                      variant="rail"
                    />
                  ))}
                </div>
              )}
            </aside>
          </section>

          {moreLooks.length > 0 ? (
            <section className="hv-store__more" aria-label="More like this">
              <h2 className="hv-store__section-title">More like this</h2>
              <div className="hv-store__look-grid">
                {moreLooks.map((set) => (
                  <Link
                    key={set.id}
                    to={`/haven/store/look/${encodeURIComponent(set.id)}`}
                    className="hv-store__look-tile"
                    aria-label={set.label}
                  >
                    <img src={set.imageUrl} alt="" loading="lazy" />
                    <span className="hv-store__look-tile-shade" aria-hidden="true" />
                    <span className="hv-store__look-tile-copy">
                      <span className="hv-store__look-tile-name">{set.label}</span>
                      <span className="hv-store__look-tile-meta">
                        {set.productCount} piece{set.productCount === 1 ? '' : 's'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
        ) : null}
      </div>
    </div>
  );
};

export default HavenRoomSetPage;
