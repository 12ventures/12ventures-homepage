import React, { useEffect, useMemo, useRef, useState } from 'react';
import { havenAdminClient } from './api/havenAdminClient';
import type { HavenProduct, HavenProductCategory } from './types';

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

export const HavenAdminAddProduct: React.FC<{
  busy: string | null;
  onBusy: (key: string | null) => void;
  onError: (msg: string | null) => void;
  onCreated: (product: HavenProduct) => void;
  /** Prefill product URL (e.g. from trends candidate). */
  initialUrl?: string;
}> = ({ busy, onBusy, onError, onCreated, initialUrl = '' }) => {
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

  const onAutofillFromUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      onError('Paste a product URL first.');
      return;
    }
    void (async () => {
      onBusy('product-url');
      onError(null);
      try {
        const result = await havenAdminClient.previewProductFromUrl(trimmed);
        const { preview } = result;
        setName(preview.name);
        setMerchant(preview.merchant);
        setPrice(
          preview.price != null && Number.isFinite(preview.price)
            ? String(preview.price)
            : '',
        );
        setAffiliateUrl(preview.affiliateUrl || trimmed);
        setImageUrl(preview.imageUrl);
        setDimensions(preview.dimensions);
        setExternalSku(preview.externalSku?.trim() ? preview.externalSku : '');
        setCategory(
          (CATEGORIES.includes(preview.category as HavenProductCategory)
            ? preview.category
            : 'other') as HavenProductCategory,
        );
        setMissingFields(result.missingFields);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not read that URL.');
      } finally {
        onBusy(null);
      }
    })();
  };

  useEffect(() => {
    if (!initialUrl.trim() || autofilledRef.current) return;
    autofilledRef.current = true;
    setUrl(initialUrl.trim());
    setAffiliateUrl(initialUrl.trim());
    // Kick off preview fill once when opened from trends.
    void (async () => {
      onBusy('product-url');
      onError(null);
      try {
        const result = await havenAdminClient.previewProductFromUrl(initialUrl.trim());
        const { preview } = result;
        setName(preview.name);
        setMerchant(preview.merchant);
        setPrice(
          preview.price != null && Number.isFinite(preview.price)
            ? String(preview.price)
            : '',
        );
        setAffiliateUrl(preview.affiliateUrl || initialUrl.trim());
        setImageUrl(preview.imageUrl);
        setDimensions(preview.dimensions);
        setExternalSku(preview.externalSku?.trim() ? preview.externalSku : '');
        setCategory(
          (CATEGORIES.includes(preview.category as HavenProductCategory)
            ? preview.category
            : 'other') as HavenProductCategory,
        );
        setMissingFields(result.missingFields);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not read that URL.');
      } finally {
        onBusy(null);
      }
    })();
  }, [initialUrl, onBusy, onError]);

  const onImport = () => {
    const trimmedName = name.trim();
    const link = affiliateUrl.trim();
    if (!trimmedName) {
      onError('Name is required.');
      return;
    }
    if (!link) {
      onError('Product link is required.');
      return;
    }
    if (!pendingFile && !imageUrl.trim()) {
      onError('Add a product photo (upload or image URL).');
      return;
    }

    void (async () => {
      onBusy('product-create');
      onError(null);
      try {
        // Import uses POST /admin/products only — never call from-url again.
        let product = await havenAdminClient.createProduct({
          name: trimmedName,
          merchant: merchant.trim() || null,
          price: price.trim() ? Number(price) : null,
          imageUrl: imageUrl.trim(),
          affiliateUrl: link,
          category,
          active: true,
          externalSku: externalSku.trim() || null,
          dimensions: dimensions.trim() || null,
        });

        if (pendingFile) {
          product = await havenAdminClient.uploadProductImage(product.id, pendingFile);
        } else if (imageUrl.trim() && !product.imageUrl) {
          product = await havenAdminClient.setProductImageUrl(product.id, imageUrl.trim());
        }

        if (!product.imageUrl?.trim()) {
          throw new Error('Product saved but still needs a photo.');
        }

        onCreated(product);
        resetForm();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not import product.');
      } finally {
        onBusy(null);
      }
    })();
  };

  const disabled = busy != null;

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
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="—"
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
            placeholder="optional"
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

        <button
          type="button"
          className="hv-admin__btn hv-admin__btn--primary"
          disabled={disabled}
          onClick={onImport}
        >
          {busy === 'product-create' ? 'Importing…' : 'Import product'}
        </button>
      </div>
    </div>
  );
};
