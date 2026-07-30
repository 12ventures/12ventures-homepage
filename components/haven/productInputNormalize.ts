/**
 * Normalize messy pasted product fields for Haven admin create/import.
 *
 * Dimensions API contract:
 * - Prefer structured { width, depth, height, unit? } (values as strings)
 * - Else send plain string; backend stores as { raw: "..." }
 * - Responses always return the object form (structured and/or raw)
 */

/** Structured payload matching backend preferred shape. */
export type ProductDimensionsPayload = {
  width?: string;
  depth?: string;
  height?: string;
  unit?: string;
};

function asDimensionToken(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }
  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/[^\d.\-]/g, '')
    .trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
}

function detectUnit(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/\bcm\b|centimet/.test(t)) return 'cm';
  if (/\bmm\b|millimet/.test(t)) return 'mm';
  if (/\bin(?:ch(?:es)?)?\b|"|″|''/.test(t)) return 'in';
  return undefined;
}

function fromObject(raw: Record<string, unknown>): ProductDimensionsPayload | null {
  const nested =
    raw.overall && typeof raw.overall === 'object' && !Array.isArray(raw.overall)
      ? (raw.overall as Record<string, unknown>)
      : raw;

  const width = asDimensionToken(
    nested.width ?? nested.w ?? nested.widthIn ?? nested.width_in,
  );
  const depth = asDimensionToken(
    nested.depth ??
      nested.d ??
      nested.length ??
      nested.l ??
      nested.depthIn ??
      nested.depth_in,
  );
  const height = asDimensionToken(
    nested.height ?? nested.h ?? nested.heightIn ?? nested.height_in,
  );

  if (width == null && depth == null && height == null) return null;

  const unitRaw = String(raw.unit ?? raw.units ?? nested.unit ?? '').trim();
  const out: ProductDimensionsPayload = {};
  if (width != null) out.width = width;
  if (depth != null) out.depth = depth;
  if (height != null) out.height = height;
  if (unitRaw) out.unit = unitRaw.toLowerCase().startsWith('cm')
    ? 'cm'
    : unitRaw.toLowerCase().startsWith('mm')
      ? 'mm'
      : unitRaw.toLowerCase().startsWith('in') || unitRaw === '"'
        ? 'in'
        : unitRaw;
  return out;
}

/**
 * Best-effort for create/import:
 * 1) structured { width, depth, height, unit? } when we can parse
 * 2) otherwise the trimmed plain string (backend stores as { raw })
 * 3) null when empty
 */
export function resolveDimensionsForApi(
  raw: unknown,
): ProductDimensionsPayload | string | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const structured = fromObject(o);
    if (structured) return structured;
    const free = o.raw != null ? String(o.raw).trim() : '';
    return free || null;
  }
  const text = String(raw).trim();
  if (!text) return null;
  return parseDimensions(text) ?? text;
}

/**
 * Parse freeform dimension text from retailer pages, e.g.:
 * - 27.5" w x 25.5" d x 36" h
 * - 70 x 65 x 91 cm
 * - Overall: 213cm w x 102cm d x 83cm h
 * - W: 27.5 D: 25.5 H: 36
 */
export function parseDimensions(raw: unknown): ProductDimensionsPayload | null {
  if (raw == null || raw === '') return null;

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return fromObject(raw as Record<string, unknown>);
  }

  const text = String(raw).trim();
  if (!text) return null;

  if (text.startsWith('{')) {
    try {
      return parseDimensions(JSON.parse(text) as unknown);
    } catch {
      /* fall through */
    }
  }

  const unit = detectUnit(text) ?? 'in';
  const labeled: Partial<Record<'width' | 'depth' | 'height', string>> = {};

  const labelPatterns: Array<[keyof typeof labeled, RegExp]> = [
    ['width', /(?:\bwidth\b|\bw\b)\s*[:=]?\s*([\d.,]+)/i],
    ['depth', /(?:\bdepth\b|\bd\b|\blength\b|\bl\b)\s*[:=]?\s*([\d.,]+)/i],
    ['height', /(?:\bheight\b|\bh\b)\s*[:=]?\s*([\d.,]+)/i],
  ];

  for (const [key, re] of labelPatterns) {
    const m = text.match(re);
    if (m) {
      const n = asDimensionToken(m[1]);
      if (n != null) labeled[key] = n;
    }
  }

  // "27.5" w x 25.5" d x 36" h" / "27.5W x 25.5D x 36H"
  const tagged = [
    ...text.matchAll(
      /([\d.,]+)\s*(?:["″]|in(?:ch(?:es)?)?|cm|mm)?\s*([wdhl]|width|depth|height|length)\b/gi,
    ),
  ];
  for (const m of tagged) {
    const n = asDimensionToken(m[1]);
    if (n == null) continue;
    const tag = m[2].toLowerCase();
    if (tag === 'w' || tag === 'width') labeled.width = n;
    else if (tag === 'd' || tag === 'depth' || tag === 'l' || tag === 'length') {
      labeled.depth = n;
    } else if (tag === 'h' || tag === 'height') labeled.height = n;
  }

  if (labeled.width != null || labeled.depth != null || labeled.height != null) {
    return {
      ...(labeled.width != null ? { width: labeled.width } : {}),
      ...(labeled.depth != null ? { depth: labeled.depth } : {}),
      ...(labeled.height != null ? { height: labeled.height } : {}),
      unit,
    };
  }

  // Bare triple: 27.5 x 25.5 x 36  → width × depth × height
  const nums = [...text.matchAll(/([\d]+(?:[.,]\d+)?)/g)]
    .map((m) => asDimensionToken(m[1]))
    .filter((n): n is string => n != null);
  if (nums.length >= 3) {
    return { width: nums[0], depth: nums[1], height: nums[2], unit };
  }
  if (nums.length === 2) {
    return { width: nums[0], height: nums[1], unit };
  }
  // Single number alone (e.g. 5") is too ambiguous to force into width —
  // keep as freeform string via resolveDimensionsForApi.
  return null;
}

/** Pretty string for form/display from API object (incl. { raw }) or paste text. */
export function formatDimensions(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const structured = fromObject(o);
    if (structured) {
      const unit = (structured.unit ?? 'in').toLowerCase();
      const unitSuffix =
        unit.startsWith('cm') ? ' cm' : unit.startsWith('mm') ? ' mm' : '"';
      const bits: string[] = [];
      if (structured.width != null) bits.push(`${structured.width}${unitSuffix} w`);
      if (structured.depth != null) bits.push(`${structured.depth}${unitSuffix} d`);
      if (structured.height != null) bits.push(`${structured.height}${unitSuffix} h`);
      if (bits.length) return bits.join(' x ');
    }
    if (o.raw != null && String(o.raw).trim()) return String(o.raw).trim();
  }
  return '';
}

/** Strip currency symbols / commas; return null if empty or invalid. */
export function normalizePrice(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  let s = String(raw).replace(/[^\d.,\-]/g, '').trim();
  if (!s) return null;
  // US 1,234.56
  if (/,/.test(s) && /\./.test(s)) s = s.replace(/,/g, '');
  // US thousands without decimals: 1,234
  else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  // EU 1.234,56
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeUrl(raw: unknown): string {
  return normalizeText(raw);
}
