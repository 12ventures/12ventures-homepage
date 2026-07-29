import React from 'react';
import './haven-skeleton.css';

type BoneProps = {
  className?: string;
  style?: React.CSSProperties;
};

/** Single shimmer block — build page skeletons from these. */
export const HavenSkeletonBone: React.FC<BoneProps> = ({ className, style }) => (
  <span
    className={`hv-skel__bone${className ? ` ${className}` : ''}`}
    style={style}
    aria-hidden="true"
  />
);

export const HavenSkeletonProductCard: React.FC = () => (
  <div className="hv-skel__card" aria-hidden="true">
    <HavenSkeletonBone className="hv-skel__card-face" />
  </div>
);

export const HavenSkeletonProductRail: React.FC = () => (
  <div className="hv-skel__rail-card" aria-hidden="true">
    <HavenSkeletonBone className="hv-skel__rail-face" />
  </div>
);

export const HavenSkeletonLookTile: React.FC = () => (
  <div className="hv-skel__look-tile" aria-hidden="true">
    <HavenSkeletonBone className="hv-skel__look-tile-face" />
  </div>
);

export const HavenSkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="hv-store__grid hv-skel__grid">
    {Array.from({ length: count }, (_, i) => (
      <HavenSkeletonProductCard key={i} />
    ))}
  </div>
);

/** Main `/haven/store` loading layout. */
export const HavenStoreSkeleton: React.FC = () => (
  <div className="hv-skel" role="status" aria-live="polite" aria-label="Loading store">
    <section className="hv-store__hero" aria-hidden="true">
      <div className="hv-store__hero-stage hv-skel__hero-stage">
        <HavenSkeletonBone className="hv-skel__hero-fill" />
        <div className="hv-skel__hero-copy">
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--lg" />
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--md" />
        </div>
        <div className="hv-skel__hero-dots">
          <HavenSkeletonBone className="hv-skel__dot" />
          <HavenSkeletonBone className="hv-skel__dot hv-skel__dot--wide" />
          <HavenSkeletonBone className="hv-skel__dot" />
        </div>
      </div>
    </section>

    <section className="hv-skel__section" aria-hidden="true">
      <HavenSkeletonBone className="hv-skel__line hv-skel__line--title" />
      <HavenSkeletonGrid count={8} />
    </section>
  </div>
);

/** `/haven/store/look/:id` loading layout. */
export const HavenLookSkeleton: React.FC = () => (
  <div className="hv-skel" role="status" aria-live="polite" aria-label="Loading look">
    <section className="hv-store__look hv-skel__look" aria-hidden="true">
      <div className="hv-store__look-media">
        <div className="hv-skel__look-stage">
          <HavenSkeletonBone className="hv-skel__hero-fill" />
          <div className="hv-skel__hero-copy">
            <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
            <HavenSkeletonBone className="hv-skel__line hv-skel__line--lg" />
          </div>
        </div>
      </div>
      <aside className="hv-store__look-rail">
        <div className="hv-store__look-rail-head">
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--sm" />
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
        </div>
        <div className="hv-store__look-rail-list">
          {Array.from({ length: 5 }, (_, i) => (
            <HavenSkeletonProductRail key={i} />
          ))}
        </div>
      </aside>
    </section>

    <section className="hv-skel__section" aria-hidden="true">
      <HavenSkeletonBone className="hv-skel__line hv-skel__line--title" />
      <div className="hv-store__look-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <HavenSkeletonLookTile key={i} />
        ))}
      </div>
    </section>
  </div>
);

/** `/haven/store/product/:id` loading layout. */
export const HavenProductSkeleton: React.FC = () => (
  <div className="hv-skel" role="status" aria-live="polite" aria-label="Loading product">
    <section className="hv-store__pdp" aria-hidden="true">
      <div className="hv-store__pdp-stage hv-skel__pdp-stage">
        <HavenSkeletonBone className="hv-skel__hero-fill" />
        <div className="hv-skel__pdp-layout">
          <div className="hv-skel__pdp-main">
            <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
            <div className="hv-skel__pdp-mid">
              <HavenSkeletonBone className="hv-skel__line hv-skel__line--lg" />
              <HavenSkeletonBone className="hv-skel__line hv-skel__line--md" />
              <HavenSkeletonBone className="hv-skel__line hv-skel__line--sm" />
            </div>
            <HavenSkeletonBone className="hv-skel__btn" />
          </div>
          <HavenSkeletonBone className="hv-skel__pdp-focus" />
        </div>
      </div>
    </section>

    <section className="hv-skel__section" aria-hidden="true">
      <HavenSkeletonBone className="hv-skel__line hv-skel__line--title" />
      <HavenSkeletonGrid count={8} />
    </section>
  </div>
);

/** `/haven/admin` loading layout. */
export const HavenAdminSkeleton: React.FC = () => (
  <div
    className="hv-skel hv-skel--admin"
    role="status"
    aria-live="polite"
    aria-label="Loading catalog"
  >
    <div className="hv-admin__grid" aria-hidden="true">
      <section className="hv-admin__panel">
        <div className="hv-admin__panel-head">
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
        </div>

        <div className="hv-admin__style-picker-head">
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--sm" />
        </div>
        <div className="hv-admin__style-picker hv-skel__style-picker">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="hv-skel__style-card">
              <HavenSkeletonBone className="hv-skel__style-media" />
              <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs hv-skel__style-label" />
            </div>
          ))}
        </div>

        <div className="hv-skel__admin-actions">
          <HavenSkeletonBone className="hv-skel__btn hv-skel__btn--wide" />
          <HavenSkeletonBone className="hv-skel__btn hv-skel__btn--wide" />
        </div>

        <div className="hv-admin__sets-head">
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
        </div>
        <div className="hv-admin__sets">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="hv-skel__set">
              <HavenSkeletonBone className="hv-skel__set-face" />
            </div>
          ))}
        </div>
      </section>

      <section className="hv-admin__panel">
        <div className="hv-admin__panel-head">
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--xs" />
          <HavenSkeletonBone className="hv-skel__line hv-skel__line--sm" />
        </div>
        <div className="hv-skel__admin-actions">
          <HavenSkeletonBone className="hv-skel__btn hv-skel__btn--wide" />
          <HavenSkeletonBone className="hv-skel__btn hv-skel__btn--wide" />
        </div>
        <div className="hv-admin__tiles hv-skel__admin-tiles">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="hv-skel__admin-tile">
              <HavenSkeletonBone className="hv-skel__admin-tile-face" />
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);
