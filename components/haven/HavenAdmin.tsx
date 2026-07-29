import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import { havenAdminClient, type ProductImportResult } from './api/havenAdminClient';
import { stylePickerThumb } from './api/mappers';
import { HavenAdminAddProduct } from './HavenAdminAddProduct';
import HavenAdminCreateStyleModal from './HavenAdminCreateStyleModal';
import { HavenAdminStudio } from './HavenAdminStudio';
import { HavenAdminTrends } from './HavenAdminTrends';
import { HavenProductFilterMenu } from './HavenProductFilterMenu';
import {
  applyProductFilters,
  categoryLabel,
  collectStoreOptions,
  DEFAULT_PRODUCT_FILTERS,
} from './productFilters';
import type {
  HavenHotspot,
  HavenMoodboard,
  HavenProduct,
  MoodboardCard,
  PlacementPin,
  ProductCatalogFilters,
  RoomSet,
  RoomSetDetail,
  StylePersonality,
  StudioView,
} from './types';
import {
  createEmptyMoodboard,
  moodboardCoverImageUrl,
  serializeMoodboardItems,
  isRoomSetGenerating,
  resolveStageAspect,
  roomSetGenerateCopy,
} from './types';
import { HavenAdminSkeleton } from './HavenSkeleton';
import './haven-admin.css';

const POLL_MS = 2000;

function hasProductImage(p: HavenProduct): boolean {
  return Boolean(p.imageUrl?.trim());
}

/** Derive a moodboard title from the room-set label. */
function defaultMoodboardName(roomLabel: string, styleLabel?: string | null): string {
  const label = roomLabel.trim();
  if (!label) {
    return styleLabel?.trim() ? `${styleLabel.trim()} Mood Board` : 'Untitled Mood Board';
  }
  if (/ mood board$/i.test(label)) return label;
  if (/\s+set$/i.test(label)) {
    return label.replace(/\s+set$/i, ' Mood Board');
  }
  return `${label} Mood Board`;
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

function MoodboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="2.5" width="6" height="7" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.75" y="2.5" width="5.5" height="4" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.75" y="7.75" width="5.5" height="5.75" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.75" y="10.75" width="6" height="2.75" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.75 3.5L5.25 8L9.75 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 8H13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
      data-product-id={product.id}
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
          className={[
            'hv-admin__tile-face',
            busyLabel ? 'is-busy' : '',
            !selected && !hoverLabel && !busyLabel ? 'is-static' : '',
          ]
            .filter(Boolean)
            .join(' ')}
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
          ) : hoverLabel || busyLabel ? (
            <span className="hv-admin__tile-hover">{busyLabel || hoverLabel}</span>
          ) : null}
          <span className="hv-admin__tile-copy">
            <span className="hv-admin__tile-name">{product.name}</span>
            <span className="hv-admin__tile-meta">
              <strong>{formatPrice(product.price)}</strong>
              {product.externalSku ? ` · ${product.externalSku}` : ''}
              {product.category ? ` · ${categoryLabel(product.category)}` : ''}
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
  const [movedProductIds, setMovedProductIds] = useState<string[]>([]);
  const [draggingHotspotId, setDraggingHotspotId] = useState<string | null>(null);
  /** Keep current room image on screen during rearrange/regen (avoid jumping to list gen card). */
  const [stageLockSrc, setStageLockSrc] = useState<string | null>(null);
  const [stageRevealSrc, setStageRevealSrc] = useState<string | null>(null);
  const [stageRevealing, setStageRevealing] = useState(false);
  const pinBaselineRef = useRef<HavenHotspot[]>([]);
  const [reusedBaseRoom, setReusedBaseRoom] = useState(false);
  const draggingPinId = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [queriesText, setQueriesText] = useState(DEFAULT_QUERIES);
  const [maxPerQuery, setMaxPerQuery] = useState(5);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);

  const [roomStyleId, setRoomStyleId] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [roomBlurb, setRoomBlurb] = useState('');
  const [roomTags, setRoomTags] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [studioOpen, setStudioOpen] = useState(false);
  /** 0 = landing, 1 = style, 2 = name look, 3 = pick products */
  const [createStep, setCreateStep] = useState<0 | 1 | 2 | 3>(0);
  /** While set, Design Myself owns generate UX (in-studio blur loader). */
  const [studioJobId, setStudioJobId] = useState<string | null>(null);
  const [studioPins, setStudioPins] = useState<PlacementPin[]>([]);
  const [readyBannerId, setReadyBannerId] = useState<string | null>(null);
  const wasGeneratingRef = useRef(false);
  const editorAnchorRef = useRef<HTMLDivElement>(null);
  const [studioBaseUrl, setStudioBaseUrl] = useState<string | null>(null);
  const [studioUploadId, setStudioUploadId] = useState<string | null>(null);
  const [studioComposeMode, setStudioComposeMode] = useState<'base' | 'furnish'>('furnish');
  const [studioView, setStudioView] = useState<StudioView>('compose');
  const [studioDraftId, setStudioDraftId] = useState<string>(() => crypto.randomUUID());
  const [moodboard, setMoodboard] = useState<HavenMoodboard | null>(null);
  const [moodboardLibrary, setMoodboardLibrary] = useState<MoodboardCard[]>([]);
  const [productsModal, setProductsModal] = useState<null | 'scrape' | 'add'>(null);
  const [addProductInitialUrl, setAddProductInitialUrl] = useState('');
  const [highlightProductId, setHighlightProductId] = useState<string | null>(null);
  const [catalogFilters, setCatalogFilters] =
    useState<ProductCatalogFilters>(DEFAULT_PRODUCT_FILTERS);
  const [createProductFilters, setCreateProductFilters] =
    useState<ProductCatalogFilters>(DEFAULT_PRODUCT_FILTERS);
  const [imageTargetId, setImageTargetId] = useState<string | null>(null);
  const [createStyleOpen, setCreateStyleOpen] = useState(false);
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

  const productStoreOptions = useMemo(() => collectStoreOptions(products), [products]);

  const filteredCatalogProducts = useMemo(
    () => applyProductFilters(products, catalogFilters),
    [products, catalogFilters],
  );

  const filteredCreateProducts = useMemo(
    () => applyProductFilters(products, createProductFilters),
    [products, createProductFilters],
  );

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
    setRoomStyleId((prev) => {
      const next = prev || styleList[0]?.id || '';
      if (!prev) {
        const style = styleList.find((s) => s.id === next);
        if (style?.baseRoomImageUrl) setStudioBaseUrl(style.baseRoomImageUrl);
        if (style?.label) setRoomLabel(`${style.label} Set`);
      }
      return next;
    });
  }, []);

  const selectStyle = (id: string, list: StylePersonality[] = styles) => {
    setRoomStyleId(id);
    setSelectedProductIds([]);
    setStudioUploadId(null);
    const style = list.find((s) => s.id === id);
    setStudioBaseUrl(style?.baseRoomImageUrl || null);
    setRoomLabel(style?.label ? `${style.label} Set` : '');
    setError(null);
  };

  const onStyleCreated = (style: StylePersonality) => {
    setStyles((prev) => {
      const without = prev.filter((s) => s.id !== style.id);
      return [style, ...without];
    });
    selectStyle(style.id, [style, ...styles.filter((s) => s.id !== style.id)]);
  };

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
      setMovedProductIds([]);
      setDraggingHotspotId(null);
      setStageLockSrc(null);
      setStageRevealSrc(null);
      setStageRevealing(false);
      pinBaselineRef.current = [];
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
        if (!cancelled) {
          try {
            const page = await havenAdminClient.listMoodboards({ limit: 48 });
            if (!cancelled) setMoodboardLibrary(page.items);
          } catch {
            /* moodboard API may not exist yet */
          }
        }
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
      if (prev.length >= 18) return prev;
      return [...prev, id];
    });
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(null);
    }
  };

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

  const onCreateRoomSet = () =>
    void run('room', async () => {
      if (!roomStyleId) throw new Error('Pick a style.');
      if (!selectedProductIds.length) throw new Error('Select 1–6 products with images.');
      if (selectedProductIds.length > 6) {
        throw new Error('Automatic generate supports up to 6 products. Use Design Myself for more.');
      }
      if (selectedMissingImages.length) {
        throw new Error(
          `Add images for: ${selectedMissingImages.map((p) => p.name).join(', ')}`,
        );
      }
      const label =
        roomLabel.trim() ||
        `${selectedStyle?.label ?? roomStyleId} Set`;
      const tags = roomTags
        .split(/,|\n/)
        .map((t) => t.trim())
        .filter(Boolean);
      const basePreview =
        selectedStyle?.baseRoomImageUrl || studioBaseUrl || null;
      if (basePreview) {
        setStageLockSrc(basePreview);
        setStageRevealSrc(null);
        setStageRevealing(false);
      }
      const { roomSet, generateJob } = await havenAdminClient.createRoomSet({
        styleId: roomStyleId,
        label,
        blurb: roomBlurb.trim(),
        productIds: selectedProductIds,
        tags,
        aspectRatio: '16:9',
        autoGenerate: true,
        enabled: true,
        featured: false,
        sortOrder: 0,
      });
      setRoomLabel(selectedStyle?.label ? `${selectedStyle.label} Set` : '');
      setRoomBlurb('');
      setRoomTags('');
      setSelectedProductIds([]);
      setCreateStep(0);
      await openCreatedSet(roomSet, generateJob);
      window.requestAnimationFrame(() => {
        editorAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

  const openStudio = () => {
    if (!roomStyleId) {
      setError('Pick a style first.');
      return;
    }
    if (!selectedProductIds.length) {
      setError('Select at least one product with an image.');
      return;
    }
    if (selectedMissingImages.length) {
      setError(`Add images for: ${selectedMissingImages.map((p) => p.name).join(', ')}`);
      return;
    }
    if (selectedProductIds.length > 18) {
      setError('Studio supports up to 18 products.');
      return;
    }
    setError(null);
    // Prefer an already-chosen custom upload; otherwise the style’s cached empty room.
    if (!studioUploadId) {
      setStudioBaseUrl(selectedStyle?.baseRoomImageUrl || null);
    }
    setStudioPins(
      selectedProductIds.map((id, i) => ({
        productId: id,
        x: 28 + (i % 5) * 12,
        y: 55 + Math.floor(i / 5) * 10,
      })),
    );
    const draftId = crypto.randomUUID();
    setStudioDraftId(draftId);
    setStudioView('compose');
    setMoodboard(null);
    // Drop empty drafts from prior sessions so the library stays clean.
    setMoodboardLibrary((prev) => prev.filter((c) => c.itemCount > 0));
    void refreshMoodboardLibrary(draftId);
    setStudioOpen(true);
  };

  const cardFromBoard = (board: HavenMoodboard): MoodboardCard => ({
    id: board.id,
    name: board.name,
    styleId: board.styleId ?? null,
    roomSetId: board.roomSetId ?? null,
    pendingStudioDraftId: board.pendingStudioDraftId ?? null,
    coverImageUrl: moodboardCoverImageUrl(board.items),
    palettePreview: board.palette.map((s) => s.hex).filter((h): h is string => Boolean(h)),
    itemCount: board.items.length,
    updatedAt: board.updatedAt,
  });

  const refreshMoodboardLibrary = async (draftId?: string) => {
    const pending = draftId ?? studioDraftId;
    try {
      const page = await havenAdminClient.listMoodboards({ limit: 48 });
      // Ignore empty remote boards — those were often accidental auto-creates.
      setMoodboardLibrary((prev) => {
        const locals = prev.filter((c) => c.id.startsWith('local_'));
        const fromApi = page.items.filter((c) => c.itemCount > 0);
        const byId = new Map<string, MoodboardCard>();
        for (const c of fromApi) byId.set(c.id, c);
        for (const c of locals) byId.set(c.id, c);
        return [...byId.values()];
      });
    } catch {
      // Backend may not be ready — keep local library entries.
      setMoodboardLibrary((prev) => {
        if (!moodboard) return prev;
        if (prev.some((c) => c.id === moodboard.id)) {
          return prev.map((c) => (c.id === moodboard.id ? cardFromBoard(moodboard) : c));
        }
        return [cardFromBoard(moodboard), ...prev];
      });
    }
    void pending;
  };

  const onMoodboardCreate = () => {
    // Drafts stay local until Save — do not POST empty boards.
    const name = defaultMoodboardName(roomLabel, selectedStyle?.label);
    const local = createEmptyMoodboard({
      id: `local_${crypto.randomUUID()}`,
      name,
      styleId: roomStyleId || null,
      pendingStudioDraftId: studioOpen ? studioDraftId : null,
    });
    setMoodboard(local);
    setMoodboardLibrary((prev) => [
      cardFromBoard(local),
      ...prev.filter((c) => c.id !== local.id),
    ]);
    if (studioOpen) setStudioView('moodboard');
  };

  /** Open moodboard view; reuse current draft or make one local board (no API). */
  const ensureStudioMoodboard = () => {
    setStudioView('moodboard');
    if (moodboard) return;
    const reusable = moodboardLibrary.find(
      (c) =>
        (c.pendingStudioDraftId && c.pendingStudioDraftId === studioDraftId) ||
        (studioJobId && c.roomSetId === studioJobId),
    );
    if (reusable) {
      void onMoodboardSelect(reusable.id);
      return;
    }
    onMoodboardCreate();
  };

  const onMoodboardSelect = (id: string) =>
    void run('moodboard', async () => {
      if (moodboard?.id === id) return;
      if (id.startsWith('local_')) {
        const local = moodboardLibrary.find((c) => c.id === id);
        if (!local) return;
        // Prefer keeping the live board if it matches; otherwise open a draft shell.
        setMoodboard(
          createEmptyMoodboard({
            id: local.id,
            name: local.name,
            styleId: local.styleId,
            roomSetId: local.roomSetId,
            pendingStudioDraftId: local.pendingStudioDraftId,
          }),
        );
        return;
      }
      try {
        const detail = await havenAdminClient.getMoodboard(id);
        setMoodboard(detail);
      } catch {
        const local = moodboardLibrary.find((c) => c.id === id);
        if (local) {
          setMoodboard(
            createEmptyMoodboard({
              id: local.id,
              name: local.name,
              styleId: local.styleId,
              roomSetId: local.roomSetId,
              pendingStudioDraftId: local.pendingStudioDraftId,
            }),
          );
        }
      }
    });

  const onMoodboardSave = () =>
    void run('moodboard', async () => {
      if (!moodboard) return;
      if (moodboard.id.startsWith('local_')) {
        try {
          const created = await havenAdminClient.createMoodboard({
            name: moodboard.name,
            styleId: moodboard.styleId,
            roomSetId: moodboard.roomSetId,
            pendingStudioDraftId: moodboard.pendingStudioDraftId ?? (studioOpen ? studioDraftId : null),
            boardAspectRatio: moodboard.boardAspectRatio,
            palette: moodboard.palette,
            palettePosition: moodboard.palettePosition,
            items: serializeMoodboardItems(moodboard.items),
          });
          setMoodboard(created);
          setMoodboardLibrary((prev) => [
            cardFromBoard(created),
            ...prev.filter((c) => c.id !== moodboard.id && c.id !== created.id),
          ]);
        } catch {
          setMoodboardLibrary((prev) => {
            const card = cardFromBoard(moodboard);
            if (prev.some((c) => c.id === moodboard.id)) {
              return prev.map((c) => (c.id === moodboard.id ? card : c));
            }
            return [card, ...prev];
          });
        }
        return;
      }
      try {
        const saved = await havenAdminClient.patchMoodboard(moodboard.id, {
          name: moodboard.name,
          styleId: moodboard.styleId,
          boardAspectRatio: moodboard.boardAspectRatio,
          palette: moodboard.palette,
          palettePosition: moodboard.palettePosition,
          items: serializeMoodboardItems(moodboard.items),
        });
        setMoodboard(saved);
        setMoodboardLibrary((prev) =>
          prev.map((c) => (c.id === saved.id ? cardFromBoard(saved) : c)),
        );
      } catch {
        setMoodboardLibrary((prev) =>
          prev.map((c) => (c.id === moodboard.id ? cardFromBoard(moodboard) : c)),
        );
      }
    });

  const onMoodboardDelete = (id: string) =>
    void run('moodboard', async () => {
      try {
        if (!id.startsWith('local_')) await havenAdminClient.deleteMoodboard(id);
      } catch {
        /* allow local delete */
      }
      setMoodboardLibrary((prev) => prev.filter((c) => c.id !== id));
      if (moodboard?.id === id) setMoodboard(null);
    });

  const onMoodboardLink = () =>
    void run('moodboard', async () => {
      if (!moodboard) return;
      const linkPayload = studioJobId
        ? ({ roomSetId: studioJobId } as const)
        : ({ pendingStudioDraftId: studioDraftId } as const);
      if (moodboard.id.startsWith('local_')) {
        const next = {
          ...moodboard,
          roomSetId: studioJobId,
          pendingStudioDraftId: studioJobId ? null : studioDraftId,
          updatedAt: new Date().toISOString(),
        };
        setMoodboard(next);
        setMoodboardLibrary((prev) =>
          prev.map((c) => (c.id === next.id ? cardFromBoard(next) : c)),
        );
        return;
      }
      try {
        const linked = await havenAdminClient.linkMoodboard(moodboard.id, linkPayload);
        setMoodboard(linked);
        setMoodboardLibrary((prev) =>
          prev.map((c) => (c.id === linked.id ? cardFromBoard(linked) : c)),
        );
      } catch {
        const next = {
          ...moodboard,
          roomSetId: studioJobId,
          pendingStudioDraftId: studioJobId ? null : studioDraftId,
          updatedAt: new Date().toISOString(),
        };
        setMoodboard(next);
      }
    });

  const onMoodboardUnlink = () =>
    void run('moodboard', async () => {
      if (!moodboard) return;
      if (moodboard.id.startsWith('local_')) {
        const next = {
          ...moodboard,
          pendingStudioDraftId: null,
          roomSetId: null,
          updatedAt: new Date().toISOString(),
        };
        setMoodboard(next);
        setMoodboardLibrary((prev) =>
          prev.map((c) => (c.id === next.id ? cardFromBoard(next) : c)),
        );
        return;
      }
      try {
        const unlinked = await havenAdminClient.unlinkMoodboard(moodboard.id);
        setMoodboard(unlinked);
        setMoodboardLibrary((prev) =>
          prev.map((c) => (c.id === unlinked.id ? cardFromBoard(unlinked) : c)),
        );
      } catch {
        const next = {
          ...moodboard,
          pendingStudioDraftId: null,
          roomSetId: null,
          updatedAt: new Date().toISOString(),
        };
        setMoodboard(next);
      }
    });

  const onMoodboardUpload = (files: FileList) => {
    if (!moodboard) return;
    const list = Array.from(files).slice(0, Math.max(0, 24 - moodboard.items.length));
    if (!list.length) return;

    const pending = list.map((file, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        file,
        blobUrl: URL.createObjectURL(file),
        id: `item_${crypto.randomUUID()}`,
        x: 8 + col * 30,
        y: 18 + row * 28,
        w: 26,
        h: 26,
        zIndex: moodboard.items.length + i,
      };
    });

    // Show items immediately with local preview + loading state.
    const placeholders = pending.map(({ blobUrl, id, x, y, w, h, zIndex }) => ({
      id,
      kind: 'image' as const,
      imageUrl: blobUrl,
      uploadId: null as string | null,
      uploading: true,
      x,
      y,
      w,
      h,
      zIndex,
      link: null,
    }));

    const withPlaceholders = {
      ...moodboard,
      items: [...moodboard.items, ...placeholders],
      updatedAt: new Date().toISOString(),
    };
    setMoodboard(withPlaceholders);
    setMoodboardLibrary((prev) =>
      prev.map((c) => (c.id === withPlaceholders.id ? cardFromBoard(withPlaceholders) : c)),
    );

    void (async () => {
      setError(null);
      await Promise.all(
        pending.map(async ({ file, blobUrl, id }) => {
          let imageUrl = blobUrl;
          let uploadId: string | null = null;
          let ok = false;
          try {
            const uploaded = await havenAdminClient.uploadBaseImage(file);
            if (uploaded.originalImageUrl) {
              imageUrl = uploaded.originalImageUrl;
              uploadId = uploaded.uploadId;
              ok = true;
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Image upload failed.');
          }

          setMoodboard((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: prev.items.map((it) =>
                it.id === id && it.kind === 'image'
                  ? {
                      ...it,
                      imageUrl,
                      uploadId,
                      uploading: false,
                    }
                  : it,
              ),
              updatedAt: new Date().toISOString(),
            };
          });

          if (ok && blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrl);
          }
        }),
      );
    })();
  };

  const onStudioUploadBase = (file: File) => {
    void run('studio-base', async () => {
      const uploaded = await havenAdminClient.uploadBaseImage(file);
      if (!uploaded.uploadId || !uploaded.originalImageUrl) {
        throw new Error('Base upload failed.');
      }
      setStudioUploadId(uploaded.uploadId);
      setStudioBaseUrl(uploaded.originalImageUrl);
    });
  };

  const onStudioGenerate = () =>
    void run('studio', async () => {
      if (!roomStyleId) throw new Error('Pick a style.');
      if (!selectedProductIds.length) throw new Error('Select products to place.');
      if (!studioPins.length) throw new Error('Place at least one product on the room.');
      const label =
        roomLabel.trim() ||
        `${selectedStyle?.label ?? roomStyleId} Set`;
      const tags = roomTags
        .split(/,|\n/)
        .map((t) => t.trim())
        .filter(Boolean);
      const usingUpload = Boolean(studioUploadId);
      const { roomSet, generateJob } = await havenAdminClient.createStudioRoomSet({
        styleId: roomStyleId,
        label,
        blurb: roomBlurb.trim(),
        tags,
        productIds: selectedProductIds,
        baseSource: usingUpload ? 'upload_id' : 'style_cache',
        uploadId: usingUpload ? studioUploadId : null,
        baseImageUrl: null,
        composeMode: studioComposeMode,
        placementPins: studioPins,
        enabled: true,
        featured: false,
        studioDraftId,
      });
      // Stay in studio with blur loader while the job runs (list card is for auto only).
      setStudioJobId(roomSet.id);
      await openCreatedSet(roomSet, generateJob);
    });

  const finishStudioJob = useCallback(() => {
    setStudioOpen(false);
    setStudioJobId(null);
    setStudioPins([]);
    setStudioUploadId(null);
    setStudioBaseUrl(null);
    setStudioComposeMode('furnish');
    setStudioView('compose');
    setStudioDraftId(crypto.randomUUID());
    setMoodboard(null);
    setRoomLabel(selectedStyle?.label ? `${selectedStyle.label} Set` : '');
    setRoomBlurb('');
    setRoomTags('');
    setSelectedProductIds([]);
    setCreateStep(0);
    window.requestAnimationFrame(() => {
      editorAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedStyle?.label]);

  useEffect(() => {
    if (!editing) {
      wasGeneratingRef.current = false;
      return;
    }
    const generating = isRoomSetGenerating(editing.generateStatus);
    if (generating) {
      wasGeneratingRef.current = true;
      return;
    }
    if (
      wasGeneratingRef.current &&
      editing.generateStatus === 'ready' &&
      editing.imageUrl
    ) {
      wasGeneratingRef.current = false;
      setReadyBannerId(editing.id);
    }
  }, [editing?.id, editing?.generateStatus, editing?.imageUrl]);

  const closeEditor = () => {
    setEditing(null);
    setDraftHotspots([]);
    setPinEditMode(false);
    setMovedProductIds([]);
    setDraggingHotspotId(null);
    setStageLockSrc(null);
    setStageRevealSrc(null);
    setStageRevealing(false);
    setReadyBannerId(null);
    setReusedBaseRoom(false);
  };

  useEffect(() => {
    if (!studioJobId || !editing || editing.id !== studioJobId) return;
    if (isRoomSetGenerating(editing.generateStatus)) return;
    finishStudioJob();
  }, [studioJobId, editing?.id, editing?.generateStatus, finishStudioJob]);

  const onRegenerate = (id: string) =>
    void run(`regen-${id}`, async () => {
      setReadyBannerId(null);
      if (editing?.id === id && editing.imageUrl) {
        setStageLockSrc(editing.imageUrl);
        setStageRevealSrc(null);
        setStageRevealing(false);
        setPinEditMode(false);
      }
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
    });

  const onDeleteRoomSet = (id: string) =>
    void run(`del-${id}`, async () => {
      await havenAdminClient.deleteRoomSet(id);
      if (editing?.id === id) {
        setEditing(null);
        setDraftHotspots([]);
      }
      await refreshRoomSets();
    });

  const onToggleFlag = (id: string, patch: { featured?: boolean; enabled?: boolean }) =>
    void run(`flag-${id}`, async () => {
      const updated = await havenAdminClient.patchRoomSet(id, patch);
      setRoomSets((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      if (editing?.id === id) setEditing((prev) => (prev ? { ...prev, ...updated } : prev));
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

  const onPinPointerDown = (e: React.PointerEvent, hotspot: HavenHotspot) => {
    if (!pinEditMode) return;
    const alreadyMoved = movedProductIds.includes(hotspot.productId);
    if (!alreadyMoved && movedProductIds.length >= 3) {
      setError('Move furniture allows up to 3 items per request. Cancel or submit these first.');
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    draggingPinId.current = hotspot.id;
    setDraggingHotspotId(hotspot.id);
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
    const id = draggingPinId.current;
    if (id == null) return;
    draggingPinId.current = null;
    setDraggingHotspotId(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const next = percentFromPointer(e.clientX, e.clientY);
    if (!next) return;
    const baseline = pinBaselineRef.current.find((h) => h.id === id);
    setDraftHotspots((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, x: next.x, y: next.y } : h));
      const draft = updated.find((h) => h.id === id);
      if (draft && baseline) {
        const moved =
          Math.abs(draft.x - baseline.x) > 0.15 || Math.abs(draft.y - baseline.y) > 0.15;
        if (moved) {
          setMovedProductIds((ids) =>
            ids.includes(draft.productId) ? ids : [...ids, draft.productId].slice(0, 3),
          );
        }
      }
      return updated;
    });
  };

  const startPinEdit = () => {
    if (!editing) return;
    const hotspots = editing.hotspots ?? [];
    setDraftHotspots(hotspots);
    pinBaselineRef.current = hotspots.map((h) => ({ ...h }));
    setMovedProductIds([]);
    setPinEditMode(true);
    setReadyBannerId(null);
    setError(null);
  };

  const cancelPinEdit = () => {
    setDraftHotspots(editing?.hotspots ?? []);
    pinBaselineRef.current = [];
    setMovedProductIds([]);
    setDraggingHotspotId(null);
    setPinEditMode(false);
    draggingPinId.current = null;
    setError(null);
  };

  /** Recompose furniture via rearrange API (1–3 moved pins). */
  const onMoveFurniture = () =>
    void run('rearrange', async () => {
      if (!editing) return;
      const pins = draftHotspots
        .filter((h) => movedProductIds.includes(h.productId))
        .map((h) => ({ productId: h.productId, x: h.x, y: h.y }));
      if (!pins.length) throw new Error('Drag at least one item to a new spot first.');
      if (pins.length > 3) throw new Error('Move furniture allows at most 3 items per request.');

      const generateJob = await havenAdminClient.rearrangeRoomSet(editing.id, pins);
      setStageLockSrc(editing.imageUrl);
      setStageRevealSrc(null);
      setStageRevealing(false);
      setPinEditMode(false);
      setMovedProductIds([]);
      setDraggingHotspotId(null);
      pinBaselineRef.current = [];
      draggingPinId.current = null;

      const detail = await havenAdminClient.getRoomSet(editing.id);
      applyDetail({
        ...detail,
        generateJobId: generateJob.jobId ?? detail.generateJobId,
        generateStatus: generateJob.status ?? detail.generateStatus ?? 'rearranging',
        generateProgress: generateJob.progress ?? detail.generateProgress,
        generateMessage: generateJob.message ?? detail.generateMessage,
        generateError: generateJob.error ?? null,
      });
    });

  /** Optional: only update hotspot markers on the current image (no AI recompose). */
  const onSaveHotspots = () =>
    void run('hotspots', async () => {
      if (!editing) return;
      const saved = await havenAdminClient.saveHotspots(editing.id, draftHotspots);
      setDraftHotspots(saved);
      pinBaselineRef.current = saved.map((h) => ({ ...h }));
      setMovedProductIds([]);
      setEditing((prev) => (prev ? { ...prev, hotspots: saved } : prev));
      setPinEditMode(false);
    });

  const editingGenerating = isRoomSetGenerating(editing?.generateStatus);
  const studioWorking = Boolean(
    studioOpen &&
      (busy === 'studio' ||
        (studioJobId != null &&
          editing?.id === studioJobId &&
          isRoomSetGenerating(editing.generateStatus))),
  );
  /** Follow-up gen (rearrange/regen) or manual create — keep detail view with locked image. */
  const editorInPlaceWorking = Boolean(
    editing &&
      editingGenerating &&
      !studioOpen &&
      (stageLockSrc || editing.imageUrl),
  );
  const showEditor =
    Boolean(editing) &&
    !studioOpen &&
    (Boolean(editing?.imageUrl) || Boolean(stageLockSrc) || !editingGenerating);
  const editorStageSrc = stageLockSrc || editing?.imageUrl || '';
  const editorHotspots =
    editorInPlaceWorking || stageRevealing
      ? []
      : pinEditMode
        ? draftHotspots
        : (editing?.hotspots ?? []);
  const editorStageAspect =
    editing &&
    (resolveStageAspect({
      width: editing.imageWidth,
      height: editing.imageHeight,
      aspectRatio: editing.aspectRatio,
    }) ||
      '16 / 9');
  const editorGenPct = Math.min(
    100,
    Math.max(0, Math.round(Number(editing?.generateProgress ?? 0))),
  );
  const editorGenCopy = roomSetGenerateCopy(
    editing?.generateStatus,
    editing?.generateMessage,
  );

  useEffect(() => {
    if (!editing || !stageLockSrc) return;
    if (isRoomSetGenerating(editing.generateStatus)) return;

    if (editing.generateStatus === 'failed') {
      setStageLockSrc(null);
      setStageRevealSrc(null);
      setStageRevealing(false);
      return;
    }

    if (editing.imageUrl && editing.imageUrl !== stageLockSrc) {
      setStageRevealSrc(editing.imageUrl);
      setStageRevealing(true);
      const t = window.setTimeout(() => {
        setStageLockSrc(null);
        setStageRevealSrc(null);
        setStageRevealing(false);
      }, 1150);
      return () => window.clearTimeout(t);
    }

    setStageLockSrc(null);
    setStageRevealSrc(null);
    setStageRevealing(false);
  }, [editing?.generateStatus, editing?.imageUrl, editing?.generateError, stageLockSrc]);

  const closeScrapeModal = useCallback(() => {
    if (busy !== 'import') setProductsModal(null);
  }, [busy]);
  const closeAddProductModal = useCallback(() => {
    if (busy == null) {
      setProductsModal(null);
      setAddProductInitialUrl('');
    }
  }, [busy]);
  const scrapeBackdrop = useBackdropDismiss(
    closeScrapeModal,
    productsModal === 'scrape',
  );
  const addProductBackdrop = useBackdropDismiss(
    closeAddProductModal,
    productsModal === 'add',
  );

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
            <Link to="/haven/store" className="hv-admin__btn hv-admin__btn--ghost">
              Store
            </Link>
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

        {loading ? (
          <HavenAdminSkeleton />
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
                <h2 className="hv-admin__panel-title">
                  {studioOpen ? 'Room Set Designer' : 'Curated room sets'}
                </h2>
                {studioOpen ? (
                  <div className="hv-admin__row">
                    <button
                      type="button"
                      className={`hv-admin__btn hv-admin__btn--moodboard${studioView === 'moodboard' ? ' is-active' : ''}`}
                      aria-pressed={studioView === 'moodboard'}
                      disabled={busy === 'studio' || studioWorking}
                      onClick={() => {
                        if (studioView === 'moodboard') {
                          setStudioView('compose');
                          return;
                        }
                        ensureStudioMoodboard();
                      }}
                      title={
                        studioView === 'moodboard'
                          ? 'Back to product placement on the room'
                          : 'Brainstorm a moodboard for this look'
                      }
                    >
                      <span className="hv-admin__btn-icon" aria-hidden="true">
                        {studioView === 'moodboard' ? <BackArrowIcon /> : <MoodboardIcon />}
                      </span>
                      <span>
                        {studioView === 'moodboard' ? 'Back to room designer' : 'Moodboard'}
                      </span>
                    </button>
                    {studioView !== 'moodboard' ? (
                      <button
                        type="button"
                        className="hv-admin__btn hv-admin__btn--ghost"
                        disabled={busy === 'studio' || studioWorking}
                        onClick={() => {
                          if (studioJobId) return;
                          setStudioOpen(false);
                        }}
                      >
                        Back
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {studioOpen ? (
                <HavenAdminStudio
                  style={selectedStyle}
                  label={
                    roomLabel.trim() ||
                    `${selectedStyle?.label ?? roomStyleId} Set`
                  }
                  products={selectedProductIds
                    .map((id) => productsById.get(id))
                    .filter((p): p is HavenProduct => Boolean(p))}
                  allProducts={products}
                  pins={studioPins}
                  busy={busy === 'studio'}
                  baseBusy={busy === 'studio-base'}
                  baseImageUrl={studioBaseUrl}
                  onPinsChange={setStudioPins}
                  onProductsChange={setSelectedProductIds}
                  composeMode={studioComposeMode}
                  onComposeModeChange={setStudioComposeMode}
                  studioView={studioView}
                  onStudioViewChange={(view) => {
                    if (view === 'moodboard') {
                      ensureStudioMoodboard();
                      return;
                    }
                    setStudioView(view);
                  }}
                  onGenerate={onStudioGenerate}
                  onUploadBase={onStudioUploadBase}
                  working={studioWorking}
                  genStatus={
                    editing?.id === studioJobId ? editing.generateStatus : null
                  }
                  genProgress={
                    editing?.id === studioJobId ? editing.generateProgress : null
                  }
                  genMessage={
                    editing?.id === studioJobId ? editing.generateMessage : null
                  }
                  moodboard={moodboard}
                  moodboardLibrary={moodboardLibrary.filter(
                    (c) => c.id === moodboard?.id || c.itemCount > 0,
                  )}
                  moodboardBusy={busy === 'moodboard'}
                  studioDraftId={studioDraftId}
                  linkedRoomSetId={studioJobId}
                  onMoodboardChange={setMoodboard}
                  onMoodboardSave={onMoodboardSave}
                  onMoodboardSelect={onMoodboardSelect}
                  onMoodboardCreate={onMoodboardCreate}
                  onMoodboardDelete={onMoodboardDelete}
                  onMoodboardLink={onMoodboardLink}
                  onMoodboardUnlink={onMoodboardUnlink}
                  onMoodboardUpload={onMoodboardUpload}
                />
              ) : (
                <>
              <div className="hv-admin__auto-create hv-admin__auto-create--visual">
                <div className="hv-admin__create-section-head">
                  <p className="hv-admin__create-section-title">Room Set Designer</p>
                </div>
                {createStep === 0 ? (
                  <div
                    key="create-step-0"
                    className="hv-admin__create-landing hv-enter-cascade"
                  >
                    <div className="hv-admin__create-landing-copy">
                      <h3 className="hv-admin__create-landing-title">Design a Room Set</h3>
                      <p className="hv-admin__create-landing-sub">
                        Choose a style, name the look, then pick products.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="hv-admin__btn hv-admin__btn--primary"
                      disabled={busy != null}
                      onClick={() => setCreateStep(1)}
                    >
                      Create
                    </button>
                  </div>
                ) : createStep === 1 ? (
                  <div key="create-step-1" className="hv-admin__create-step-pane hv-enter-cascade">
                    <div className="hv-admin__create-manual-bar">
                      <button
                        type="button"
                        className="hv-admin__back"
                        disabled={busy != null}
                        onClick={() => setCreateStep(0)}
                      >
                        ← Back
                      </button>
                    </div>
                    <section
                      className="hv-admin__create-step"
                      aria-labelledby="create-step-style"
                    >
                      <header className="hv-admin__create-step-head">
                        <span className="hv-admin__create-step-num" aria-hidden="true">
                          1
                        </span>
                        <h3 id="create-step-style" className="hv-admin__create-step-title">
                          Choose a style
                        </h3>
                        <p className="hv-admin__panel-meta hv-admin__create-step-meta">
                          {selectedStyle
                            ? `${selectedStyle.label}${selectedStyle.baseRoomImageUrl ? '' : ' · no cached base yet'}`
                            : 'Pick a style'}
                        </p>
                      </header>
                      <div className="hv-admin__style-picker" role="listbox" aria-label="Styles">
                        <button
                          type="button"
                          className="hv-admin__style-card hv-admin__style-card--create"
                          disabled={busy != null}
                          title="Create a new style from a room photo"
                          onClick={() => setCreateStyleOpen(true)}
                        >
                          <span className="hv-admin__style-card-media">
                            <span className="hv-admin__style-card-empty">+</span>
                          </span>
                          <span className="hv-admin__style-card-label">Create Room</span>
                        </button>
                        {styles.map((s) => {
                          const active = roomStyleId === s.id;
                          const thumb = stylePickerThumb(s);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              role="option"
                              aria-selected={active}
                              className={`hv-admin__style-card${active ? ' is-active' : ''}`}
                              disabled={busy != null}
                              onClick={() => selectStyle(s.id)}
                            >
                              <span className="hv-admin__style-card-media">
                                {thumb ? (
                                  <img src={thumb} alt="" />
                                ) : (
                                  <span className="hv-admin__style-card-empty">No base</span>
                                )}
                              </span>
                              <span className="hv-admin__style-card-label">{s.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                    <div className="hv-admin__create-actions">
                      <button
                        type="button"
                        className="hv-admin__btn hv-admin__btn--primary"
                        disabled={busy != null || !roomStyleId}
                        onClick={() => {
                          if (selectedStyle?.label && !roomLabel.trim()) {
                            setRoomLabel(`${selectedStyle.label} Set`);
                          }
                          setCreateStep(2);
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key="create-manual" className="hv-admin__create-manual hv-enter-cascade">
                    <div className="hv-admin__create-manual-bar">
                      <button
                        type="button"
                        className="hv-admin__back"
                        disabled={busy != null}
                        onClick={() => {
                          if (createStep === 3) {
                            setCreateStep(2);
                            return;
                          }
                          setCreateStep(1);
                        }}
                      >
                        ← Back
                      </button>
                      <p className="hv-admin__create-manual-title">
                        Creating with{' '}
                        <span>{selectedStyle?.label ?? 'this style'}</span>
                      </p>
                    </div>

                    <div
                      key={`create-step-${createStep}`}
                      className="hv-admin__create-step-pane hv-enter-cascade"
                    >
                      <div className="hv-admin__create-steps">
                        {createStep === 2 ? (
                          <section
                            className="hv-admin__create-step"
                            aria-labelledby="create-step-details"
                          >
                            <header className="hv-admin__create-step-head">
                              <span className="hv-admin__create-step-num" aria-hidden="true">
                                2
                              </span>
                              <h3 id="create-step-details" className="hv-admin__create-step-title">
                                Name this look
                              </h3>
                            </header>
                            <div className="hv-admin__form hv-admin__form--create">
                              <label className="hv-admin__field">
                                <span className="hv-admin__label">Label</span>
                                <input
                                  className="hv-admin__input"
                                  value={roomLabel}
                                  onChange={(e) => setRoomLabel(e.target.value)}
                                  placeholder={
                                    selectedStyle ? `${selectedStyle.label} Set` : 'Style Set'
                                  }
                                />
                              </label>
                              <div className="hv-admin__form-row hv-admin__form-row--optional">
                                <label className="hv-admin__field">
                                  <span className="hv-admin__label">
                                    Blurb
                                    <span className="hv-admin__optional">optional</span>
                                  </span>
                                  <input
                                    className="hv-admin__input"
                                    value={roomBlurb}
                                    onChange={(e) => setRoomBlurb(e.target.value)}
                                    placeholder="Short description for shoppers"
                                  />
                                </label>
                                <label className="hv-admin__field">
                                  <span className="hv-admin__label">
                                    Tags
                                    <span className="hv-admin__optional">optional</span>
                                  </span>
                                  <input
                                    className="hv-admin__input"
                                    value={roomTags}
                                    onChange={(e) => setRoomTags(e.target.value)}
                                    placeholder="living, calm"
                                  />
                                </label>
                              </div>
                            </div>
                          </section>
                        ) : (
                          <section
                            className="hv-admin__create-step"
                            aria-labelledby="create-step-products"
                          >
                            <header className="hv-admin__create-step-head">
                              <span className="hv-admin__create-step-num" aria-hidden="true">
                                3
                              </span>
                              <h3 id="create-step-products" className="hv-admin__create-step-title">
                                Pick products
                              </h3>
                              <HavenProductFilterMenu
                                value={createProductFilters}
                                onChange={setCreateProductFilters}
                                storeOptions={productStoreOptions}
                                disabled={busy != null}
                                align="end"
                              />
                            </header>
                            {products.length === 0 ? (
                              <p className="hv-admin__empty">No products yet. Import a few below.</p>
                            ) : filteredCreateProducts.length === 0 ? (
                              <p className="hv-admin__empty">No products match these filters.</p>
                            ) : (
                              <div className="hv-admin__tiles hv-admin__tiles--picker">
                                {filteredCreateProducts.map((p) => {
                                  const selected = selectedProductIds.includes(p.id);
                                  const noImg = !hasProductImage(p);
                                  return (
                                    <ProductTile
                                      key={p.id}
                                      product={p}
                                      selected={selected}
                                      disabled={
                                        busy != null ||
                                        (!selected && selectedProductIds.length >= 18) ||
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
                          </section>
                        )}
                      </div>

                      {createStep === 2 ? (
                        <div className="hv-admin__create-manual-actions">
                          <button
                            type="button"
                            className="hv-admin__btn hv-admin__btn--primary"
                            disabled={busy != null || !roomLabel.trim()}
                            onClick={() => setCreateStep(3)}
                          >
                            Next
                          </button>
                        </div>
                      ) : (
                        <div className="hv-admin__create-manual-actions">
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
                            {busy === 'room' ? 'Creating…' : 'Generate Automatically'}
                          </button>
                          <button
                            type="button"
                            className="hv-admin__btn hv-admin__btn--ghost"
                            disabled={
                              busy != null ||
                              !roomStyleId ||
                              selectedProductIds.length < 1 ||
                              selectedProductIds.length > 18 ||
                              selectedMissingImages.length > 0
                            }
                            onClick={openStudio}
                          >
                            Design Myself
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                            studioJobId === set.id ||
                            (editorInPlaceWorking && editing?.id === set.id) ? (
                              <div className="hv-admin__set-gen">
                                <span className="hv-admin__set-label">{set.label}</span>
                                <span className="hv-admin__set-meta">Creating above…</span>
                              </div>
                            ) : (
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
                            )
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

              {showEditor && editing && (
                <div className="hv-admin__editor" ref={editorAnchorRef}>
                  <div className="hv-admin__panel-head">
                    <h3 className="hv-admin__panel-title">{editing.label}</h3>
                  </div>

                  {readyBannerId === editing.id &&
                    !editorInPlaceWorking &&
                    !stageRevealing &&
                    !pinEditMode && (
                      <p className="hv-admin__ready-banner" role="status">
                        Your set is ready
                      </p>
                    )}

                  {editing.generateStatus === 'failed' && !editorInPlaceWorking && (
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

                  {editorStageSrc && (
                    <>
                      <div
                        ref={pinStageRef}
                        className={[
                          'hv-admin__pin-stage',
                          pinEditMode ? 'hv-admin__pin-stage--editing' : '',
                          editorInPlaceWorking ? 'hv-admin__pin-stage--working' : '',
                          stageRevealing ? 'hv-admin__pin-stage--revealing' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={{ aspectRatio: editorStageAspect || '16 / 9' }}
                      >
                        <img
                          src={editorStageSrc}
                          alt=""
                          className="hv-admin__pin-img hv-admin__pin-img--base"
                        />
                        {stageRevealSrc && (
                          <img
                            src={stageRevealSrc}
                            alt=""
                            className="hv-admin__pin-img hv-admin__pin-img--incoming"
                          />
                        )}
                        {editorHotspots.map((h, i) => {
                          const product = productsById.get(h.productId);
                          const placement =
                            h.y > 72 ? 'above' : h.y < 28 ? 'below' : h.x < 55 ? 'right' : 'left';
                          const pinKey = h.id || `${h.productId}-${i}`;
                          const showCard = Boolean(product) && draggingHotspotId !== h.id;
                          return (
                            <div
                              key={pinKey}
                              className={`hv-admin__hotspot${pinEditMode ? ' hv-admin__hotspot--dragging' : ''}${movedProductIds.includes(h.productId) ? ' hv-admin__hotspot--moved' : ''}`}
                              style={{ left: `${h.x}%`, top: `${h.y}%` }}
                              onPointerDown={(e) => onPinPointerDown(e, h)}
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
                              {showCard && product && (
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
                        {(editorInPlaceWorking || stageRevealing) && (
                          <div
                            className={`hv-admin__stage-gen${stageRevealing ? ' hv-admin__stage-gen--leaving' : ''}`}
                            aria-live="polite"
                          >
                            <div className="hv-admin__stage-gen__veil" aria-hidden="true" />
                            <div className="hv-admin__stage-gen__sheen" aria-hidden="true" />
                            {!stageRevealing && (
                              <div className="hv-admin__stage-gen__copy">
                                <p className="hv-admin__stage-gen__eyebrow">
                                  {editing.imageUrl ? 'Updating look' : 'Creating look'}
                                </p>
                                <p className="hv-admin__stage-gen__status">{editorGenCopy}</p>
                                <div className="hv-admin__stage-gen__meter" aria-hidden="true">
                                  <div
                                    className="hv-admin__stage-gen__meter-fill"
                                    style={{
                                      transform: `scaleX(${Math.min(1, Math.max(0.08, editorGenPct / 100))})`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {!editorInPlaceWorking && !stageRevealing && (
                        <div className="hv-admin__row hv-admin__row--editor-actions">
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
                              <p className="hv-admin__panel-meta" style={{ margin: 0, flex: 1 }}>
                                Drag up to 3 items · {movedProductIds.length}/3 moved
                                {' · '}approximate, not pixel-perfect
                              </p>
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
                                className="hv-admin__btn hv-admin__btn--ghost"
                                disabled={busy != null || movedProductIds.length === 0}
                                onClick={onSaveHotspots}
                                title="Only updates shoppable pin markers on the current image"
                              >
                                {busy === 'hotspots' ? 'Saving…' : 'Save markers only'}
                              </button>
                              <button
                                type="button"
                                className="hv-admin__btn hv-admin__btn--primary"
                                disabled={busy != null || movedProductIds.length === 0}
                                onClick={onMoveFurniture}
                              >
                                {busy === 'rearrange' ? 'Moving…' : 'Move furniture'}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="hv-admin__btn hv-admin__btn--ghost"
                              disabled={busy != null || editorHotspots.length === 0}
                              onClick={startPinEdit}
                            >
                              Move furniture
                            </button>
                          )}
                          {!pinEditMode && (
                            <button
                              type="button"
                              className="hv-admin__btn hv-admin__btn--primary hv-admin__btn--finish"
                              disabled={busy != null}
                              onClick={closeEditor}
                            >
                              Finish
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!editingGenerating &&
                    !editing.imageUrl &&
                    !stageLockSrc &&
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
                </>
              )}
            </section>

            <HavenAdminTrends
              busy={busy}
              onBusy={setBusy}
              onError={setError}
              onImportUrl={(url) => {
                setAddProductInitialUrl(url);
                setProductsModal('add');
              }}
              onViewProduct={(productId) => {
                setHighlightProductId(productId);
                window.requestAnimationFrame(() => {
                  const el = document.querySelector(
                    `[data-product-id="${CSS.escape(productId)}"]`,
                  );
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                window.setTimeout(() => setHighlightProductId(null), 2400);
              }}
              onImportQueries={(queries) => {
                void run('import', async () => {
                  if (!queries.length) throw new Error('No import queries on this trend.');
                  setQueriesText(queries.join(', '));
                  const result = await havenAdminClient.importProducts({
                    queries,
                    max_per_query: 10,
                    page: 1,
                    fetch_details_when_no_image: true,
                  });
                  setImportResult(result);
                  await refresh();
                });
              }}
            />

            <section className="hv-admin__panel hv-admin__panel--products">
              <div className="hv-admin__panel-head">
                <div>
                  <h2 className="hv-admin__panel-title">Products</h2>
                  <p className="hv-admin__panel-meta">
                    {filteredCatalogProducts.length}
                    {filteredCatalogProducts.length !== products.length
                      ? ` of ${products.length}`
                      : ''}{' '}
                    in catalog
                    {missingImageCount ? ` · ${missingImageCount} missing image` : ''}
                  </p>
                </div>
                <div className="hv-admin__panel-tools">
                  <button
                    type="button"
                    className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
                    disabled={busy != null}
                    onClick={() => setProductsModal('scrape')}
                  >
                    Scrape
                  </button>
                  <button
                    type="button"
                    className="hv-admin__btn hv-admin__btn--primary hv-admin__btn--compact"
                    disabled={busy != null}
                    onClick={() => setProductsModal('add')}
                  >
                    Add product
                  </button>
                  <HavenProductFilterMenu
                    value={catalogFilters}
                    onChange={setCatalogFilters}
                    storeOptions={productStoreOptions}
                    disabled={busy != null}
                    align="end"
                  />
                </div>
              </div>

              {products.length === 0 ? (
                <p className="hv-admin__empty" style={{ marginTop: 12 }}>
                  No products yet. Add or scrape some to get started.
                </p>
              ) : filteredCatalogProducts.length === 0 ? (
                <p className="hv-admin__empty" style={{ marginTop: 12 }}>
                  No products match these filters.
                </p>
              ) : (
                <div className="hv-admin__tiles">
                  {filteredCatalogProducts.map((p) => {
                    const hasImage = hasProductImage(p);
                    const uploading = busy === `img-${p.id}`;
                    return (
                      <ProductTile
                        key={p.id}
                        product={p}
                        selected={highlightProductId === p.id}
                        disabled={busy != null && !hasImage}
                        busyLabel={uploading ? 'Uploading…' : null}
                        hoverLabel={hasImage ? '' : 'Add image'}
                        ariaLabel={
                          uploading
                            ? `Uploading image for ${p.name}`
                            : hasImage
                              ? p.name
                              : `Add image for ${p.name}`
                        }
                        onActivate={() => {
                          if (hasImage) return;
                          openImagePicker(p.id);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <HavenAdminCreateStyleModal
        open={createStyleOpen}
        onClose={() => setCreateStyleOpen(false)}
        onCreated={onStyleCreated}
      />

      {productsModal === 'scrape' ? (
        <div
          className="hv-admin__modal-backdrop"
          role="presentation"
          onMouseDown={scrapeBackdrop.onMouseDown}
          onClick={scrapeBackdrop.onClick}
        >
          <div
            className="hv-admin__modal hv-admin__modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-scrape-title"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="products-scrape-title" className="hv-admin__modal-title">
              Scrape products
            </h2>
            <p className="hv-admin__modal-copy">
              Search the web for furniture and decor to add to your catalog.
            </p>
            <div className="hv-admin__form">
              <div className="hv-admin__scrape-row">
                <label className="hv-admin__field hv-admin__field--grow">
                  <span className="hv-admin__label">Search queries</span>
                  <input
                    className="hv-admin__input"
                    value={queriesText}
                    onChange={(e) => setQueriesText(e.target.value)}
                    placeholder="linen sofa, jute rug, oak table"
                    disabled={busy === 'import'}
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
                    disabled={busy === 'import'}
                  />
                </label>
              </div>
              {importResult?.errors?.length ? (
                <p className="hv-admin__msg hv-admin__msg--error">
                  {importResult.errors.slice(0, 3).join(' · ')}
                </p>
              ) : null}
            </div>
            <div className="hv-admin__modal-actions">
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={busy === 'import'}
                onClick={() => setProductsModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary"
                disabled={busy != null}
                onClick={() => {
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
                    setProductsModal(null);
                  });
                }}
              >
                {busy === 'import' ? 'Scraping…' : 'Scrape Web for Products'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productsModal === 'add' ? (
        <div
          className="hv-admin__modal-backdrop"
          role="presentation"
          onMouseDown={addProductBackdrop.onMouseDown}
          onClick={addProductBackdrop.onClick}
        >
          <div
            className="hv-admin__modal hv-admin__modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-add-title"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hv-admin__modal-head">
              <h2 id="products-add-title" className="hv-admin__modal-title">
                Add product
              </h2>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
                disabled={busy != null}
                onClick={() => {
                  setProductsModal(null);
                  setAddProductInitialUrl('');
                }}
              >
                Close
              </button>
            </div>
            <HavenAdminAddProduct
              key={addProductInitialUrl || 'add-product'}
              busy={busy}
              onBusy={setBusy}
              onError={setError}
              initialUrl={addProductInitialUrl}
              onCreated={(product) => {
                setProducts((prev) => {
                  if (prev.some((p) => p.id === product.id)) {
                    return prev.map((p) => (p.id === product.id ? product : p));
                  }
                  return [product, ...prev];
                });
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HavenAdmin;
