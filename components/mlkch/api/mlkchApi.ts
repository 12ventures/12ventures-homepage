import type {
  DashboardSection,
  Initiative,
  InitiativeMetric,
  InitiativeSectionRef,
  InitiativeSectionSlug,
  InitiativeStatus,
  MetricAccent,
  MilestoneChild,
  MilestoneItem,
  MilestoneLink,
  TopMetric,
} from '../data/initiatives';
import type {
  DashboardOverview,
  FinancialSummary,
  OverviewMetric,
  OverviewSectionCount,
} from '../data/overview';

// Temporary: hardcoded for deploy simplicity — move back to VITE_* env vars later
const BASE = 'https://api-staging.snapskill.io/api/v1';
const KEY = 'o0TTLk0wdVZUXZ2jh8qLfnIh3JimYD03';

export type {
  DashboardOverview,
  FinancialSummary,
  OverviewMetric,
  OverviewSectionCount,
} from '../data/overview';

type ApiOverviewSectionCount = {
  section_id: string;
  section_label: string;
  section_slug: string;
  count: number;
};

type ApiOverviewMetric = {
  label: string;
  value: string;
  roi_related: boolean;
  source_initiative_ids: string[];
};

type ApiFinancialContribution = {
  initiative_id: string;
  title: string;
  label: string;
  value: string;
  raw: number;
};

type ApiFinancialSummaryItem = {
  label: string;
  total_raw: number;
  display_value: string;
  initiative_count: number;
  has_estimates: boolean;
  contributions: ApiFinancialContribution[];
};

type ApiFinancialSummary = {
  realized_roi: ApiFinancialSummaryItem;
  projected_value: ApiFinancialSummaryItem;
  projected_savings: ApiFinancialSummaryItem;
  combined_total: ApiFinancialSummaryItem;
};

type ApiOverview = {
  company_name: string;
  total_initiatives: number;
  by_section: ApiOverviewSectionCount[];
  by_status: Record<InitiativeStatus, number>;
  top_metrics: ApiOverviewMetric[];
  all_metrics: ApiOverviewMetric[];
  tags: string[];
  financial_summary?: ApiFinancialSummary | null;
  last_updated: string;
};

function mapFinancialContributionFromApi(raw: ApiFinancialContribution) {
  return {
    initiativeId: raw.initiative_id,
    title: raw.title,
    label: raw.label,
    value: raw.value,
    raw: raw.raw,
  };
}

function mapFinancialSummaryItemFromApi(raw: ApiFinancialSummaryItem) {
  return {
    label: raw.label,
    totalRaw: raw.total_raw,
    displayValue: raw.display_value,
    initiativeCount: raw.initiative_count,
    hasEstimates: raw.has_estimates,
    contributions: (raw.contributions ?? []).map(mapFinancialContributionFromApi),
  };
}

function mapFinancialSummaryFromApi(raw: ApiFinancialSummary): FinancialSummary {
  return {
    realizedRoi: mapFinancialSummaryItemFromApi(raw.realized_roi),
    projectedValue: mapFinancialSummaryItemFromApi(raw.projected_value),
    projectedSavings: mapFinancialSummaryItemFromApi(raw.projected_savings),
    combinedTotal: mapFinancialSummaryItemFromApi(raw.combined_total),
  };
}

function mapOverviewMetricFromApi(raw: ApiOverviewMetric): OverviewMetric {
  return {
    label: raw.label,
    value: raw.value,
    roiRelated: raw.roi_related,
    sourceInitiativeIds: raw.source_initiative_ids ?? [],
  };
}

export function mapOverviewFromApi(raw: ApiOverview): DashboardOverview {
  return {
    companyName: raw.company_name,
    totalInitiatives: raw.total_initiatives,
    bySection: (raw.by_section ?? []).map((row) => ({
      sectionId: row.section_id,
      sectionLabel: row.section_label,
      sectionSlug: row.section_slug,
      count: row.count,
    })),
    byStatus: raw.by_status ?? { active: 0, planning: 0, backlog: 0 },
    topMetrics: (raw.top_metrics ?? []).map(mapOverviewMetricFromApi),
    allMetrics: (raw.all_metrics ?? []).map(mapOverviewMetricFromApi),
    tags: raw.tags ?? [],
    financialSummary: raw.financial_summary
      ? mapFinancialSummaryFromApi(raw.financial_summary)
      : null,
    lastUpdated: raw.last_updated,
  };
}

export const isMlkchApiConfigured = Boolean(BASE && KEY);

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

export interface InitiativeInput {
  title: string;
  sectionId: string;
  status: InitiativeStatus;
  description: string;
  sortOrder?: number;
  topMetrics: TopMetric[];
  subItems: MilestoneItem[];
  metrics: InitiativeMetric[];
  tags: string[];
  bannerImage?: string | null;
  externalUrl?: string | null;
}

export interface SectionInput {
  label: string;
  slug?: string;
  sortOrder?: number;
  accentColor?: string;
  dotPulse?: boolean;
}

export type SectionPatch = Partial<SectionInput>;

type ApiTopMetric = {
  label: string;
  value: string;
  accent: MetricAccent;
  opens_roi_breakdown?: boolean;
};

type ApiInitiativeMetric = {
  label: string;
  value: string;
  opens_roi_breakdown?: boolean;
};

type ApiMilestoneChild = string | MilestoneLink;
type ApiMilestoneItem =
  | string
  | MilestoneLink
  | { label: string; children: ApiMilestoneChild[] };

type ApiSectionRef = {
  id: string;
  slug: string;
  label: string;
};

type ApiSection = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  accent_color: string;
  dot_pulse: boolean;
  created_at?: string;
  updated_at?: string;
};

type ApiInitiative = {
  id: string;
  title: string;
  section_id: string;
  section: ApiSectionRef;
  status: InitiativeStatus;
  description: string;
  sort_order: number;
  top_metrics: ApiTopMetric[];
  sub_items: ApiMilestoneItem[];
  metrics: ApiInitiativeMetric[];
  tags: string[];
  banner_image: string | null;
  external_url: string | null;
  created_at?: string;
  updated_at?: string;
};

function headers(): Record<string, string> {
  return {
    'X-Dashboard-Key': KEY ?? '',
    'Content-Type': 'application/json',
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE || !KEY) {
    throw new Error('MLKCH API is not configured.');
  }

  const res = await fetch(`${BASE}/twelve-ventures/mlkch${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers as Record<string, string> | undefined) },
  });

  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(res.statusText || 'Request failed');
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }

  return json.data;
}

function mapTopMetricFromApi(m: ApiTopMetric): TopMetric {
  return {
    label: m.label,
    value: m.value,
    accent: m.accent,
    ...(m.opens_roi_breakdown ? { opensRoiBreakdown: true } : {}),
  };
}

function mapMetricFromApi(m: ApiInitiativeMetric): InitiativeMetric {
  return {
    label: m.label,
    value: m.value,
    ...(m.opens_roi_breakdown ? { opensRoiBreakdown: true } : {}),
  };
}

function mapMilestoneChildFromApi(item: ApiMilestoneChild): MilestoneChild {
  return item;
}

function mapMilestoneItemFromApi(item: ApiMilestoneItem): MilestoneItem {
  if (typeof item === 'string') return item;
  if ('children' in item) {
    return {
      label: item.label,
      children: item.children.map(mapMilestoneChildFromApi),
    };
  }
  return item;
}

function mapSectionRefFromApi(raw: ApiSectionRef): InitiativeSectionRef {
  return {
    id: raw.id,
    slug: raw.slug,
    label: raw.label,
  };
}

export function mapSectionFromApi(raw: ApiSection): DashboardSection {
  return {
    id: raw.id,
    slug: raw.slug,
    label: raw.label,
    sortOrder: raw.sort_order,
    accentColor: raw.accent_color,
    dotPulse: raw.dot_pulse,
  };
}

export function mapInitiativeFromApi(raw: ApiInitiative): Initiative {
  return {
    id: raw.id,
    title: raw.title,
    sectionId: raw.section_id,
    section: mapSectionRefFromApi(raw.section),
    status: raw.status,
    description: raw.description,
    sortOrder: raw.sort_order,
    topMetrics: (raw.top_metrics ?? []).map(mapTopMetricFromApi),
    subItems: (raw.sub_items ?? []).map(mapMilestoneItemFromApi),
    metrics: (raw.metrics ?? []).map(mapMetricFromApi),
    tags: raw.tags ?? [],
    bannerImage: raw.banner_image ?? undefined,
    externalUrl: raw.external_url ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapTopMetricToApi(m: TopMetric): ApiTopMetric {
  return {
    label: m.label,
    value: m.value,
    accent: m.accent,
    opens_roi_breakdown: m.opensRoiBreakdown ?? false,
  };
}

function mapMetricToApi(m: InitiativeMetric): ApiInitiativeMetric {
  return {
    label: m.label,
    value: m.value,
    opens_roi_breakdown: m.opensRoiBreakdown ?? false,
  };
}

function mapMilestoneChildToApi(item: MilestoneChild): ApiMilestoneChild {
  return item;
}

function mapMilestoneItemToApi(item: MilestoneItem): ApiMilestoneItem {
  if (typeof item === 'string') return item;
  if ('children' in item) {
    return {
      label: item.label,
      children: item.children.map(mapMilestoneChildToApi),
    };
  }
  return item;
}

function mapSectionToApi(input: SectionInput): Record<string, unknown> {
  return {
    label: input.label,
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.accentColor !== undefined ? { accent_color: input.accentColor } : {}),
    ...(input.dotPulse !== undefined ? { dot_pulse: input.dotPulse } : {}),
  };
}

function mapSectionPatchToApi(patch: SectionPatch): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.label !== undefined) body.label = patch.label;
  if (patch.slug !== undefined) body.slug = patch.slug;
  if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
  if (patch.accentColor !== undefined) body.accent_color = patch.accentColor;
  if (patch.dotPulse !== undefined) body.dot_pulse = patch.dotPulse;
  return body;
}

export function mapInitiativeToApi(input: InitiativeInput): Omit<ApiInitiative, 'id' | 'created_at' | 'updated_at' | 'section'> {
  return {
    title: input.title,
    section_id: input.sectionId,
    status: input.status,
    description: input.description,
    sort_order: input.sortOrder ?? 0,
    top_metrics: input.topMetrics.map(mapTopMetricToApi),
    sub_items: input.subItems.map(mapMilestoneItemToApi),
    metrics: input.metrics.map(mapMetricToApi),
    tags: input.tags,
    banner_image: input.bannerImage ?? null,
    external_url: input.externalUrl ?? null,
  };
}

export function initiativeToInput(initiative: Initiative): InitiativeInput {
  return {
    title: initiative.title,
    sectionId: initiative.sectionId,
    status: initiative.status,
    description: initiative.description,
    sortOrder: initiative.sortOrder ?? 0,
    topMetrics: initiative.topMetrics ?? [],
    subItems: initiative.subItems ?? [],
    metrics: initiative.metrics ?? [],
    tags: initiative.tags ?? [],
    bannerImage: initiative.bannerImage ?? null,
    externalUrl: initiative.externalUrl ?? null,
  };
}

export type InitiativePatch = Partial<{
  title: string;
  sectionId: string;
  sectionSlug: InitiativeSectionSlug;
  status: InitiativeStatus;
  description: string;
  sortOrder: number;
  topMetrics: TopMetric[];
  subItems: MilestoneItem[];
  metrics: InitiativeMetric[];
  tags: string[];
  bannerImage: string | null;
  externalUrl: string | null;
}>;

type ApiInitiativePatch = Partial<
  Omit<ApiInitiative, 'id' | 'created_at' | 'updated_at' | 'section'>
> & {
  section_slug?: InitiativeSectionSlug;
};

function mapPartialToApi(patch: InitiativePatch): ApiInitiativePatch {
  const body: ApiInitiativePatch = {};

  if (patch.title !== undefined) body.title = patch.title;
  if (patch.sectionId !== undefined) body.section_id = patch.sectionId;
  if (patch.sectionSlug !== undefined) body.section_slug = patch.sectionSlug;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
  if (patch.topMetrics !== undefined) body.top_metrics = patch.topMetrics.map(mapTopMetricToApi);
  if (patch.subItems !== undefined) body.sub_items = patch.subItems.map(mapMilestoneItemToApi);
  if (patch.metrics !== undefined) body.metrics = patch.metrics.map(mapMetricToApi);
  if (patch.tags !== undefined) body.tags = patch.tags;
  if (patch.bannerImage !== undefined) body.banner_image = patch.bannerImage;
  if (patch.externalUrl !== undefined) body.external_url = patch.externalUrl;

  return body;
}

export const mlkchApi = {
  listSections: async () => {
    const data = await request<{ items: ApiSection[]; total: number }>('/sections');
    return {
      items: data.items.map(mapSectionFromApi).sort((a, b) => a.sortOrder - b.sortOrder),
      total: data.total,
    };
  },

  createSection: async (body: SectionInput) => {
    const data = await request<ApiSection>('/sections', {
      method: 'POST',
      body: JSON.stringify(mapSectionToApi(body)),
    });
    return mapSectionFromApi(data);
  },

  patchSection: async (id: string, body: SectionPatch) => {
    const data = await request<ApiSection>(`/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(mapSectionPatchToApi(body)),
    });
    return mapSectionFromApi(data);
  },

  removeSection: async (id: string) => {
    return request<{ id: string }>(`/sections/${id}`, { method: 'DELETE' });
  },

  list: async () => {
    const data = await request<{ items: ApiInitiative[]; total: number }>('/initiatives');
    return {
      items: data.items.map(mapInitiativeFromApi),
      total: data.total,
    };
  },

  get: async (id: string) => {
    const data = await request<ApiInitiative>(`/initiatives/${id}`);
    return mapInitiativeFromApi(data);
  },

  create: async (body: InitiativeInput) => {
    const data = await request<ApiInitiative>('/initiatives', {
      method: 'POST',
      body: JSON.stringify(mapInitiativeToApi(body)),
    });
    return mapInitiativeFromApi(data);
  },

  update: async (id: string, body: InitiativeInput) => {
    const data = await request<ApiInitiative>(`/initiatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapInitiativeToApi(body)),
    });
    return mapInitiativeFromApi(data);
  },

  patch: async (id: string, body: InitiativePatch) => {
    const data = await request<ApiInitiative>(`/initiatives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(mapPartialToApi(body)),
    });
    return mapInitiativeFromApi(data);
  },

  remove: async (id: string) => {
    return request<{ id: string }>(`/initiatives/${id}`, { method: 'DELETE' });
  },

  getOverview: async () => {
    const data = await request<ApiOverview>('/overview');
    return mapOverviewFromApi(data);
  },
};
