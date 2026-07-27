import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HavenProduct, PlacementPin, StylePersonality } from './types';
import { roomSetGenerateCopy } from './types';

function hasProductImage(p: HavenProduct): boolean {
  return Boolean(p.imageUrl?.trim());
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export const HavenAdminStudio: React.FC<{
  style: StylePersonality | undefined;
  label: string;
  products: HavenProduct[];
  allProducts: HavenProduct[];
  pins: PlacementPin[];
  busy: boolean;
  composeMode: 'base' | 'furnish';
  onComposeModeChange: (mode: 'base' | 'furnish') => void;
  onPinsChange: (pins: PlacementPin[]) => void;
  onProductsChange: (ids: string[]) => void;
  onGenerate: () => void;
  onUploadBase?: (file: File) => void;
  baseImageUrl: string | null;
  baseBusy?: boolean;
  /** In-place generate after Design Myself — keep stage up with blur loader. */
  working?: boolean;
  genStatus?: string | null;
  genProgress?: number | null;
  genMessage?: string | null;
}> = ({
  style,
  label,
  products,
  allProducts,
  pins,
  busy,
  composeMode,
  onComposeModeChange,
  onPinsChange,
  onProductsChange,
  onGenerate,
  onUploadBase,
  baseImageUrl,
  baseBusy,
  working = false,
  genStatus = null,
  genProgress = null,
  genMessage = null,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hoverPinId, setHoverPinId] = useState<string | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const [tipFading, setTipFading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!baseImageUrl) return;
    let cancelled = false;
    setTipVisible(true);
    setTipFading(false);
    const fadeTimer = window.setTimeout(() => {
      if (!cancelled) setTipFading(true);
    }, 1200);
    const hideTimer = window.setTimeout(() => {
      if (!cancelled) setTipVisible(false);
    }, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [baseImageUrl]);

  const productsById = useMemo(() => {
    const map = new Map<string, HavenProduct>();
    allProducts.forEach((p) => map.set(p.id, p));
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProducts, products]);

  const pinByProduct = useMemo(() => {
    const map = new Map<string, PlacementPin>();
    pins.forEach((p) => map.set(p.productId, p));
    return map;
  }, [pins]);

  const percentFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 1000) / 10)),
      y: Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 1000) / 10)),
    };
  }, []);

  const upsertPin = useCallback(
    (productId: string, x: number, y: number) => {
      const next = pins.filter((p) => p.productId !== productId);
      next.push({ productId, x, y });
      onPinsChange(next);
    },
    [onPinsChange, pins],
  );

  const placeOrSelect = (productId: string) => {
    const existing = pinByProduct.get(productId);
    if (existing) {
      setArmedId(productId);
      return;
    }
    upsertPin(productId, 50, 58);
    setArmedId(productId);
  };

  const onStageClick = (e: React.MouseEvent) => {
    if (!armedId || draggingId.current) return;
    const next = percentFromPointer(e.clientX, e.clientY);
    if (!next) return;
    upsertPin(armedId, next.x, next.y);
  };

  const onPinPointerDown = (e: React.PointerEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setHoverPinId(null);
    draggingId.current = productId;
    setArmedId(productId);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPinPointerMove = (e: React.PointerEvent) => {
    if (!draggingId.current) return;
    const next = percentFromPointer(e.clientX, e.clientY);
    if (!next) return;
    upsertPin(draggingId.current, next.x, next.y);
  };

  const onPinPointerUp = (e: React.PointerEvent) => {
    if (!draggingId.current) return;
    draggingId.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const removeProduct = (id: string) => {
    onProductsChange(products.filter((p) => p.id !== id).map((p) => p.id));
    onPinsChange(pins.filter((p) => p.productId !== id));
    if (armedId === id) setArmedId(null);
  };

  const togglePickerProduct = (id: string) => {
    const selected = products.some((p) => p.id === id);
    if (selected) {
      removeProduct(id);
      return;
    }
    if (products.length >= 18) return;
    onProductsChange([...products.map((p) => p.id), id]);
  };

  const stageAspect =
    style?.baseRoomWidth && style?.baseRoomHeight
      ? `${style.baseRoomWidth} / ${style.baseRoomHeight}`
      : '16 / 9';

  const locked = busy || working;
  const genPct = Math.min(100, Math.max(0, Math.round(Number(genProgress ?? 0))));
  const genCopy = roomSetGenerateCopy(genStatus, genMessage ?? undefined);

  return (
    <div className="hv-admin__studio" ref={rootRef}>
      <div className="hv-admin__studio-head">
        <div>
          <p className="hv-admin__chips-kicker">Design myself</p>
          <h3 className="hv-admin__studio-title">{label || 'Untitled look'}</h3>
        </div>
        <div className="hv-admin__studio-toolbar">
          <div className="hv-admin__seg" role="tablist" aria-label="Compose mode">
            <button
              type="button"
              role="tab"
              aria-selected={composeMode === 'base'}
              className={`hv-admin__seg-btn${composeMode === 'base' ? ' is-active' : ''}`}
              disabled={locked}
              onClick={() => onComposeModeChange('base')}
              title="Only catalog products"
            >
              Base
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={composeMode === 'furnish'}
              className={`hv-admin__seg-btn${composeMode === 'furnish' ? ' is-active' : ''}`}
              disabled={locked}
              onClick={() => onComposeModeChange('furnish')}
              title="Allow invented filler furniture (not shoppable)"
            >
              Furnish
            </button>
          </div>
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--primary"
            disabled={
              locked || !baseImageUrl || products.length < 1 || pins.length < 1
            }
            onClick={onGenerate}
          >
            {locked ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="hv-admin__studio-grid">
        <div className="hv-admin__studio-stage-wrap">
          {!baseImageUrl ? (
            <div className="hv-admin__studio-empty">
              <p>No base room for this style yet.</p>
              {onUploadBase && (
                <>
                  <input
                    ref={baseInputRef}
                    type="file"
                    accept="image/*"
                    className="hv-admin__file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadBase(file);
                    }}
                  />
                  <button
                    type="button"
                    className="hv-admin__btn hv-admin__btn--ghost"
                    disabled={busy || baseBusy}
                    onClick={() => baseInputRef.current?.click()}
                  >
                    {baseBusy ? 'Uploading…' : 'Upload a base room'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div
              ref={stageRef}
              className={`hv-admin__studio-stage${armedId && !working ? ' is-armed' : ''}${working ? ' is-working' : ''}`}
              style={{ aspectRatio: stageAspect }}
              onClick={working ? undefined : onStageClick}
              role="presentation"
            >
              <img src={baseImageUrl} alt="" className="hv-admin__studio-stage-img" />
              {tipVisible && !working && (
                <div
                  className={`hv-admin__studio-stage-tip${tipFading ? ' is-fading' : ''}`}
                  aria-live="polite"
                >
                  <p>Drag product markers to choose their placement in the final design</p>
                </div>
              )}
              {working && (
                <div className="hv-admin__stage-gen" aria-live="polite">
                  <div className="hv-admin__stage-gen__veil" aria-hidden="true" />
                  <div className="hv-admin__stage-gen__sheen" aria-hidden="true" />
                  <div className="hv-admin__stage-gen__copy">
                    <p className="hv-admin__stage-gen__eyebrow">Creating look</p>
                    <p className="hv-admin__stage-gen__status">{genCopy}</p>
                    <div className="hv-admin__stage-gen__meter" aria-hidden="true">
                      <span
                        className="hv-admin__stage-gen__meter-fill"
                        style={{ width: `${genPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {!working &&
                pins.map((pin) => {
                const product = productsById.get(pin.productId);
                if (!product) return null;
                const showCard = hoverPinId === pin.productId;
                return (
                  <div
                    key={pin.productId}
                    className={`hv-admin__studio-pin${armedId === pin.productId ? ' is-active' : ''}`}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onPointerDown={(e) => onPinPointerDown(e, pin.productId)}
                    onPointerMove={onPinPointerMove}
                    onPointerUp={onPinPointerUp}
                    onPointerCancel={onPinPointerUp}
                    onMouseEnter={() => setHoverPinId(pin.productId)}
                    onMouseLeave={() => setHoverPinId(null)}
                  >
                    <span className="hv-admin__studio-pin-dot" />
                    {showCard && (
                      <div
                        className="hv-admin__hotspot-card hv-admin__hotspot-card--right hv-admin__studio-pin-card"
                        role="tooltip"
                      >
                        {product.imageUrl ? (
                          <img
                            className="hv-admin__hotspot-card__img"
                            src={product.imageUrl}
                            alt=""
                          />
                        ) : null}
                        <span className="hv-admin__hotspot-card__price">
                          {formatPrice(product.price)}
                        </span>
                        <div className="hv-admin__hotspot-card__body">
                          <span className="hv-admin__hotspot-card__merchant">
                            {product.merchant}
                          </span>
                          <p className="hv-admin__hotspot-card__name">{product.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="hv-admin__studio-rail">
          <div className="hv-admin__studio-rail-head">
            <p className="hv-admin__label">Your pieces</p>
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
              disabled={locked}
              onClick={() => setPickerOpen(true)}
            >
              Add product
            </button>
          </div>
          <div className="hv-admin__studio-list">
            {products.length === 0 ? (
              <p className="hv-admin__empty">Add products to place.</p>
            ) : (
              products.map((p) => {
                const placed = pinByProduct.has(p.id);
                const active = armedId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`hv-admin__studio-item${active ? ' is-active' : ''}${placed ? ' is-placed' : ''}`}
                  >
                    <button
                      type="button"
                      className="hv-admin__studio-item-main"
                      disabled={locked}
                      onClick={() => placeOrSelect(p.id)}
                      title={placed ? 'Select / reposition' : 'Place on room'}
                    >
                      <span className="hv-admin__studio-item-thumb">
                        {hasProductImage(p) ? <img src={p.imageUrl} alt="" /> : null}
                      </span>
                      <span className="hv-admin__studio-item-copy">
                        <strong>{p.name}</strong>
                        <span>
                          {p.merchant}
                          {placed ? ' · placed' : ''}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="hv-admin__studio-item-remove"
                      disabled={locked}
                      aria-label={`Remove ${p.name}`}
                      onClick={() => removeProduct(p.id)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {pickerOpen && (
        <div className="hv-admin__studio-picker" role="dialog" aria-label="Add products">
          <div className="hv-admin__studio-picker-card">
            <div className="hv-admin__studio-rail-head">
              <p className="hv-admin__label">Catalog · {products.length}/18 selected</p>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
                onClick={() => setPickerOpen(false)}
              >
                Done
              </button>
            </div>
            <div className="hv-admin__tiles hv-admin__tiles--picker">
              {allProducts
                .filter((p) => hasProductImage(p))
                .map((p) => {
                  const selected = products.some((x) => x.id === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`hv-admin__studio-pick${selected ? ' is-selected' : ''}`}
                      disabled={locked || (!selected && products.length >= 18)}
                      onClick={() => togglePickerProduct(p.id)}
                    >
                      <img src={p.imageUrl} alt="" />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
