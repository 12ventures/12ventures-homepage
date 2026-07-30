/**
 * Share / OG URLs for Haven product + look pages.
 *
 * Production: same-origin pretty URLs (https://www.12ventures.io/haven/store/...).
 * That requires Amplify 200-proxy of those paths to the API, and the API must
 * return 200 SPA-shaped HTML with og:* (no browser 302 back to the same path).
 *
 * Local: prefer API share origin (from VITE_MLKCH_API_URL) so you can test OG
 * without Amplify; localhost API falls back to the Vite origin.
 *
 * Override anytime with VITE_HAVEN_SHARE_ORIGIN.
 */

function apiShareOrigin(): string | null {
  const api = String(import.meta.env.VITE_MLKCH_API_URL || '').trim();
  if (!api) return null;
  try {
    const u = new URL(api);
    const stripped = u.pathname.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '');
    return stripped ? `${u.origin}${stripped}` : u.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function resolveHavenShareOrigin(): string | null {
  const explicit = String(import.meta.env.VITE_HAVEN_SHARE_ORIGIN || '')
    .trim()
    .replace(/\/$/, '');
  if (explicit) return explicit;

  // Deployed SPA: share the public site origin (Amplify + API OG proxy).
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const here = window.location.origin;
    if (!isLocalOrigin(here)) return here;
  }

  return apiShareOrigin();
}

export function havenSharePageUrl(kind: 'product' | 'look', id: string): string {
  const path =
    kind === 'product'
      ? `/haven/store/product/${encodeURIComponent(id)}`
      : `/haven/store/look/${encodeURIComponent(id)}`;

  const origin = resolveHavenShareOrigin();
  if (!origin || isLocalOrigin(origin)) {
    return `${window.location.origin}${path}`;
  }

  return `${origin}${path}`;
}
