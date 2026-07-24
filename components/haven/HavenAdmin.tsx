import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { havenAdminClient, type ProductImportResult } from './api/havenAdminClient';
import type { HavenHotspot, HavenProduct, RoomSet, RoomSetDetail, StylePersonality } from './types';
import {
  isRoomSetGenerating,
  resolveStageAspect,
  roomSetGenerateCopy,
} from './types';
import './haven-admin.css';

const POLL_MS = 2000;

function hasProductImage(p: HavenProduct): boolean {
  return Boolean(p.imageUrl?.trim());
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.5 2.5H13.5V6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 9L13.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 9.5V12.5C12.5 13.0523 12.0523 13.5 11.5 13.5H3.5C2.94772 13.5 2.5 13.0523 2.5 12.5V4.5C2.5 3.94772 2.94772 3.5 3.5 3.5H6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectedCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M6.5 11.25L9.75 14.5L15.5 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.6L9.7 5.5L14 6.05L10.9 8.95L11.75 13.2L8 11.05L4.25 13.2L5.1 8.95L2 6.05L6.3 5.5L8 1.6Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8C2.8 5.4 5.1 3.8 8 3.8S13.2 5.4 14.5 8C13.2 10.6 10.9 12.2 8 12.2S2.8 10.6 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2.5L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.2 6.35C5.85 6.75 5.65 7.3 5.65 8C5.65 9.3 6.7 10.35 8 10.35C8.7 10.35 9.25 10.15 9.65 9.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M3.3 4.6C2.35 5.45 1.7 6.55 1.5 8C2.8 10.6 5.1 12.2 8 12.2C9.15 12.2 10.2 11.95 11.1 11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.4 4.05C6.9 3.9 7.45 3.8 8 3.8C10.9 3.8 13.2 5.4 14.5 8C14.2 8.6 13.8 9.15 13.3 9.65"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 4.5H12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6 4.5V3.5C6 3 6.4 2.5 7 2.5H9C9.6 2.5 10 3 10 3.5V4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5 4.5L5.4 12.2C5.45 12.8 5.9 13.2 6.5 13.2H9.5C10.1 13.2 10.55 12.8 10.6 12.2L11 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 8A5 5 0 1 1 11.5 4.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M11 2.5V4.8H13.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DEFAULT_QUERIES = '';

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

const ProductTile: React.FC<{
  product: HavenProduct;
  onActivate: () => void;
  disabled?: boolean;
  selected?: boolean;
  busyLabel?: string | null;
  hoverLabel: string;
  ariaLabel: string;
}> = ({
  product,
  onActivate,
  disabled,
  selected,
  busyLabel,
  hoverLabel,
  ariaLabel,
}) => {
  const hasImage = hasProductImage(product);
  return (
    <div
      className={[
        'hv-admin__tile',
        hasImage ? '' : 'hv-admin__tile--empty',
        selected ? 'hv-admin__tile--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="hv-admin__tile-ratio">
        <button
          type="button"
          className={`hv-admin__tile-face${busyLabel ? ' is-busy' : ''}`}
          disabled={disabled}
          onClick={onActivate}
          aria-label={ariaLabel}
          aria-pressed={selected}
        >
          {hasImage ? (
            <img
              className="hv-admin__tile-photo"
              src={product.imageUrl}
              alt=""
              loading="lazy"
            />
          ) : (
            <span
              className="hv-admin__tile-photo hv-admin__tile-photo--empty"
              aria-hidden="true"
            />
          )}
          <span className="hv-admin__tile-shade" aria-hidden="true" />
          {selected ? (
            <span className="hv-admin__tile-check" aria-hidden="true">
              <SelectedCheckIcon />
            </span>
          ) : (
            <span className="hv-admin__tile-hover">{busyLabel || hoverLabel}</span>
          )}
          <span className="hv-admin__tile-copy">
            <span className="hv-admin__tile-name">{product.name}</span>
            <span className="hv-admin__tile-meta">
              <strong>{formatPrice(product.price)}</strong>
              {product.externalSku ? ` · ${product.externalSku}` : ''}
            </span>
          </span>
        </button>
        {product.affiliateUrl ? (
          <a
            className="hv-admin__ext-link hv-admin__ext-link--tile"
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open product page"
            aria-label={`Open ${product.name} in a new tab`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLinkIcon />
          </a>
        ) : null}
      </div>
    </div>
  );
};

function roomSetCardMeta(set: RoomSet, styleLabel?: string): string {
  const pins = set.hotspots?.length ?? 0;
  if (set.generateStatus === 'failed') {
    return 'Generation failed';
  }
  if (set.imageUrl && (set.generateStatus === 'ready' || pins > 0 || set.generateStatus == null)) {
    return `${pins} pin${pins === 1 ? '' : 's'}${styleLabel ? ` · ${styleLabel}` : ''}${
      set.featured ? ' · featured' : ''
    }${set.enabled === false ? ' · hidden' : ''}`;
  }
  return `Draft / not generated${styleLabel ? ` · ${styleLabel}` : ''}${
    set.enabled === false ? ' · hidden' : ''
  }`;
}

const HavenAdmin: React.FC = () => {
  const [styles, setStyles] = useState<StylePersonality[]>([]);
  const [products, setProducts] = useState<HavenProduct[]>([]);
  const [roomSets, setRoomSets] = useState<RoomSet[]>([]);
  const [editing, setEditing] = useState<RoomSetDetail | null>(null);
  const [draftHotspots, setDraftHotspots] = useState<HavenHotspot[]>([]);
  const [pinEditMode, setPinEditMode] = useState(false);
  const [reusedBaseRoom, setReusedBaseRoom] = useState(false);
  const draggingPinId = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [queriesText, setQueriesText] = useState(DEFAULT_QUERIES);
  const [maxPerQuery, setMaxPerQuery] = useState(5);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);

  const [roomStyleId, setRoomStyleId] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [roomBlurb, setRoomBlurb] = useState('');
  const [roomTags, setRoomTags] = useState('');
  const [roomFeatured, setRoomFeatured] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [imageTargetId, setImageTargetId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);

  const missingImageCount = useMemo(
    () => products.filter((p) => !hasProductImage(p)).length,
    [products],
  );

  const productsById = useMemo(() => {
    const map = new Map<string, HavenProduct>();
    products.forEach((p) => map.set(p.id, p));
    editing?.products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products, editing]);

  const styleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    styles.forEach((s) => map.set(s.id, s.label));
    return map;
  }, [styles]);

  const selectedMissingImages = useMemo(
    () =>
      selectedProductIds
        .map((id) => productsById.get(id))
        .filter((p): p is HavenProduct => Boolean(p) && !hasProductImage(p)),
    [selectedProductIds, productsById],
  );

  const productsWithImages = useMemo(
    () => products.filter((p) => hasProductImage(p)).length,
    [products],
  );

  const anyGenerating = useMemo(
    () =>
      roomSets.some((s) => isRoomSetGenerating(s.generateStatus)) ||
      isRoomSetGenerating(editing?.generateStatus),
    [roomSets, editing?.generateStatus],
  );

  const refresh = useCallback(async () => {
    setError(null);
    const [styleList, productList] = await Promise.all([
      havenAdminClient.listStyles(),
      havenAdminClient.listProducts().catch(() => [] as HavenProduct[]),
    ]);
    setStyles(styleList);
    setProducts(productList);
    setRoomStyleId((prev) => prev || styleList[0]?.id || '');
  }, []);

  /** Keep grid order stable across polls so a generating card doesn’t jump slots. */
  const mergeRoomSets = useCallback((incoming: RoomSet[], preferFrontId?: string) => {
    setRoomSets((prev) => {
      const byId = new Map(incoming.map((s) => [s.id, s]));
      const seen = new Set<string>();
      const next: RoomSet[] = [];

      if (preferFrontId && byId.has(preferFrontId)) {
        next.push(byId.get(preferFrontId)!);
        seen.add(preferFrontId);
      }

      for (const s of prev) {
        const updated = byId.get(s.id);
        if (!updated || seen.has(s.id)) continue;
        next.push(updated);
        seen.add(s.id);
      }
      for (const s of incoming) {
        if (seen.has(s.id)) continue;
        next.push(s);
        seen.add(s.id);
      }
      return next;
    });
  }, []);

  const refreshRoomSets = useCallback(async () => {
    const sets = await havenAdminClient.listRoomSets();
    mergeRoomSets(sets);
  }, [mergeRoomSets]);

  const applyDetail = useCallback((detail: RoomSetDetail) => {
    setEditing(detail);
    setDraftHotspots(detail.hotspots ?? []);
    setRoomSets((prev) => {
      const idx = prev.findIndex((s) => s.id === detail.id);
      if (idx < 0) return [detail, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...detail };
      return next;
    });
  }, []);

  const openEditor = useCallback(
    async (id: string) => {
      const detail = await havenAdminClient.getRoomSet(id);
      applyDetail(detail);
      setPinEditMode(false);
      draggingPinId.current = null;
      setReusedBaseRoom(false);
    },
    [applyDetail],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await refresh();
        if (!cancelled) await refreshRoomSets();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load admin data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, refreshRoomSets]);

  // Poll in-progress room-set generates (~2s).
  useEffect(() => {
    if (!anyGenerating) return;
    let cancelled = false;
    const editingId = editing?.id;

    const tick = async () => {
      try {
        const sets = await havenAdminClient.listRoomSets();
        if (cancelled) return;
        mergeRoomSets(sets);

        if (editingId) {
          const detail = await havenAdminClient.getRoomSet(editingId);
          if (cancelled) return;
          applyDetail(detail);

          if (detail.generateJobId && isRoomSetGenerating(detail.generateStatus)) {
            try {
              const job = await havenAdminClient.getRoomSetJob(detail.generateJobId);
              if (cancelled) return;
              if (job.reusedBaseRoom) setReusedBaseRoom(true);
              setEditing((prev) =>
                prev && prev.id === editingId
                  ? {
                      ...prev,
                      generateStatus: job.status || prev.generateStatus,
                      generateProgress: job.progress ?? prev.generateProgress,
                      generateMessage: job.message ?? prev.generateMessage,
                      generateError: job.error ?? prev.generateError,
                    }
                  : prev,
              );
            } catch {
              /* detail poll is enough */
            }
          }
        }
      } catch {
        /* keep last UI; next tick retries */
      }
    };

    const id = window.setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [anyGenerating, editing?.id, applyDetail, mergeRoomSets]);

  useEffect(() => {
    document.title = 'Haven · Admin';
  }, []);

  const selectedStyle = useMemo(
    () => styles.find((s) => s.id === roomStyleId),
    [styles, roomStyleId],
  );

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    setOkMsg(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(null);
    }
  };

  const onImport = () =>
    void run('import', async () => {
      const queries = queriesText
        .split(/\n|,/)
        .map((q) => q.trim())
        .filter(Boolean);
      if (!queries.length) throw new Error('Add at least one search query.');
      const result = await havenAdminClient.importProducts({
        queries,
        max_per_query: maxPerQuery,
        page: 1,
        fetch_details_when_no_image: true,
      });
      setImportResult(result);
      await refresh();
      const credits = result.credits_used_estimate ?? result.creditsUsedEstimate;
      setOkMsg(
        `Import done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped` +
          (credits != null ? ` · ~${credits} credits` : ''),
      );
    });

  const openCreatedSet = async (
    roomSet: RoomSet,
    generateJob?: { jobId: string; status: string; progress?: number; message?: string; reusedBaseRoom?: boolean },
  ) => {
    setReusedBaseRoom(Boolean(generateJob?.reusedBaseRoom));
    const sets = await havenAdminClient.listRoomSets();
    // New set occupies the first grid slot immediately (same place when ready).
    mergeRoomSets(sets, roomSet.id);
    const detail = await havenAdminClient.getRoomSet(roomSet.id);
    applyDetail({
      ...detail,
      ...roomSet,
      generateJobId: generateJob?.jobId ?? detail.generateJobId,
      generateStatus: generateJob?.status ?? roomSet.generateStatus ?? detail.generateStatus,
      generateProgress: generateJob?.progress ?? roomSet.generateProgress,
      generateMessage: generateJob?.message ?? roomSet.generateMessage,
    });
  };

  const onAutoCreateRoomSet = () =>
    void run('auto-room', async () => {
      if (!roomStyleId) throw new Error('Pick a style.');
      if (productsWithImages < 3) {
        throw new Error(
          'Need at least 3 catalog products with images before auto-generate.',
        );
      }
      const { roomSet, generateJob } = await havenAdminClient.autoCreateRoomSet({
        styleId: roomStyleId,
      });
      await openCreatedSet(roomSet, generateJob);
      const status = generateJob?.status ?? roomSet.generateStatus;
      if (status === 'failed') {
        throw new Error(
          roomSet.generateError ||
            'Set created but generate failed — use Retry on the card.',
        );
      }
      setOkMsg(
        isRoomSetGenerating(status)
          ? `“${roomSet.label}” curated — generating look…`
          : `Room set “${roomSet.label}” ready.`,
      );
    });

  const onCreateRoomSet = () =>
    void run('room', async () => {
      if (!roomStyleId) throw new Error('Pick a style.');
      if (!selectedProductIds.length) throw new Error('Select 1–6 products with images.');
      if (selectedMissingImages.length) {
        throw new Error(
          `Add images for: ${selectedMissingImages.map((p) => p.name).join(', ')}`,
        );
      }
      const label =
        roomLabel.trim() ||
        `${selectedStyle?.label ?? roomStyleId} Living Room`;
      const tags = roomTags
        .split(/,|\n/)
        .map((t) => t.trim())
        .filter(Boolean);
      const { roomSet, generateJob } = await havenAdminClient.createRoomSet({
        styleId: roomStyleId,
        label,
        blurb: roomBlurb.trim(),
        productIds: selectedProductIds,
        tags,
        aspectRatio: '16:9',
        autoGenerate: true,
        enabled: true,
        featured: roomFeatured,
        sortOrder: 0,
      });
      setRoomLabel('');
      setRoomBlurb('');
      setRoomTags('');
      setRoomFeatured(false);
      setSelectedProductIds([]);
      await openCreatedSet(roomSet, generateJob);
      setOkMsg(
        isRoomSetGenerating(generateJob?.status ?? roomSet.generateStatus)
          ? `“${label}” created — generating look…`
          : `Room set “${label}” created.`,
      );
    });

  const onRegenerate = (id: string) =>
    void run(`regen-${id}`, async () => {
      const { roomSet, generateJob } = await havenAdminClient.regenerateRoomSet(id);
      setReusedBaseRoom(Boolean(generateJob?.reusedBaseRoom));
      const detail = await havenAdminClient.getRoomSet(id);
      applyDetail({
        ...detail,
        ...roomSet,
        generateJobId: generateJob?.jobId ?? detail.generateJobId,
        generateStatus: generateJob?.status ?? roomSet.generateStatus ?? detail.generateStatus,
        generateProgress: generateJob?.progress ?? roomSet.generateProgress,
        generateMessage: generateJob?.message ?? roomSet.generateMessage,
        generateError: null,
      });
      setOkMsg('Regenerate started.');
    });

  const onDeleteRoomSet = (id: string) =>
    void run(`del-${id}`, async () => {
      await havenAdminClient.deleteRoomSet(id);
      if (editing?.id === id) {
        setEditing(null);
        setDraftHotspots([]);
      }
      await refreshRoomSets();
      setOkMsg('Room set removed.');
    });

  const onToggleFlag = (id: string, patch: { featured?: boolean; enabled?: boolean }) =>
    void run(`flag-${id}`, async () => {
      const updated = await havenAdminClient.patchRoomSet(id, patch);
      setRoomSets((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      if (editing?.id === id) setEditing((prev) => (prev ? { ...prev, ...updated } : prev));
      setOkMsg('Room set updated.');
    });

  const openImagePicker = (productId: string) => {
    setImageTargetId(productId);
    if (imageInputRef.current) imageInputRef.current.value = '';
    imageInputRef.current?.click();
  };

  const onImageFileChosen = (file: File | null) => {
    const productId = imageTargetId;
    setImageTargetId(null);
    if (!file || !productId) return;
    void run(`img-${productId}`, async () => {
      const updated = await havenAdminClient.uploadProductImage(productId, file);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setOkMsg(`Image set for ${updated.name}.`);
    });
  };

  const percentFromPointer = (clientX: number, clientY: number) => {
    const el = pinStageRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.round(((clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((clientY - rect.top) / rect.height) * 1000) / 10;
    return {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  };

  const onPinPointerDown = (e: React.PointerEvent, id: string) => {
    if (!pinEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    draggingPinId.current = id;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPinPointerMove = (e: React.PointerEvent) => {
    if (!pinEditMode || !draggingPinId.current) return;
    const next = percentFromPointer(e.clientX, e.clientY);
    if (!next) return;
    const id = draggingPinId.current;
    setDraftHotspots((prev) =>
      prev.map((h) => (h.id === id ? { ...h, x: next.x, y: next.y } : h)),
    );
  };

  const onPinPointerUp = (e: React.PointerEvent) => {
    if (draggingPinId.current == null) return;
    draggingPinId.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const startPinEdit = () => {
    if (!editing) return;
    setDraftHotspots(editing.hotspots ?? []);
    setPinEditMode(true);
  };

  const cancelPinEdit = () => {
    setDraftHotspots(editing?.hotspots ?? []);
    setPinEditMode(false);
    draggingPinId.current = null;
  };

  const onSaveHotspots = () =>
    void run('hotspots', async () => {
      if (!editing) return;
      const saved = await havenAdminClient.saveHotspots(editing.id, draftHotspots);
      setDraftHotspots(saved);
      setEditing((prev) => (prev ? { ...prev, hotspots: saved } : prev));
      setPinEditMode(false);
      draggingPinId.current = null;
      setOkMsg(`Saved ${saved.length} pin position${saved.length === 1 ? '' : 's'}.`);
    });

  const editingGenerating = isRoomSetGenerating(editing?.generateStatus);
  const editorHotspots = pinEditMode ? draftHotspots : (editing?.hotspots ?? []);
  const editorStageAspect =
    editing &&
    (resolveStageAspect({
      width: editing.imageWidth,
      height: editing.imageHeight,
      aspectRatio: editing.aspectRatio,
    }) ||
      '16 / 9');

  return (
    <div className="hv-admin">
      <div className="hv-admin__shell">
        <header className="hv-admin__top">
          <div>
            <h1 className="hv-admin__title">Haven Admin</h1>
            <p className="hv-admin__sub">
              Generate curated room looks, then manage the product catalog below.
            </p>
          </div>
          <div className="hv-admin__links">
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--ghost"
              disabled={loading || busy != null}
              onClick={() =>
                void run('refresh', async () => {
                  await refresh();
                  await refreshRoomSets();
                  if (editing) await openEditor(editing.id);
                })
              }
            >
              Refresh
            </button>
            <Link to="/haven" className="hv-admin__btn hv-admin__btn--primary">
              Open Haven
            </Link>
          </div>
        </header>

        {error && (
          <p className="hv-admin__msg hv-admin__msg--error" role="alert">
            {error}
          </p>
        )}
        {okMsg && !error && <p className="hv-admin__msg hv-admin__msg--ok">{okMsg}</p>}

        {loading ? (
          <p className="hv-admin__empty">Loading catalog…</p>
        ) : (
          <div className="hv-admin__grid">
            <input
              ref={imageInputRef}
              className="hv-admin__file-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                onImageFileChosen(e.target.files?.[0] ?? null);
              }}
            />

            <section className="hv-admin__panel hv-admin__panel--room">
              <div className="hv-admin__panel-head">
                <h2 className="hv-admin__panel-title">Curated room sets</h2>
              </div>

              <div className="hv-admin__auto-create">
                <label className="hv-admin__field hv-admin__field--inline">
                  <span className="hv-admin__label">Style</span>
                  <select
                    className="hv-admin__select"
                    value={roomStyleId}
                    onChange={(e) => {
                      setRoomStyleId(e.target.value);
                      setSelectedProductIds([]);
                    }}
                    disabled={!styles.length}
                  >
                    {!styles.length && <option value="">No styles available</option>}
                    {styles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="hv-admin__btn hv-admin__btn--primary"
                  disabled={
                    busy != null || !roomStyleId || !styles.length || productsWithImages < 3
                  }
                  onClick={onAutoCreateRoomSet}
                  title={
                    productsWithImages < 3
                      ? 'Import at least 3 products with images first'
                      : 'LLM picks products + label, then generates the look'
                  }
                >
                  {busy === 'auto-room' ? 'Generating for you…' : 'Generate for me'}
                </button>
              </div>

              <details className="hv-admin__manual">
                <summary className="hv-admin__manual-summary">Manual create (pick products)</summary>
                <div className="hv-admin__room-layout">
                <div className="hv-admin__form">
                  <label className="hv-admin__field">
                    <span className="hv-admin__label">Label</span>
                    <input
                      className="hv-admin__input"
                      value={roomLabel}
                      onChange={(e) => setRoomLabel(e.target.value)}
                      placeholder={
                        selectedStyle
                          ? `${selectedStyle.label} Living Room`
                          : 'Organic Modern Living Room'
                      }
                    />
                  </label>
                  <label className="hv-admin__field">
                    <span className="hv-admin__label">Blurb</span>
                    <input
                      className="hv-admin__input"
                      value={roomBlurb}
                      onChange={(e) => setRoomBlurb(e.target.value)}
                      placeholder="optional"
                    />
                  </label>
                  <label className="hv-admin__field">
                    <span className="hv-admin__label">Tags</span>
                    <input
                      className="hv-admin__input"
                      value={roomTags}
                      onChange={(e) => setRoomTags(e.target.value)}
                      placeholder="living, calm"
                    />
                  </label>
                  <label className="hv-admin__check">
                    <input
                      type="checkbox"
                      checked={roomFeatured}
                      onChange={(e) => setRoomFeatured(e.target.checked)}
                    />
                    Feature for Use demo room
                  </label>
                  <p className="hv-admin__panel-meta">
                    Selected {selectedProductIds.length}/6
                    {selectedMissingImages.length
                      ? ` · ${selectedMissingImages.length} missing image`
                      : ''}
                  </p>
                  <button
                    type="button"
                    className="hv-admin__btn hv-admin__btn--primary"
                    disabled={
                      busy != null ||
                      !roomStyleId ||
                      selectedProductIds.length < 1 ||
                      selectedProductIds.length > 6 ||
                      selectedMissingImages.length > 0
                    }
                    onClick={onCreateRoomSet}
                  >
                    {busy === 'room' ? 'Creating…' : 'Create & generate'}
                  </button>
                </div>

                <div>
                  <p className="hv-admin__label">Pick products (need images)</p>
                  {products.length === 0 ? (
                    <p className="hv-admin__empty" style={{ marginTop: 8 }}>
                      No products yet. Import a few queries above.
                    </p>
                  ) : (
                    <div className="hv-admin__tiles hv-admin__tiles--picker">
                      {products.map((p) => {
                        const selected = selectedProductIds.includes(p.id);
                        const noImg = !hasProductImage(p);
                        return (
                          <ProductTile
                            key={p.id}
                            product={p}
                            selected={selected}
                            disabled={
                              busy != null ||
                              (!selected && selectedProductIds.length >= 6) ||
                              (noImg && !selected)
                            }
                            hoverLabel={
                              noImg ? 'Needs image' : selected ? 'Selected' : 'Select'
                            }
                            ariaLabel={
                              noImg
                                ? `${p.name} needs an image before it can be used`
                                : selected
                                  ? `Deselect ${p.name}`
                                  : `Select ${p.name} for room set`
                            }
                            onActivate={() => {
                              if (noImg) {
                                openImagePicker(p.id);
                                return;
                              }
                              toggleProduct(p.id);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              </details>

              <div className="hv-admin__sets-head">
                <p className="hv-admin__label">Room sets</p>
                <p className="hv-admin__panel-meta">{roomSets.length} total</p>
              </div>

              {roomSets.length === 0 ? (
                <p className="hv-admin__empty">No room sets yet.</p>
              ) : (
                <div className="hv-admin__sets">
                  {roomSets.map((set) => {
                    const generating = isRoomSetGenerating(set.generateStatus);
                    const failed = set.generateStatus === 'failed';
                    const ready = Boolean(set.imageUrl) && !generating && !failed;
                    const hidden = set.enabled === false;
                    const pct = Math.min(
                      100,
                      Math.max(
                        0,
                        set.generateProgress != null
                          ? Math.round(Number(set.generateProgress))
                          : 0,
                      ),
                    );
                    const styleName = styleLabelById.get(set.styleId);
                    const aspectCss =
                      resolveStageAspect({
                        width: set.imageWidth,
                        height: set.imageHeight,
                        aspectRatio: set.aspectRatio,
                      }) || '16 / 9';

                    return (
                      <div
                        key={set.id}
                        className={[
                          'hv-admin__set',
                          ready || generating ? 'hv-admin__set--visual' : 'hv-admin__set--plain',
                          generating ? 'hv-admin__set--generating hv-admin__set--locked' : '',
                          editing?.id === set.id ? 'hv-admin__set--active' : '',
                          failed ? 'hv-admin__set--failed' : '',
                          hidden ? 'hv-admin__set--hidden' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-busy={generating || undefined}
                        aria-live={generating ? 'polite' : undefined}
                      >
                        <div
                          className="hv-admin__set-ratio"
                          style={{ aspectRatio: aspectCss }}
                        >
                          {ready ? (
                            <img
                              className="hv-admin__set-photo"
                              src={set.imageUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span
                              className="hv-admin__set-photo hv-admin__set-photo--empty"
                              aria-hidden="true"
                            />
                          )}
                          <span className="hv-admin__set-shade" aria-hidden="true" />

                          {generating ? (
                            <div className="hv-admin__set-gen">
                              <span className="hv-admin__set-label">{set.label}</span>
                              <span className="hv-admin__gen-copy">
                                {roomSetGenerateCopy(set.generateStatus, set.generateMessage)}
                              </span>
                              {reusedBaseRoom && editing?.id === set.id && (
                                <span className="hv-admin__gen-note">
                                  Reusing style base room…
                                </span>
                              )}
                              <div className="hv-admin__gen-meter" aria-hidden="true">
                                <div
                                  className="hv-admin__gen-meter-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="hv-admin__set-meta">{pct}%</span>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="hv-admin__set-open"
                                onClick={() =>
                                  void run(`edit-${set.id}`, () => openEditor(set.id))
                                }
                              >
                                <span className="hv-admin__set-copy">
                                  <span className="hv-admin__set-label">{set.label}</span>
                                  <span className="hv-admin__set-meta">
                                    {failed
                                      ? 'Generation failed'
                                      : roomSetCardMeta(set, styleName)}
                                  </span>
                                </span>
                              </button>

                              <div className="hv-admin__set-actions">
                                {failed && (
                                  <button
                                    type="button"
                                    className="hv-admin__icon-btn"
                                    disabled={busy != null}
                                    title="Retry generate"
                                    aria-label={`Retry generate for ${set.label}`}
                                    onClick={() => onRegenerate(set.id)}
                                  >
                                    <RefreshIcon />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={`hv-admin__icon-btn${set.featured ? ' is-on' : ''}`}
                                  disabled={busy != null}
                                  title={
                                    set.featured
                                      ? 'Unfeature (remove from demo preference)'
                                      : 'Feature (prefer for demo room)'
                                  }
                                  aria-label={
                                    set.featured
                                      ? `Unfeature ${set.label}`
                                      : `Feature ${set.label}`
                                  }
                                  aria-pressed={Boolean(set.featured)}
                                  onClick={() =>
                                    onToggleFlag(set.id, { featured: !set.featured })
                                  }
                                >
                                  <StarIcon filled={Boolean(set.featured)} />
                                </button>
                                <button
                                  type="button"
                                  className={`hv-admin__icon-btn${hidden ? ' is-on' : ''}`}
                                  disabled={busy != null}
                                  title={
                                    hidden
                                      ? 'Show on Haven (currently hidden)'
                                      : 'Hide from Haven'
                                  }
                                  aria-label={
                                    hidden ? `Show ${set.label}` : `Hide ${set.label}`
                                  }
                                  aria-pressed={hidden}
                                  onClick={() =>
                                    onToggleFlag(set.id, { enabled: hidden })
                                  }
                                >
                                  {hidden ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                                <button
                                  type="button"
                                  className="hv-admin__icon-btn hv-admin__icon-btn--danger"
                                  disabled={busy != null}
                                  title="Delete room set"
                                  aria-label={`Delete ${set.label}`}
                                  onClick={() => onDeleteRoomSet(set.id)}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {editing && !editingGenerating && (
                <div className="hv-admin__editor">
                  <div className="hv-admin__panel-head">
                    <h3 className="hv-admin__panel-title">{editing.label}</h3>
                  </div>

                  {editing.generateStatus === 'failed' && (
                    <div className="hv-admin__gen hv-admin__gen--failed">
                      <p className="hv-admin__gen-title">Generation failed</p>
                      <p className="hv-admin__gen-copy">
                        {editing.generateError ||
                          'Fix product images, then regenerate. The room set was still created.'}
                      </p>
                      <div className="hv-admin__row">
                        <button
                          type="button"
                          className="hv-admin__btn hv-admin__btn--primary"
                          disabled={busy != null}
                          onClick={() => onRegenerate(editing.id)}
                        >
                          {busy === `regen-${editing.id}` ? 'Retrying…' : 'Regenerate'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!editingGenerating && editing.imageUrl && (
                    <>
                      <div
                        ref={pinStageRef}
                        className={`hv-admin__pin-stage${pinEditMode ? ' hv-admin__pin-stage--editing' : ''}`}
                        style={{ aspectRatio: editorStageAspect || '16 / 9' }}
                      >
                        <img src={editing.imageUrl} alt="" className="hv-admin__pin-img" />
                        {editorHotspots.map((h) => {
                          const product = productsById.get(h.productId);
                          const placement =
                            h.y > 72 ? 'above' : h.y < 28 ? 'below' : h.x < 55 ? 'right' : 'left';
                          return (
                            <div
                              key={h.id}
                              className={`hv-admin__hotspot${pinEditMode ? ' hv-admin__hotspot--dragging' : ''}`}
                              style={{ left: `${h.x}%`, top: `${h.y}%` }}
                              onPointerDown={(e) => onPinPointerDown(e, h.id)}
                              onPointerMove={onPinPointerMove}
                              onPointerUp={onPinPointerUp}
                              onPointerCancel={onPinPointerUp}
                            >
                              <button
                                type="button"
                                className="hv-admin__pin"
                                tabIndex={pinEditMode ? 0 : -1}
                                aria-label={
                                  pinEditMode
                                    ? `Drag to reposition ${product?.name ?? h.label}`
                                    : product
                                      ? `${product.name}, ${formatPrice(product.price)}`
                                      : h.label
                                }
                              />
                              {!pinEditMode && product && (
                                <div
                                  className={`hv-admin__hotspot-card hv-admin__hotspot-card--${placement}`}
                                  role="tooltip"
                                >
                                  <img
                                    className="hv-admin__hotspot-card__img"
                                    src={product.imageUrl}
                                    alt=""
                                  />
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
                      <div className="hv-admin__row" style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="hv-admin__btn hv-admin__btn--ghost"
                          disabled={busy != null || pinEditMode}
                          onClick={() => onRegenerate(editing.id)}
                        >
                          {busy === `regen-${editing.id}` ? 'Regenerating…' : 'Regenerate'}
                        </button>
                        {pinEditMode ? (
                          <>
                            <button
                              type="button"
                              className="hv-admin__btn hv-admin__btn--ghost"
                              disabled={busy != null}
                              onClick={cancelPinEdit}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="hv-admin__btn hv-admin__btn--primary"
                              disabled={busy != null}
                              onClick={onSaveHotspots}
                            >
                              {busy === 'hotspots' ? 'Saving…' : 'Save'}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="hv-admin__btn hv-admin__btn--ghost"
                            disabled={busy != null || editorHotspots.length === 0}
                            onClick={startPinEdit}
                          >
                            Reposition pins
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {!editingGenerating &&
                    !editing.imageUrl &&
                    editing.generateStatus !== 'failed' && (
                      <div className="hv-admin__gen">
                        <p className="hv-admin__gen-copy">
                          Draft — not generated yet. Generate a look to continue.
                        </p>
                        <div className="hv-admin__row">
                          <button
                            type="button"
                            className="hv-admin__btn hv-admin__btn--primary"
                            disabled={busy != null}
                            onClick={() => onRegenerate(editing.id)}
                          >
                            Generate look
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </section>

            <section className="hv-admin__panel hv-admin__panel--products">
              <div className="hv-admin__panel-head">
                <h2 className="hv-admin__panel-title">Products</h2>
                <p className="hv-admin__panel-meta">
                  {products.length} in catalog
                  {missingImageCount ? ` · ${missingImageCount} missing image` : ''}
                </p>
              </div>
              <div className="hv-admin__form">
                <div className="hv-admin__scrape-row">
                  <label className="hv-admin__field hv-admin__field--grow">
                    <span className="hv-admin__label">Search queries</span>
                    <input
                      className="hv-admin__input"
                      value={queriesText}
                      onChange={(e) => setQueriesText(e.target.value)}
                      placeholder="linen sofa, jute rug, oak table"
                    />
                  </label>
                  <label className="hv-admin__field hv-admin__field--max">
                    <span className="hv-admin__label">Max</span>
                    <input
                      className="hv-admin__input"
                      type="number"
                      min={1}
                      max={20}
                      value={maxPerQuery}
                      onChange={(e) => setMaxPerQuery(Number(e.target.value) || 1)}
                    />
                  </label>
                  <button
                    type="button"
                    className="hv-admin__btn hv-admin__btn--primary hv-admin__scrape-btn"
                    disabled={busy != null}
                    onClick={onImport}
                  >
                    {busy === 'import' ? 'Scraping…' : 'Scrape Web for Products'}
                  </button>
                </div>
                {importResult?.errors?.length ? (
                  <p className="hv-admin__msg hv-admin__msg--error">
                    {importResult.errors.slice(0, 3).join(' · ')}
                  </p>
                ) : null}
              </div>

              {products.length === 0 ? (
                <p className="hv-admin__empty" style={{ marginTop: 12 }}>
                  No products yet. Scrape a few queries above.
                </p>
              ) : (
                <div className="hv-admin__tiles">
                  {products.map((p) => {
                    const hasImage = hasProductImage(p);
                    const uploading = busy === `img-${p.id}`;
                    return (
                      <ProductTile
                        key={p.id}
                        product={p}
                        disabled={busy != null}
                        busyLabel={uploading ? 'Uploading…' : null}
                        hoverLabel={hasImage ? 'Replace' : 'Add image'}
                        ariaLabel={
                          uploading
                            ? `Uploading image for ${p.name}`
                            : hasImage
                              ? `Replace image for ${p.name}`
                              : `Add image for ${p.name}`
                        }
                        onActivate={() => openImagePicker(p.id)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default HavenAdmin;
