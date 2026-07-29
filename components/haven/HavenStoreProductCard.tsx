import React from 'react';
import { Link } from 'react-router-dom';
import { categoryLabel } from './productFilters';
import type { HavenProduct } from './types';

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Storefront catalog tile with PDP link — image-as-surface.
 * For hotspot popovers / shop strips without a PDP route, use HavenProductCard instead.
 * Do not invent a third product-card layout.
 */
export const HavenStoreProductCard: React.FC<{
  product: HavenProduct;
  to: string;
  className?: string;
}> = ({ product, to, className }) => {
  return (
    <article className={`hv-store__card${className ? ` ${className}` : ''}`}>
      <Link to={to} className="hv-store__card-face" aria-label={product.name}>
        <span className="hv-store__card-media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className="hv-store__card-empty" aria-hidden="true" />
          )}
        </span>
        <span className="hv-store__card-shade" aria-hidden="true" />
        <span className="hv-store__card-copy">
          <span className="hv-store__card-name">{product.name}</span>
          <span className="hv-store__card-meta">
            <strong>{formatPrice(product.price)}</strong>
            {product.merchant ? ` · ${product.merchant}` : ''}
            {product.category ? ` · ${categoryLabel(product.category)}` : ''}
          </span>
        </span>
      </Link>
      {product.affiliateUrl ? (
        <a
          className="hv-store__card-buy"
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Buy
        </a>
      ) : null}
    </article>
  );
};

export { formatPrice };
