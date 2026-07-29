import type { HavenProductCategory } from './types';

export type TrendRunStatus = 'queued' | 'processing' | 'ready' | 'failed';
export type StepStatus = 'pending' | 'active' | 'done' | 'error' | 'skipped';
export type TrendConfidence = 'high' | 'medium' | 'low';
export type TrendSourceStatus = 'ok' | 'empty' | 'error' | 'skipped';
export type TrendCandidateOrigin = 'catalog' | 'external';

export interface TrendSearchRequest {
  region?: string;
  maxTrends?: number;
  maxCandidatesPerTrend?: number;
  includeExternalCandidates?: boolean;
  includeCatalogMatches?: boolean;
  trigger?: 'manual' | 'scheduled';
}

export interface TrendRunStep {
  key: string;
  label: string;
  status: StepStatus;
  detail: string;
  at?: string | null;
}

export interface TrendSourceChip {
  id: string;
  status: TrendSourceStatus;
  detail: string;
  itemCount: number;
}

export interface TrendSourceLink {
  platform: string;
  label: string;
  url?: string | null;
}

export interface TrendItem {
  id: string;
  title: string;
  summary: string;
  styleTags: string[];
  categoryHints: HavenProductCategory[];
  sources: TrendSourceLink[];
  searchQueries: string[];
  confidence: TrendConfidence;
}

export interface TrendCandidate {
  origin: TrendCandidateOrigin;
  name: string;
  merchant?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  affiliateUrl?: string | null;
  category?: string | null;
  productId?: string | null;
  matchReason: string;
  confidence: TrendConfidence;
  alreadyInCatalog: boolean;
  importReady: boolean;
}

export interface TrendBundle {
  trend: TrendItem;
  candidates: TrendCandidate[];
  suggestedImportQueries: string[];
}

export interface TrendSearchStats {
  trendsFound: number;
  candidatesFound: number;
  catalogMatches: number;
  externalCandidates: number;
}

export interface TrendSearchResult {
  trends: TrendBundle[];
  sourceStatuses: TrendSourceChip[];
  notes: string[];
  stats: TrendSearchStats;
}

export interface TrendRun {
  id: string;
  status: TrendRunStatus;
  progress: number;
  stage: string;
  message: string;
  trigger: 'manual' | 'scheduled';
  request: TrendSearchRequest;
  steps: TrendRunStep[];
  sourceStatuses: TrendSourceChip[];
  result: TrendSearchResult | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface TrendRunStart {
  runId: string;
  status: TrendRunStatus;
  progress: number;
  message: string;
}

export const TREND_RUN_STORAGE_KEY = 'havenTrendRunId';

export const TREND_STEP_FALLBACK: { key: string; label: string }[] = [
  { key: 'gather', label: 'Gather Reddit & web signals' },
  { key: 'normalize', label: 'Normalize furniture trends' },
  { key: 'match_catalog', label: 'Match existing catalog products' },
  { key: 'match_external', label: 'Find external product candidates' },
  { key: 'finalize', label: 'Finalize results' },
];
