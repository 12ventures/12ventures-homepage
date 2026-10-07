/**
 * Same-origin path proxied to https://api.snapskill.io (Amplify + Vite dev proxy).
 * Avoids CORS when the marketing site is served from otterworks.ai or other domains.
 */
const PROXY_PREFIX = '/snapskill-api';

export function demoBookingUrl(): string {
  const override = import.meta.env.VITE_SNAPSKILL_API_URL as string | undefined;
  if (override?.trim()) {
    return `${override.replace(/\/$/, '')}/api/v1/analytics/demo-booking`;
  }
  return `${PROXY_PREFIX}/api/v1/analytics/demo-booking`;
}
