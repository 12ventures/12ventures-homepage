export const OTTERWORKS_PAGE_TITLE =
  'OTTERWORKS | Applied AI Solutions • Scalable Results';

export function is12VenturesHost(hostname = window.location.hostname): boolean {
  return hostname.includes('12ventures.io');
}

export function isOtterworksHost(hostname = window.location.hostname): boolean {
  return hostname.includes('otterworks.ai') || hostname.includes('otterworks.io');
}
