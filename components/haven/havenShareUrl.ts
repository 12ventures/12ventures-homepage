/**
 * Resolve the origin that serves Haven share/OG HTML.
 *
 * Amplify cannot UA-filter rewrites, and proxying all SPA traffic to the API
 * loops when the API 302s browsers back to the SPA. So share links target the
 * API’s public share routes by default (bot → OG HTML, browser → 302 to SPA).
 *
 * Set VITE_HAVEN_SHARE_ORIGIN to the SPA origin only after Amplify proxies
 * /haven/store/product|look/* and the API stops 302ing those proxied hits.
 */
export function resolveHavenShareOrigin(): string | null {
  const explicit = String(import.meta.env.VITE_HAVEN_SHARE_ORIGIN || '')
    .trim()
    .replace(/\/$/, '');
  if (explicit) return explicit;

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

export function havenSharePageUrl(kind: 'product' | 'look', id: string): string {
  const path =
    kind === 'product'
      ? `/haven/store/product/${encodeURIComponent(id)}`
      : `/haven/store/look/${encodeURIComponent(id)}`;

  const origin = resolveHavenShareOrigin();
  if (!origin) {
    return `${window.location.origin}${path}`;
  }

  // Local API → keep SPA URL so “copy link” stays useful in dev.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return `${window.location.origin}${path}`;
  }

  return `${origin}${path}`;
}
