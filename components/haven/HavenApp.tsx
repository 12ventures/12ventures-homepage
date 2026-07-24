import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HavenApiError, havenClient } from './api/havenClient';
import { STYLE_PERSONALITIES } from './mock/styles';
import type {
  HavenProduct,
  HavenStep,
  RoomJob,
  RoomSetDetail,
  StyleId,
  StylePersonality,
} from './types';
import { cssAspectToNumber, resolveStageAspect } from './types';
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

function roomSetToJob(
  set: RoomSetDetail,
  styleId: StyleId,
  originalImageUrl: string,
): RoomJob {
  const notes: RoomJob['notes'] = [];
  if (set.blurb) {
    notes.push({ id: 'blurb', text: set.blurb });
  }
  if (set.tags?.length) {
    notes.push({ id: 'tags', text: `Mood: ${set.tags.join(', ')}` });
  }
  if (!notes.length) {
    notes.push({ id: 'look', text: set.label || 'A curated look you can shop.' });
  }
  return {
    id: set.id,
    styleId,
    originalImageUrl,
    styledImageUrl: set.imageUrl,
    notes,
    products: set.products,
    hotspots: set.hotspots,
    status: 'ready',
    imageWidth: set.imageWidth,
    imageHeight: set.imageHeight,
    aspectRatio: set.aspectRatio,
    fromCurated: true,
  };
}

const HavenApp: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const genCancelRef = useRef(0);
  const hotspotLeaveTimerRef = useRef<number | null>(null);

  const [step, setStep] = useState<HavenStep>('upload');
  const [styles, setStyles] = useState<StylePersonality[]>([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [styleId, setStyleId] = useState<StyleId>('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  /** Demo path: no upload file — Generate reveals a curated set. */
  const [usingDemo, setUsingDemo] = useState(false);
  const [job, setJob] = useState<RoomJob | null>(null);
  const [incomingJob, setIncomingJob] = useState<RoomJob | null>(null);
  const [genBaseSrc, setGenBaseSrc] = useState<string | null>(null);
  const [stageAspect, setStageAspect] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [detailsInView, setDetailsInView] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [genProgress, setGenProgress] = useState(0);

  const selectedStyle = useMemo(
    () => (styleId ? styles.find((s) => s.id === styleId) ?? null : null),
    [styles, styleId],
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
    let cancelled = false;
    void (async () => {
      setStylesLoading(true);
      try {
        const items = await havenClient.listStyles();
        if (cancelled) return;
        // From GET /styles — do not auto-select a style.
        const list = items.length ? items : STYLE_PERSONALITIES;
        setStyles(list);
        setStyleId((prev) => (prev && list.some((s) => s.id === prev) ? prev : ''));
      } catch {
        if (!cancelled) {
          setStyles(STYLE_PERSONALITIES);
          setStyleId('');
        }
      } finally {
        if (!cancelled) setStylesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
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
    hotspotLeaveTimerRef.current = window.setTimeout(() => {
      setActiveHotspot(null);
      hotspotLeaveTimerRef.current = null;
    }, 220);
  }, []);

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

  const onPickFile = useCallback(
    (file: File | null) => {
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
      setUsingDemo(false);
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
      const url = URL.createObjectURL(file);
      setLocalFile(file);
      setLocalPreview(url);
      setStyleId('');
      setStageAspect(undefined);
      setStep('style');
    },
    [localPreview],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0] ?? null;
      onPickFile(file);
    },
    [onPickFile],
  );

  /** Same as choose photo → style step, but with a preset room image (no file). */
  const useDemoRoom = useCallback(async () => {
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

    const enterDemoStylePick = () => {
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
      setLocalFile(null);
      setLocalPreview(null);
      setUsingDemo(true);
      setStyleId('');
      setStageAspect('16 / 9');
      setStep('style');
    };

    try {
      // Probe that a demo set exists — do not put the furnished set image in the stage.
      await havenClient.getDemoRoom();
      enterDemoStylePick();
    } catch (err) {
      if (err instanceof HavenApiError && err.status === 404) {
        setError('Demo look coming soon — create a featured room set in Admin.');
        return;
      }
      // Offline / mock: still enter style pick without flashing a furnished look.
      enterDemoStylePick();
    }
  }, [localPreview]);

  /** Resolve a curated set for the chosen style (demo generate — no AI job). */
  const resolveCuratedLook = useCallback(async (forStyleId: StyleId): Promise<RoomSetDetail> => {
    try {
      const sets = await havenClient.listRoomSets({ styleId: forStyleId });
      const pick = sets.find((s) => s.featured && s.imageUrl) ?? sets.find((s) => s.imageUrl);
      if (pick) return havenClient.getRoomSet(pick.id);
    } catch {
      /* fall through */
    }
    return havenClient.getDemoRoom();
  }, []);

  const generate = useCallback(async () => {
    if ((!localPreview && !usingDemo) || !styleId || !selectedStyle || isBusy) return;

    const runId = ++genCancelRef.current;
    const reduced = prefersReducedMotion();
    const almostMs = reduced ? 180 : 850;
    const revealMs = reduced ? 220 : 1200;
    const lines = GEN_STATUS_LINES(selectedStyle.label);
    const styleShell = selectedStyle.baseRoomImageUrl || '';
    const genBackdrop = usingDemo
      ? styleShell || localPreview || ''
      : localPreview || '';

    setError(null);
    setCompareOriginal(false);
    setIncomingJob(null);
    setGenBaseSrc(job?.styledImageUrl ?? genBackdrop);
    setGenProgress(0);
    setGenStatus(lines[0]);
    setStep('generating');

    const started = performance.now();
    let lineIndex = 0;

    const statusTimer = window.setInterval(() => {
      if (genCancelRef.current !== runId) return;
      lineIndex = Math.min(lineIndex + 1, lines.length - 1);
      setGenStatus(lines[lineIndex]);
    }, reduced ? 160 : 1100);

    const progressTimer = window.setInterval(() => {
      if (genCancelRef.current !== runId) return;
      const elapsed = performance.now() - started;
      const t = 1 - Math.exp(-elapsed / 12000);
      setGenProgress(0.08 + t * 0.82);
    }, 80);

    const clearGenTimers = () => {
      window.clearInterval(statusTimer);
      window.clearInterval(progressTimer);
    };

    try {
      let result: RoomJob;

      if (usingDemo) {
        // Curated path: same choreography, already-available room set (no upload/job).
        const minSpin = reduced ? 400 : 1600;
        const [set] = await Promise.all([
          resolveCuratedLook(styleId),
          wait(minSpin),
        ]);
        if (!set.imageUrl) {
          throw new Error('No curated look for this style yet.');
        }
        result = roomSetToJob(set, styleId, styleShell || set.imageUrl);
      } else {
        if (!localPreview) throw new Error('Please choose a photo of your room.');
        result = await havenClient.styleRoom({
          file: localFile,
          previewUrl: localPreview,
          styleId,
        });
      }

      clearGenTimers();
      if (genCancelRef.current !== runId) return;

      setStageAspect(
        resolveStageAspect({
          width: result.imageWidth,
          height: result.imageHeight,
          aspectRatio: result.aspectRatio,
        }),
      );
      if (result.originalImageUrl) {
        setGenBaseSrc(result.originalImageUrl);
      }

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
    } catch (err) {
      clearGenTimers();
      if (genCancelRef.current !== runId) return;
      setIncomingJob(null);
      setGenBaseSrc(null);
      setGenStatus('');
      setGenProgress(0);
      if (err instanceof HavenApiError && err.status === 404) {
        setError('No curated look available yet — create a featured room set in Admin.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not style this room. Try again.');
      }
      setStep(job ? 'result' : 'style');
    }
  }, [
    isBusy,
    job,
    localFile,
    localPreview,
    resolveCuratedLook,
    selectedStyle,
    styleId,
    usingDemo,
  ]);

  const scrollToDetails = useCallback(() => {
    scrollElementToPageTop(detailsRef.current, 28);
  }, []);

  const reset = useCallback(() => {
    genCancelRef.current += 1;
    if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    setLocalFile(null);
    setLocalPreview(null);
    setUsingDemo(false);
    setJob(null);
    setIncomingJob(null);
    setGenBaseSrc(null);
    setError(null);
    setActiveHotspot(null);
    setCompareOriginal(false);
    setDetailsInView(false);
    setGenStatus('');
    setGenProgress(0);
    setStageAspect(undefined);
    setStep('upload');
    setStyleId('');
  }, [localPreview]);

  // Demo only: size stage to the style shell. Upload path keeps the user’s photo.
  useEffect(() => {
    if (step !== 'style' || !usingDemo || !selectedStyle) return;
    setStageAspect(
      resolveStageAspect({
        width: selectedStyle.baseRoomWidth,
        height: selectedStyle.baseRoomHeight,
        aspectRatio: selectedStyle.baseRoomAspectRatio,
      }) || '16 / 9',
    );
  }, [step, usingDemo, selectedStyle]);

  const syncStageAspectFromImage = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img?.naturalWidth || !img.naturalHeight) return;
      setStageAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
    },
    [],
  );

  const showContinueCue = step === 'result' && job != null && !detailsInView;

  const styleShellUrl = selectedStyle?.baseRoomImageUrl || null;
  /** Demo path: empty shell until a style is picked (never the furnished set image). */
  const showAwaitingStyleGradient =
    step === 'style' && usingDemo && !styleId && !isBusy;
  /** Demo only — upload path never swaps the user’s photo for a style shell. */
  const showStyleGradient =
    step === 'style' && usingDemo && Boolean(styleId) && !styleShellUrl && !isBusy;

  const stageBaseSrc =
    step === 'result' && job
      ? compareOriginal
        ? job.originalImageUrl
        : job.styledImageUrl
      : isBusy
        ? genBaseSrc ?? (usingDemo ? styleShellUrl : null) ?? localPreview
        : usingDemo
          ? styleId
            ? styleShellUrl
            : null
          : localPreview;

  const showStageMedia =
    Boolean(stageBaseSrc) ||
    showStyleGradient ||
    showAwaitingStyleGradient ||
    isBusy;

  const revealSrc = incomingJob?.styledImageUrl ?? null;
  const showHotspots = step === 'result' && job && !compareOriginal;
  const inStyleFlow = Boolean(localPreview) || usingDemo;
  const canGenerate =
    inStyleFlow && Boolean(styleId) && !isBusy && step === 'style';
  const stylesLocked = isBusy || step === 'result';

  const stageAspectCss =
    (step === 'style' && usingDemo && styleId
      ? resolveStageAspect({
          width: selectedStyle?.baseRoomWidth,
          height: selectedStyle?.baseRoomHeight,
          aspectRatio: selectedStyle?.baseRoomAspectRatio,
        })
      : undefined) ||
    stageAspect ||
    resolveStageAspect({
      width: job?.imageWidth ?? incomingJob?.imageWidth,
      height: job?.imageHeight ?? incomingJob?.imageHeight,
      aspectRatio: job?.aspectRatio ?? incomingJob?.aspectRatio,
    }) ||
    '16 / 9';
  const stageArNumber = cssAspectToNumber(stageAspectCss);

  const productsById = useMemo(() => {
    const map = new Map<string, HavenProduct>();
    job?.products.forEach((p) => map.set(p.id, p));
    return map;
  }, [job]);

  const hotspots = job?.hotspots ?? [];

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
          <div className="hv-topbar__actions">
            <Link to="/haven/admin" className="hv-btn hv-btn--ghost hv-btn--start-over">
              Admin
            </Link>
            {inStyleFlow && (
              <button
                type="button"
                className="hv-btn hv-btn--ghost hv-btn--start-over"
                onClick={reset}
                disabled={isBusy}
              >
                Start over
              </button>
            )}
          </div>
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

          {!showStageMedia ? (
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
                  void useDemoRoom();
                }}
              >
                Use demo room
              </button>
            </div>
          ) : (
            <>
              <div
                className={`hv-stage__frame${stageBaseSrc || revealSrc ? '' : ' hv-stage__frame--ratio'}`}
                style={
                  {
                    '--hv-stage-ar': stageArNumber,
                  } as React.CSSProperties
                }
              >
                {/* In-flow sizer: real pixels + max-height → frame AR (no letterbox). */}
                {(stageBaseSrc || revealSrc) && (
                  <img
                    className="hv-stage__sizer"
                    src={revealSrc || stageBaseSrc!}
                    alt=""
                    aria-hidden="true"
                    onLoad={(e) => syncStageAspectFromImage(e.currentTarget)}
                  />
                )}
                {showStyleGradient ||
                showAwaitingStyleGradient ||
                (!stageBaseSrc && isBusy) ? (
                  <div
                    className="hv-stage__gradient"
                    role="img"
                    aria-label={
                      showAwaitingStyleGradient
                        ? 'Select your style below'
                        : selectedStyle
                          ? `${selectedStyle.label} style preview coming soon`
                          : 'Style preview'
                    }
                  >
                    {showAwaitingStyleGradient && (
                      <p className="hv-stage__cue">Select your style below</p>
                    )}
                  </div>
                ) : (
                  <img
                    className="hv-stage__img hv-stage__img--base"
                    src={stageBaseSrc!}
                    alt={
                      step === 'result' && !compareOriginal
                        ? `Room styled as ${selectedStyle?.label ?? 'selected style'}`
                        : step === 'style' && styleId
                          ? `${selectedStyle?.label ?? 'Style'} base room`
                          : usingDemo
                            ? 'Demo room'
                            : 'Your room'
                    }
                    onLoad={(e) => syncStageAspectFromImage(e.currentTarget)}
                  />
                )}
                {revealSrc && (
                  <img
                    className="hv-stage__img hv-stage__img--incoming"
                    src={revealSrc}
                    alt=""
                    aria-hidden="true"
                    onLoad={(e) => syncStageAspectFromImage(e.currentTarget)}
                  />
                )}

              {(step === 'generating' || step === 'revealing') && (
                <div
                  className={`hv-gen${step === 'revealing' ? ' hv-gen--leaving' : ''}`}
                  aria-live="polite"
                >
                  <div className="hv-gen__veil" aria-hidden="true" />
                  <div className="hv-gen__sheen" aria-hidden="true" />
                  <div className="hv-gen__glow" aria-hidden="true" />
                  <div className="hv-gen__copy">
                    <p className="hv-gen__eyebrow">
                      {usingDemo ? 'Pulling a curated look' : 'Styling your room'}
                    </p>
                    <p className="hv-gen__status" key={genStatus}>
                      {genStatus}
                    </p>
                    <div className="hv-gen__meter" aria-hidden="true">
                      <div
                        className="hv-gen__meter-fill"
                        style={{
                          transform: `scaleX(${Math.min(1, Math.max(0, genProgress))})`,
                        }}
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
                        <div
                          id={`hv-hotspot-card-${h.id}`}
                          className={`hv-hotspot-card hv-product hv-hotspot-card--${placement}`}
                          role="dialog"
                          aria-label={product.name}
                          aria-hidden={!open}
                        >
                          <img
                            className="hv-product__img"
                            src={product.imageUrl}
                            alt=""
                          />
                          <span className="hv-product__price">
                            {formatPrice(product.price)}
                          </span>
                          <div className="hv-product__body">
                            <span className="hv-product__merchant">
                              {product.merchant}
                            </span>
                            <p className="hv-product__name">{product.name}</p>
                            <a
                              className="hv-product__buy"
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
              </div>
            </>
          )}
        </section>

        {inStyleFlow && (
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
                {stylesLoading && styles.length === 0 ? (
                  <span className="hv-chip hv-chip--loading">Loading styles…</span>
                ) : (
                  styles.map((style) => (
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
                      {style.baseRoomImageUrl ? (
                        <span className="hv-chip__preview" aria-hidden="true">
                          <img src={style.baseRoomImageUrl} alt="" />
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
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
              {step === 'result' && selectedStyle
                ? `${selectedStyle.label}. ${selectedStyle.blurb} Start over to try another style.`
                : selectedStyle
                  ? usingDemo
                    ? `Transform this room into ${selectedStyle.label}. ${selectedStyle.blurb}`
                    : `${selectedStyle.label}. ${selectedStyle.blurb} We’ll restyle your photo and surface shoppable pieces.`
                  : usingDemo
                    ? 'Pick a style to preview its room shell, then generate.'
                    : 'Pick a style, then generate to restyle your photo.'}
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
                    <span className="hv-product__price">
                      {formatPrice(product.price)}
                    </span>
                    <div className="hv-product__body">
                      <span className="hv-product__merchant">{product.merchant}</span>
                      <h3 className="hv-product__name">{product.name}</h3>
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
