import React, { useRef, useState } from 'react';
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

type AddMode = 'manual' | 'url';

export const HavenAdminAddProduct: React.FC<{
  busy: string | null;
  onBusy: (key: string | null) => void;
  onError: (msg: string | null) => void;
  onCreated: (product: HavenProduct) => void;
}> = ({ busy, onBusy, onError, onCreated }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<AddMode>('url');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [price, setPrice] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [category, setCategory] = useState<HavenProductCategory>('other');
  const [imageUrl, setImageUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewNotes, setPreviewNotes] = useState<string[]>([]);
  const [matchNote, setMatchNote] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setMerchant('');
    setPrice('');
    setAffiliateUrl('');
    setCategory('other');
    setImageUrl('');
    setPendingFile(null);
    setPreviewNotes([]);
    setMatchNote(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const applyPreview = (preview: {
    name: string;
    merchant: string;
    price: number | null;
    imageUrl: string;
    affiliateUrl: string;
    category: string;
  }) => {
    setName(preview.name);
    setMerchant(preview.merchant);
    setPrice(preview.price != null && Number.isFinite(preview.price) ? String(preview.price) : '');
    setAffiliateUrl(preview.affiliateUrl);
    setImageUrl(preview.imageUrl);
    setCategory(
      (CATEGORIES.includes(preview.category as HavenProductCategory)
        ? preview.category
        : 'other') as HavenProductCategory,
    );
  };

  const onFetchUrl = () => {
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
        applyPreview(result.preview);
        setPreviewNotes(result.notes);
        setMatchNote(
          result.matched
            ? `Matched (${result.matchConfidence}) — review and save.`
            : 'Couldn’t auto-fill everything — complete the fields below.',
        );
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not read that URL.');
      } finally {
        onBusy(null);
      }
    })();
  };

  const onSave = () => {
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
        let product = await havenAdminClient.createProduct({
          name: trimmedName,
          merchant: merchant.trim() || 'Unknown',
          price: price.trim() ? Number(price) : null,
          imageUrl: imageUrl.trim(),
          affiliateUrl: link,
          category,
          active: true,
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
        setUrl('');
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not create product.');
      } finally {
        onBusy(null);
      }
    })();
  };

  const disabled = busy != null;

  return (
    <div className="hv-admin__add-product">
      <div className="hv-admin__seg" role="tablist" aria-label="Add product method">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'url'}
          className={`hv-admin__seg-btn${mode === 'url' ? ' is-active' : ''}`}
          disabled={disabled}
          onClick={() => setMode('url')}
        >
          Paste URL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'manual'}
          className={`hv-admin__seg-btn${mode === 'manual' ? ' is-active' : ''}`}
          disabled={disabled}
          onClick={() => setMode('manual')}
        >
          Manual
        </button>
      </div>

      {mode === 'url' && (
        <div className="hv-admin__add-product-url">
          <label className="hv-admin__field">
            <span className="hv-admin__label">Product page URL</span>
            <div className="hv-admin__inline-row">
              <input
                className="hv-admin__input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.wayfair.com/…"
                disabled={disabled}
              />
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={disabled || !url.trim()}
                onClick={onFetchUrl}
              >
                {busy === 'product-url' ? 'Reading…' : 'Fetch'}
              </button>
            </div>
          </label>
          {matchNote && <p className="hv-admin__panel-meta">{matchNote}</p>}
          {previewNotes.length > 0 && (
            <ul className="hv-admin__notes-list">
              {previewNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="hv-admin__form hv-admin__add-product-form">
        <label className="hv-admin__field">
          <span className="hv-admin__label">Name</span>
          <input
            className="hv-admin__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
          />
        </label>
        <div className="hv-admin__inline-row">
          <label className="hv-admin__field hv-admin__field--grow">
            <span className="hv-admin__label">Merchant</span>
            <input
              className="hv-admin__input"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              disabled={disabled}
            />
          </label>
          <label className="hv-admin__field hv-admin__field--max">
            <span className="hv-admin__label">Price</span>
            <input
              className="hv-admin__input"
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={disabled}
            />
          </label>
        </div>
        <label className="hv-admin__field">
          <span className="hv-admin__label">Affiliate / product link</span>
          <input
            className="hv-admin__input"
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            disabled={disabled}
          />
        </label>
        <label className="hv-admin__field">
          <span className="hv-admin__label">Category</span>
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
        <div className="hv-admin__inline-row hv-admin__add-product-media">
          <label className="hv-admin__field hv-admin__field--grow">
            <span className="hv-admin__label">Image URL</span>
            <input
              className="hv-admin__input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="optional if you upload a file"
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
          onClick={onSave}
        >
          {busy === 'product-create' ? 'Saving…' : 'Save product'}
        </button>
      </div>
    </div>
  );
};
