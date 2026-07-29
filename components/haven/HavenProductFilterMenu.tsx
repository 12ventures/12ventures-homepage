import React, { useEffect, useId, useRef, useState } from 'react';
import {
  DEFAULT_PRODUCT_FILTERS,
  PRODUCT_CATEGORIES,
  categoryLabel,
  productFiltersActive,
} from './productFilters';
import type {
  HavenProductCategory,
  ProductCatalogFilters,
  ProductCatalogSort,
  ProductStoreOption,
} from './types';
import './haven-product-filters.css';

const SORT_OPTIONS: { value: ProductCatalogSort; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'newest', label: 'Newest' },
  { value: 'store', label: 'Store' },
];

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5h11M4.5 8h7M6.5 12.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const HavenProductFilterMenu: React.FC<{
  value: ProductCatalogFilters;
  onChange: (next: ProductCatalogFilters) => void;
  storeOptions: ProductStoreOption[];
  disabled?: boolean;
  className?: string;
  align?: 'start' | 'end';
}> = ({
  value,
  onChange,
  storeOptions,
  disabled = false,
  className = '',
  align = 'end',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = productFiltersActive(value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const setCategory = (category: HavenProductCategory | null) => {
    onChange({
      ...value,
      category: value.category === category ? null : category,
    });
  };

  const setStore = (store: string | null) => {
    onChange({
      ...value,
      store: value.store === store ? null : store,
    });
  };

  const setSort = (sort: ProductCatalogSort) => {
    onChange({ ...value, sort });
  };

  return (
    <div
      ref={rootRef}
      className={`hv-pfilter${className ? ` ${className}` : ''}${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
    >
      <button
        type="button"
        className={`hv-pfilter__btn${active ? ' is-active' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        title={active ? 'Filters applied' : 'Filter products'}
        aria-label={active ? 'Filter products (filters applied)' : 'Filter products'}
        onClick={() => setOpen((v) => !v)}
      >
        <FilterIcon />
        {active ? <span className="hv-pfilter__dot" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className={`hv-pfilter__panel hv-pfilter__panel--${align}`}
          role="dialog"
          aria-label="Product filters"
        >
          <div className="hv-pfilter__head">
            <p className="hv-pfilter__title">Filter</p>
            {active ? (
              <button
                type="button"
                className="hv-pfilter__clear"
                onClick={() => onChange({ ...DEFAULT_PRODUCT_FILTERS })}
              >
                Clear
              </button>
            ) : null}
          </div>

          <fieldset className="hv-pfilter__section">
            <legend className="hv-pfilter__legend">Category</legend>
            <div className="hv-pfilter__chips">
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`hv-pfilter__chip${value.category === cat ? ' is-on' : ''}`}
                  aria-pressed={value.category === cat}
                  onClick={() => setCategory(cat)}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </fieldset>

          {storeOptions.length > 0 ? (
            <fieldset className="hv-pfilter__section">
              <legend className="hv-pfilter__legend">Store</legend>
              <div className="hv-pfilter__chips">
                {storeOptions.map((opt) => (
                  <button
                    key={opt.storeKey}
                    type="button"
                    className={`hv-pfilter__chip${value.store === opt.storeKey ? ' is-on' : ''}`}
                    aria-pressed={value.store === opt.storeKey}
                    title={opt.storeKey}
                    onClick={() => setStore(opt.storeKey)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="hv-pfilter__section">
            <legend className="hv-pfilter__legend">Sort</legend>
            <div className="hv-pfilter__chips">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`hv-pfilter__chip${value.sort === opt.value ? ' is-on' : ''}`}
                  aria-pressed={value.sort === opt.value}
                  onClick={() => setSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
};
