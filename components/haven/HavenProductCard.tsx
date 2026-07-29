import React from 'react';
import { categoryLabel } from './productFilters';
import type { HavenProduct } from './types';
import './haven-product.css';

export function formatHavenPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export type HavenProductCardProps = {
  product: HavenProduct;
  className?: string;
  id?: string;
  /** `tile` = tall shop/hotspot card; `rail` = thin wide strip for side lists. */
  variant?: 'tile' | 'rail';
  /** Prefer `<p>` in popovers; `<h3>` in shop strips. */
  titleAs?: 'p' | 'h3';
  buyTabIndex?: number;
  style?: React.CSSProperties;
  role?: React.AriaRole;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
};

/**
 * Canonical Haven shopping tile — image-as-surface.
 * Use `variant="rail"` for compact side lists. Do not invent a new product card.
 */
export const HavenProductCard: React.FC<HavenProductCardProps> = ({
  product,
  className,
  id,
  variant = 'tile',
  titleAs = 'p',
  buyTabIndex = 0,
  style,
  role,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const TitleTag = titleAs;
  const classes = [
    'hv-product',
    variant === 'rail' ? 'hv-product--rail' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      id={id}
      className={classes}
      style={style}
      role={role}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    >
      {product.imageUrl ? (
        <img className="hv-product__img" src={product.imageUrl} alt="" loading="lazy" />
      ) : (
        <span className="hv-product__img" aria-hidden="true" />
      )}
      <span className="hv-product__price">{formatHavenPrice(product.price)}</span>
      <div className="hv-product__body">
        <div className="hv-product__copy">
          {product.merchant || product.category ? (
            <span className="hv-product__merchant">
              {[
                product.merchant || null,
                product.category ? categoryLabel(product.category) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          ) : null}
          <TitleTag className="hv-product__name" title={product.name}>
            {product.name}
          </TitleTag>
        </div>
        {product.affiliateUrl ? (
          <a
            className="hv-product__buy"
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={buyTabIndex}
            onClick={(e) => e.stopPropagation()}
          >
            Buy
          </a>
        ) : null}
      </div>
    </div>
  );
};
