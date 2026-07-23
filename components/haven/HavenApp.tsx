import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { havenClient } from './api/havenClient';
import { MOCK_HOTSPOTS_BY_STYLE, MOCK_ORIGINAL_ROOM } from './mock/room';
import { STYLE_PERSONALITIES } from './mock/styles';
import type { HavenProduct, HavenStep, RoomJob, StyleId } from './types';
import './haven.css';

const PAGE_TITLE = 'Haven · Shop the room';

const GEN_STATUS_LINES = (styleLabel: string): string[] => [
  'Reading the light in your room…',
  `Sketching a ${styleLabel} palette…`,
  'Softening furniture silhouettes…',
  'Gathering linen, wood, and quiet color…',
  'Lining up pieces that fit the look…',
];

const GEN_ALMOST_LINE = 'One last pass…';

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Pin an element's top to the top of the viewport.
 * Prefer this over scrollIntoView({ block: 'start' }) near the page end.
 * Browsers otherwise clamp to max scroll and leave the target mid-screen.
 */
function scrollElementToPageTop(el: HTMLElement | null, offsetPx = 28) {
  if (!el) return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - offsetPx;
      window.scrollTo({ top: Math.max(0, top), behavior });
    });
  });
}

const HavenApp: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const genCancelRef = useRef(0);
  const hotspotLeaveTimerRef = useRef<number | null>(null);
  const [step, setStep] = useState<HavenStep>('upload');
  const [styleId, setStyleId] = useState<StyleId>('organic_modern');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [job, setJob] = useState<RoomJob | null>(null);
  const [incomingJob, setIncomingJob] = useState<RoomJob | null>(null);
  const [genBaseSrc, setGenBaseSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [detailsInView, setDetailsInView] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [genProgress, setGenProgress] = useState(0);

  const selectedStyle = useMemo(
    () => STYLE_PERSONALITIES.find((s) => s.id === styleId)!,
    [styleId],
  );

  const isBusy = step === 'generating' || step === 'revealing';

  useEffect(() => {
    const prev = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    if (hotspotLeaveTimerRef.current != null) {
      window.clearTimeout(hotspotLeaveTimerRef.current);
      hotspotLeaveTimerRef.current = null;
    }
    setActiveHotspot(null);
  }, [step, job?.id, compareOriginal]);

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
    // Keep the open layer elevated through the card fade-out.
    hotspotLeaveTimerRef.current = window.setTimeout(() => {
      setActiveHotspot(null);
      hotspotLeaveTimerRef.current = null;
    }, 220);
  }, []);

  // Fade the floating continue cue once Design decisions / shop enter view.
  useEffect(() => {
    if (step !== 'result' || !job) {
      setDetailsInView(false);
      return;
    }
    const el = detailsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setDetailsInView(entry.isIntersecting && entry.intersectionRatio > 0.12),
      { root: null, threshold: [0, 0.12, 0.25], rootMargin: '-8% 0px -35% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [step, job]);

  // Bottom fade while more content remains below the fold.
  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const remaining = doc.scrollHeight - window.scrollY - window.innerHeight;
      setCanScrollMore(remaining > 28);
    };

    update();
    const t = window.setTimeout(update, 120);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [step, job, localPreview]);

  const onPickFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo of your room.');
      return;
    }
    genCancelRef.current += 1;
    setError(null);
    setJob(null);
    setIncomingJob(null);
    setGenBaseSrc(null);
    setCompareOriginal(false);
    setDetailsInView(false);
    setGenStatus('');
    setGenProgress(0);
    if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    const url = URL.createObjectURL(file);
    setLocalFile(file);
    setLocalPreview(url);
    setStep('style');
  }, [localPreview]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0] ?? null;
      onPickFile(file);
    },
    [onPickFile],
  );

  const useDemoRoom = useCallback(() => {
    genCancelRef.current += 1;
    setError(null);
    setJob(null);
    setIncomingJob(null);
    setGenBaseSrc(null);
    setCompareOriginal(false);
    setDetailsInView(false);
    setGenStatus('');
    setGenProgress(0);
    if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    setLocalFile(null);
    setLocalPreview(MOCK_ORIGINAL_ROOM);
    setStep('style');
  }, [localPreview]);

  const generate = useCallback(async () => {
    if (!localPreview || isBusy) return;

    const runId = ++genCancelRef.current;
    const reduced = prefersReducedMotion();
    const workMs = reduced ? 700 : 4600;
    const almostMs = reduced ? 180 : 850;
    const revealMs = reduced ? 220 : 1200;
    const lines = GEN_STATUS_LINES(selectedStyle.label);

    setError(null);
    setCompareOriginal(false);
    setIncomingJob(null);
    setGenBaseSrc(job?.styledImageUrl ?? localPreview);
    setGenProgress(0);
    setGenStatus(lines[0]);
    setStep('generating');

    const started = performance.now();
    let lineIndex = 0;

    const statusTimer = window.setInterval(() => {
      if (genCancelRef.current !== runId) return;
      lineIndex = Math.min(lineIndex + 1, lines.length - 1);
      setGenStatus(lines[lineIndex]);
    }, reduced ? 160 : 900);

    const progressTimer = window.setInterval(() => {
      if (genCancelRef.current !== runId) return;
      const elapsed = performance.now() - started;
      // Ease toward ~88% while working; the almost/reveal phases finish the meter.
      const t = Math.min(1, elapsed / workMs);
      setGenProgress(0.08 + t * 0.8);
    }, 50);

    const clearGenTimers = () => {
      window.clearInterval(statusTimer);
      window.clearInterval(progressTimer);
    };

    try {
      const [result] = await Promise.all([
        havenClient.createJob(localFile, styleId, localPreview),
        wait(workMs),
      ]);

      clearGenTimers();
      if (genCancelRef.current !== runId) return;

      await preloadImage(result.styledImageUrl);
      if (genCancelRef.current !== runId) return;

      setGenStatus(GEN_ALMOST_LINE);
      setGenProgress(0.94);
      await wait(almostMs);
      if (genCancelRef.current !== runId) return;

      setIncomingJob(result);
      setJob(result);
      setGenProgress(1);
      setStep('revealing');

      await wait(revealMs);
      if (genCancelRef.current !== runId) return;

      setIncomingJob(null);
      setGenBaseSrc(null);
      setGenStatus('');
      setGenProgress(0);
      setStep('result');
    } catch {
      clearGenTimers();
      if (genCancelRef.current !== runId) return;
      setIncomingJob(null);
      setGenBaseSrc(null);
      setGenStatus('');
      setGenProgress(0);
      setError('Could not style this room. Try again.');
      setStep(job ? 'result' : 'style');
    }
  }, [isBusy, job, localFile, localPreview, selectedStyle.label, styleId]);

  const scrollToDetails = useCallback(() => {
    scrollElementToPageTop(detailsRef.current, 28);
  }, []);

  const reset = useCallback(() => {
    genCancelRef.current += 1;
    if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    setLocalFile(null);
    setLocalPreview(null);
    setJob(null);
    setIncomingJob(null);
    setGenBaseSrc(null);
    setError(null);
    setActiveHotspot(null);
    setCompareOriginal(false);
    setDetailsInView(false);
    setGenStatus('');
    setGenProgress(0);
    setStep('upload');
    setStyleId('organic_modern');
  }, [localPreview]);

  const showContinueCue = step === 'result' && job != null && !detailsInView;

  // Locked at generate start so the wipe reveals over the prior room, not the new one.
  const stageBaseSrc =
    step === 'result' && job
      ? compareOriginal
        ? job.originalImageUrl
        : job.styledImageUrl
      : genBaseSrc ?? localPreview;

  const revealSrc = incomingJob?.styledImageUrl ?? null;
  const showHotspots = step === 'result' && job && !compareOriginal;
  const canGenerate = Boolean(localPreview) && !isBusy && step !== 'result';
  const stylesLocked = isBusy || step === 'result';

  const productsById = useMemo(() => {
    const map = new Map<string, HavenProduct>();
    job?.products.forEach((p) => map.set(p.id, p));
    return map;
  }, [job]);

  const hotspots = job ? MOCK_HOTSPOTS_BY_STYLE[job.styleId] : [];

  return (
    <div className="hv-root">
      <div className="hv-shell">
        <header className="hv-topbar hv-reveal hv-reveal--1">
          <div className="hv-brand">
            <h1 className="hv-brand__name">Haven</h1>
            <p className="hv-brand__tag">
              Transform your room into a professionally curated look, then shop the pieces.
            </p>
          </div>
          {localPreview && (
            <button
              type="button"
              className="hv-btn hv-btn--ghost hv-btn--start-over"
              onClick={reset}
              disabled={isBusy}
            >
              Start over
            </button>
          )}
        </header>

        <section
          className={[
            'hv-stage',
            'hv-reveal',
            'hv-reveal--2',
            step === 'generating' ? 'hv-stage--working' : '',
            step === 'revealing' ? 'hv-stage--revealing' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label="Room stage"
          aria-busy={isBusy}
        >
          <input
            ref={fileRef}
            className="hv-file-input"
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />

          {!stageBaseSrc ? (
            <div
              className="hv-stage__empty"
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <p className="hv-stage__empty-title">Upload a room photo</p>
              <p className="hv-stage__empty-sub">
                Drop a living room, bedroom, or office shot. We’ll restyle it and surface
                shoppable pieces.
              </p>
              <button
                type="button"
                className="hv-btn hv-btn--primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
              >
                Choose photo
              </button>
              <button
                type="button"
                className="hv-btn hv-btn--ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  useDemoRoom();
                }}
              >
                Use demo room
              </button>
            </div>
          ) : (
            <>
              <div className="hv-stage__frame">
                <img
                  className="hv-stage__img hv-stage__img--base"
                  src={stageBaseSrc}
                  alt={
                    step === 'result' && !compareOriginal
                      ? `Room styled as ${selectedStyle.label}`
                      : 'Your room'
                  }
                />
                {revealSrc && (
                  <img
                    className="hv-stage__img hv-stage__img--incoming"
                    src={revealSrc}
                    alt=""
                    aria-hidden="true"
                  />
                )}
              </div>

              {(step === 'generating' || step === 'revealing') && (
                <div
                  className={`hv-gen${step === 'revealing' ? ' hv-gen--leaving' : ''}`}
                  aria-live="polite"
                >
                  <div className="hv-gen__veil" aria-hidden="true" />
                  <div className="hv-gen__sheen" aria-hidden="true" />
                  <div className="hv-gen__glow" aria-hidden="true" />
                  <div className="hv-gen__copy">
                    <p className="hv-gen__eyebrow">Styling your room</p>
                    <p className="hv-gen__status" key={genStatus}>
                      {genStatus}
                    </p>
                    <div className="hv-gen__meter" aria-hidden="true">
                      <div
                        className="hv-gen__meter-fill"
                        style={{ transform: `scaleX(${Math.min(1, Math.max(0, genProgress))})` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {showHotspots && (
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
                          aria-label={`${product.name}, ${formatPrice(product.price)}`}
                          aria-expanded={open}
                          aria-controls={`hv-hotspot-card-${h.id}`}
                          onFocus={() => openHotspot(h.id)}
                          onBlur={(e) => {
                            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                              scheduleCloseHotspot();
                            }
                          }}
                          onClick={() => {
                            if (activeHotspot === h.id) scheduleCloseHotspot();
                            else openHotspot(h.id);
                          }}
                        />
                        <div
                          id={`hv-hotspot-card-${h.id}`}
                          className={`hv-hotspot-card hv-hotspot-card--${placement}`}
                          role="dialog"
                          aria-label={product.name}
                          aria-hidden={!open}
                        >
                          <img
                            className="hv-hotspot-card__img"
                            src={product.imageUrl}
                            alt=""
                          />
                          <div className="hv-hotspot-card__body">
                            <span className="hv-hotspot-card__merchant">
                              {product.merchant}
                            </span>
                            <p className="hv-hotspot-card__name">{product.name}</p>
                            <p className="hv-hotspot-card__price">
                              {formatPrice(product.price)}
                            </p>
                            <a
                              className="hv-hotspot-card__buy"
                              href={product.affiliateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              tabIndex={open ? 0 : -1}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Buy
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {localPreview && (
          <div className="hv-controls hv-reveal hv-reveal--3">
            <p className="hv-chips-label">
              {stylesLocked && step === 'result' ? 'Your style' : 'Choose a style'}
            </p>
            <div className="hv-controls__row">
              <div
                className="hv-chips"
                role="listbox"
                aria-label="Style personalities"
                aria-disabled={stylesLocked}
              >
                {STYLE_PERSONALITIES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    role="option"
                    aria-selected={styleId === style.id}
                    className={`hv-chip${styleId === style.id ? ' hv-chip--active' : ''}`}
                    disabled={stylesLocked}
                    onClick={() => setStyleId(style.id)}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
              <div className="hv-actions">
                {step !== 'result' && (
                  <button
                    type="button"
                    className="hv-btn hv-btn--primary"
                    disabled={!canGenerate}
                    onClick={() => void generate()}
                  >
                    {isBusy ? 'Styling room…' : 'Generate styled room'}
                  </button>
                )}
                {step === 'result' && job && (
                  <button
                    type="button"
                    className="hv-btn hv-btn--ghost"
                    onClick={() => setCompareOriginal((v) => !v)}
                  >
                    {compareOriginal ? 'Show styled' : 'Show original'}
                  </button>
                )}
              </div>
            </div>
            <p className="hv-style-hint">
              {step === 'result'
                ? `${selectedStyle.label}. ${selectedStyle.blurb} Start over to try another style.`
                : `Transform this room into ${selectedStyle.label}. ${selectedStyle.blurb}`}
            </p>
          </div>
        )}

        {error && (
          <p className="hv-style-hint" role="alert" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        )}

        {step === 'result' && job && (
          <>
            <section
              ref={detailsRef}
              className="hv-section hv-reveal hv-reveal--2"
              id="haven-details"
            >
              <h2 className="hv-section__title">Design decisions</h2>
              <ul className="hv-notes">
                {job.notes.map((note) => (
                  <li key={note.id}>{note.text}</li>
                ))}
              </ul>
            </section>

            <section className="hv-section hv-section--shop hv-reveal hv-reveal--3">
              <h2 className="hv-section__title">Shop this look</h2>
              <div className="hv-products">
                {job.products.map((product, i) => (
                  <article
                    key={product.id}
                    className="hv-product hv-reveal"
                    style={{ animationDelay: `${0.08 + i * 0.07}s` }}
                  >
                    <img
                      className="hv-product__img"
                      src={product.imageUrl}
                      alt=""
                      loading="lazy"
                    />
                    <div className="hv-product__body">
                      <span className="hv-product__merchant">{product.merchant}</span>
                      <h3 className="hv-product__name">{product.name}</h3>
                      <p className="hv-product__price">{formatPrice(product.price)}</p>
                      <a
                        className="hv-product__buy"
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buy
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="hv-chat" aria-disabled="true">
              <input
                type="text"
                disabled
                placeholder="Ask the room… “make the rug larger”"
                aria-label="Chat with room (coming soon)"
              />
              <button type="button" className="hv-btn hv-btn--ghost" disabled>
                Send
              </button>
            </div>
          </>
        )}
      </div>

      <div
        className={`hv-scroll-fade${canScrollMore ? ' hv-scroll-fade--visible' : ''}`}
        aria-hidden="true"
      />

      {job && step === 'result' && (
        <button
          type="button"
          className={`hv-continue${showContinueCue ? ' hv-continue--visible' : ''}`}
          onClick={scrollToDetails}
          tabIndex={showContinueCue ? 0 : -1}
          aria-hidden={!showContinueCue}
        >
          <span>
            {job.notes.length} design notes · Shop {job.products.length} pieces
          </span>
          <span className="hv-continue__chevron" aria-hidden="true">
            ↓
          </span>
        </button>
      )}
    </div>
  );
};

export default HavenApp;
