import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { havenToastError, havenToastHint } from './adminFeedback';
import { havenAdminClient } from './api/havenAdminClient';
import {
  formatDimensions,
  normalizePrice,
  normalizeText,
  normalizeUrl,
  resolveDimensionsForApi,
} from './productInputNormalize';
import type { HavenProduct, HavenProductCategory, HavenProductDetail } from './types';

const CATEGORIES: HavenProductCategory[] = [
  'sofa',
  'rug',
  'table',
  'lighting',
  'decor',
  'chair',
  'other',
];

/** Optional — can stay blank on import. */
const OPTIONAL_FIELDS = new Set([
  'price',
  'merchant',
  'dimensions',
  'externalSku',
]);

function applyProductToForm(
  product: Pick<
    HavenProductDetail,
    | 'name'
    | 'merchant'
    | 'price'
    | 'affiliateUrl'
    | 'imageUrl'
    | 'category'
    | 'dimensions'
    | 'externalSku'
  >,
  setters: {
    setName: (v: string) => void;
    setMerchant: (v: string) => void;
    setPrice: (v: string) => void;
    setAffiliateUrl: (v: string) => void;
    setImageUrl: (v: string) => void;
    setDimensions: (v: string) => void;
    setExternalSku: (v: string) => void;
    setCategory: (v: HavenProductCategory) => void;
  },
) {
  setters.setName(normalizeText(product.name));
  setters.setMerchant(normalizeText(product.merchant));
  setters.setPrice(
    product.price != null && Number.isFinite(product.price)
      ? String(product.price)
      : '',
  );
  setters.setAffiliateUrl(normalizeUrl(product.affiliateUrl));
  setters.setImageUrl(normalizeUrl(product.imageUrl));
  setters.setDimensions(formatDimensions(product.dimensions ?? ''));
  setters.setExternalSku(
    product.externalSku?.trim() ? normalizeText(product.externalSku) : '',
  );
  setters.setCategory(
    (CATEGORIES.includes(product.category as HavenProductCategory)
      ? product.category
      : 'other') as HavenProductCategory,
  );
}

export const HavenAdminAddProduct: React.FC<{
  busy: string | null;
  onBusy: (key: string | null) => void;
  onCreated?: (product: HavenProduct) => void;
  onUpdated?: (product: HavenProduct) => void;
  /** Opens parent confirmation before delete. */
  onRequestDelete?: () => void;
  /** Prefill product URL (e.g. from trends candidate). */
  initialUrl?: string;
  /** When set, form edits this product instead of creating. */
  editProduct?: HavenProduct | null;
}> = ({
  busy,
  onBusy,
  onCreated,
  onUpdated,
  onRequestDelete,
  initialUrl = '',
  editProduct = null,
}) => {
  const isEdit = Boolean(editProduct?.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const autofilledRef = useRef(false);
  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [price, setPrice] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [category, setCategory] = useState<HavenProductCategory>('other');
  const [imageUrl, setImageUrl] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [externalSku, setExternalSku] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const setters = useMemo(
    () => ({
      setName,
      setMerchant,
      setPrice,
      setAffiliateUrl,
      setImageUrl,
      setDimensions,
      setExternalSku,
      setCategory,
    }),
    [],
  );

  const missingSet = useMemo(() => new Set(missingFields), [missingFields]);

  const fieldClass = (key: string) =>
    missingSet.has(key) ? 'hv-admin__field hv-admin__field--missing' : 'hv-admin__field';

  const fieldHint = (key: string) => {
    if (!missingSet.has(key)) return null;
    return (
      <span className="hv-admin__field-hint">
        {OPTIONAL_FIELDS.has(key) ? 'optional' : 'needed'}
      </span>
    );
  };

  const resetForm = () => {
    setUrl('');
    setName('');
    setMerchant('');
    setPrice('');
    setAffiliateUrl('');
    setCategory('other');
    setImageUrl('');
    setDimensions('');
    setExternalSku('');
    setPendingFile(null);
    setMissingFields([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Hydrate edit form from list card, then enrich from admin detail if available.
  useEffect(() => {
    if (!editProduct?.id) return;
    const seed = editProduct;
    applyProductToForm(seed, setters);
    setUrl(normalizeUrl(seed.affiliateUrl));
    setPendingFile(null);
    setMissingFields([]);
    let cancelled = false;
    setLoadingDetail(true);
    void havenAdminClient
      .getProduct(seed.id)
      .then((detail) => {
        if (cancelled) return;
        applyProductToForm(detail, setters);
        setUrl(normalizeUrl(detail.affiliateUrl));
      })
      .catch(() => {
        /* list fields are enough to edit */
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
    // Only re-hydrate when opening a different product.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed captured for this id
  }, [editProduct?.id, setters]);

  const onAutofillFromUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      havenToastHint('Paste a product URL first.');
      return;
    }
    void (async () => {
      onBusy('product-url');
      try {
        const result = await havenAdminClient.previewProductFromUrl(trimmed);
        const { preview } = result;
        applyProductToForm(
          {
            name: preview.name,
            merchant: preview.merchant,
            price: preview.price ?? 0,
            affiliateUrl: preview.affiliateUrl || trimmed,
            imageUrl: preview.imageUrl,
            category: preview.category as HavenProductCategory,
            dimensions: preview.dimensions,
            externalSku: preview.externalSku,
          },
          setters,
        );
        setMissingFields(result.missingFields);
      } catch (err) {
        havenToastError('product-url-preview', err);
      } finally {
        onBusy(null);
      }
    })();
  };

  useEffect(() => {
    if (isEdit || !initialUrl.trim() || autofilledRef.current) return;
    autofilledRef.current = true;
    setUrl(initialUrl.trim());
    setAffiliateUrl(initialUrl.trim());
    void (async () => {
      onBusy('product-url');
      try {
        const result = await havenAdminClient.previewProductFromUrl(initialUrl.trim());
        const { preview } = result;
        applyProductToForm(
          {
            name: preview.name,
            merchant: preview.merchant,
            price: preview.price ?? 0,
            affiliateUrl: preview.affiliateUrl || initialUrl.trim(),
            imageUrl: preview.imageUrl,
            category: preview.category as HavenProductCategory,
            dimensions: preview.dimensions,
            externalSku: preview.externalSku,
          },
          setters,
        );
        setMissingFields(result.missingFields);
      } catch (err) {
        havenToastError('product-url-preview-initial', err);
      } finally {
        onBusy(null);
      }
    })();
  }, [initialUrl, onBusy, isEdit, setters]);

  const onSave = () => {
    const trimmedName = normalizeText(name);
    const link = normalizeUrl(affiliateUrl);
    if (!trimmedName) {
      havenToastHint('Add a product name to continue.');
      return;
    }
    if (!link) {
      havenToastHint('Add a product link to continue.');
      return;
    }
    if (!pendingFile && !normalizeUrl(imageUrl)) {
      havenToastHint('Add a product photo to continue.');
      return;
    }

    void (async () => {
      onBusy(isEdit ? 'product-save' : 'product-create');
      try {
        const dims = resolveDimensionsForApi(dimensions);
        let product: HavenProduct;

        if (isEdit && editProduct) {
          product = await havenAdminClient.patchProduct(editProduct.id, {
            name: trimmedName,
            merchant: normalizeText(merchant) || null,
            price: normalizePrice(price),
            imageUrl: normalizeUrl(imageUrl),
            affiliateUrl: link,
            category,
            externalSku: normalizeText(externalSku) || null,
            dimensions: dims,
          });
          if (pendingFile) {
            product = await havenAdminClient.uploadProductImage(product.id, pendingFile);
          } else if (
            normalizeUrl(imageUrl) &&
            normalizeUrl(imageUrl) !== normalizeUrl(editProduct.imageUrl)
          ) {
            product = await havenAdminClient.setProductImageUrl(
              product.id,
              normalizeUrl(imageUrl),
            );
          }
          onUpdated?.(product);
          toast.success('Product updated');
        } else {
          product = await havenAdminClient.createProduct({
            name: trimmedName,
            merchant: normalizeText(merchant) || null,
            price: normalizePrice(price),
            imageUrl: normalizeUrl(imageUrl),
            affiliateUrl: link,
            category,
            active: true,
            externalSku: normalizeText(externalSku) || null,
            dimensions: dims,
          });

          if (pendingFile) {
            product = await havenAdminClient.uploadProductImage(product.id, pendingFile);
          } else if (imageUrl.trim() && !product.imageUrl) {
            product = await havenAdminClient.setProductImageUrl(
              product.id,
              imageUrl.trim(),
            );
          }

          if (!product.imageUrl?.trim()) {
            throw new Error('Product saved but still needs a photo.');
          }

          resetForm();
          onCreated?.(product);
          toast.success('Product added');
        }
      } catch (err) {
        havenToastError(isEdit ? 'product-save' : 'product-create', err);
      } finally {
        onBusy(null);
      }
    })();
  };

  const disabled = busy != null || loadingDetail;
  const saving = busy === 'product-create' || busy === 'product-save';

  return (
    <div className="hv-admin__add-product">
      <div className="hv-admin__add-product-url">
        <label className="hv-admin__field">
          <span className="hv-admin__label">URL</span>
          <div className="hv-admin__inline-row">
            <input
              className="hv-admin__input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAutofillFromUrl();
                }
              }}
            />
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--ghost hv-admin__add-product-fill"
              disabled={disabled || !url.trim()}
              onClick={onAutofillFromUrl}
            >
              {busy === 'product-url' ? 'Filling…' : 'Fill From Product URL'}
            </button>
          </div>
        </label>
      </div>

      <div className="hv-admin__form hv-admin__add-product-form">
        <label className={`${fieldClass('name')} hv-admin__field--grow`}>
          <span className="hv-admin__label">
            Name
            {fieldHint('name')}
          </span>
          <input
            className="hv-admin__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
          />
        </label>

        <div className="hv-admin__inline-row">
          <label className={`${fieldClass('merchant')} hv-admin__field--grow`}>
            <span className="hv-admin__label">
              Merchant
              {fieldHint('merchant')}
            </span>
            <input
              className="hv-admin__input"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="optional"
              disabled={disabled}
            />
          </label>
          <label className={`${fieldClass('price')} hv-admin__field--max`}>
            <span className="hv-admin__label">
              Price
              {fieldHint('price')}
            </span>
            <input
              className="hv-admin__input"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={() => {
                const n = normalizePrice(price);
                setPrice(n != null ? String(n) : normalizeText(price));
              }}
              placeholder="$129 or 129"
              disabled={disabled}
            />
          </label>
        </div>

        <label className={fieldClass('affiliateUrl')}>
          <span className="hv-admin__label">
            Affiliate / product link
            {fieldHint('affiliateUrl')}
          </span>
          <input
            className="hv-admin__input"
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            onBlur={() => setAffiliateUrl(normalizeUrl(affiliateUrl))}
            disabled={disabled}
          />
        </label>

        <div className="hv-admin__inline-row">
          <label className={`${fieldClass('category')} hv-admin__field--grow`}>
            <span className="hv-admin__label">
              Category
              {fieldHint('category')}
            </span>
            <select
              className="hv-admin__select"
              value={category}
              onChange={(e) => setCategory(e.target.value as HavenProductCategory)}
              disabled={disabled}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={`${fieldClass('externalSku')} hv-admin__field--grow`}>
            <span className="hv-admin__label">
              SKU
              {fieldHint('externalSku')}
            </span>
            <input
              className="hv-admin__input"
              value={externalSku}
              onChange={(e) => setExternalSku(e.target.value)}
              placeholder="optional"
              disabled={disabled}
            />
          </label>
        </div>

        <label className={fieldClass('dimensions')}>
          <span className="hv-admin__label">
            Dimensions
            {fieldHint('dimensions')}
          </span>
          <input
            className="hv-admin__input"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            onBlur={() => {
              const pretty = formatDimensions(dimensions);
              if (pretty) setDimensions(pretty);
            }}
            placeholder='e.g. 27.5" w x 25.5" d x 36" h'
            disabled={disabled}
          />
        </label>

        <div className="hv-admin__inline-row hv-admin__add-product-media">
          <label className={`${fieldClass('imageUrl')} hv-admin__field--grow`}>
            <span className="hv-admin__label">
              Image URL
              {fieldHint('imageUrl')}
            </span>
            <input
              className="hv-admin__input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="or upload"
              disabled={disabled}
            />
          </label>
          <div className="hv-admin__field">
            <span className="hv-admin__label">Or upload</span>
            <input
              ref={fileRef}
              className="hv-admin__input"
              type="file"
              accept="image/*"
              disabled={disabled}
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {(imageUrl || pendingFile) && (
          <div className="hv-admin__add-product-preview">
            <img
              src={pendingFile ? URL.createObjectURL(pendingFile) : imageUrl}
              alt=""
            />
          </div>
        )}

        <div className="hv-admin__modal-actions hv-admin__add-product-actions">
          {isEdit && onRequestDelete ? (
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--danger hv-admin__add-product-remove"
              disabled={disabled}
              onClick={onRequestDelete}
            >
              Remove product
            </button>
          ) : null}
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--primary"
            disabled={disabled}
            onClick={onSave}
            aria-busy={saving}
          >
            {saving
              ? isEdit
                ? 'Saving…'
                : 'Importing…'
              : isEdit
                ? 'Save changes'
                : 'Import product'}
          </button>
        </div>
      </div>
    </div>
  );
};
