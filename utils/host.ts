export const OTTERWORKS_PAGE_TITLE =
  'OTTERWORKS | Production AI · Scalable Results';

export const VENTURES_PAGE_TITLE = '12 VENTURES | Applied AI · Measurable Results';

export function is12VenturesHost(hostname = window.location.hostname): boolean {
  return hostname.includes('12ventures.io');
}

export function isOtterworksHost(hostname = window.location.hostname): boolean {
  return hostname.includes('otterworks.ai') || hostname.includes('otterworks.io');
}

/** Tab title follows the site, not the product brand on that page. */
export function resolveDocumentTitle(
  brand: { id: string; name: string; subtitle?: string },
  hostname: string,
): string {
  if (isOtterworksHost(hostname)) return OTTERWORKS_PAGE_TITLE;
  // /operator and /learn use the OtterWorks brand on both domains. On 12ventures.io
  // that used to fall through to "OtterWorks - Modernize Workforce Learning".
  if (brand.id === '12-ventures' || (is12VenturesHost(hostname) && brand.id === 'otterworks')) {
    return VENTURES_PAGE_TITLE;
  }
  return `${brand.name} - ${brand.subtitle ?? 'Modernize Workforce Learning'}`;
}
