/**
 * Company expense ledger — Snapskill /twelve-ventures/expenses.
 * Same host as Haven (VITE_MLKCH_API_URL). Secrets stay on the backend.
 */

const API_BASE =
  (import.meta.env.VITE_MLKCH_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000/api/v1';

const EXPENSES_BASE = `${API_BASE}/twelve-ventures/expenses`;
const SESSION_KEY = 'tv_expenses_dashboard_key';

export type AutomationTier = 'automated' | 'semi_automated' | 'manual';
export type VendorStatus = 'active' | 'cancelled' | 'paused';

export interface ExpenseVendorSubtotal {
  provider: string;
  vendor_name: string;
  amount_usd: number;
  automation_tier: AutomationTier;
  line_item_count: number;
  share_pct: number;
  stale: boolean;
}

export interface ExpenseSummary {
  month: string;
  total_usd: number;
  previous_month_usd: number;
  mom_delta_usd: number;
  mom_delta_pct: number | null;
  automated_usd: number;
  semi_automated_usd: number;
  manual_usd: number;
  coverage_automated_pct: number;
  vendor_count: number;
  vendors: ExpenseVendorSubtotal[];
  history: { month: string; total_usd: number }[];
  vantage_configured: boolean;
  digitalocean_configured: boolean;
  last_sync_at: string | null;
}

export interface ExpenseVendor {
  id: string;
  vendor_name: string;
  provider: string;
  category: string;
  billing_model: string;
  automation_tier: AutomationTier;
  integration_method: string;
  owner: string;
  status: VendorStatus;
  plan_notes: string | null;
  added_at: string | null;
  status_changed_at: string | null;
  last_manual_update: string | null;
}

export interface ExpenseLineItem {
  id: string;
  billing_period_start: string;
  billing_period_end: string;
  provider: string;
  service_category: string;
  resource_or_sku: string | null;
  amount_usd: number;
  source: string;
  automation_tier: AutomationTier;
  ingested_at: string | null;
  notes: string | null;
}

export interface ExpenseVendorDetail {
  provider: string;
  vendor_name: string;
  month: string;
  total_usd: number;
  automation_tier: AutomationTier;
  items: ExpenseLineItem[];
}

export interface ExpenseSyncResult {
  vantage_upserted: number;
  vantage_skipped: number;
  vantage_error: string | null;
  digitalocean_upserted: number;
  digitalocean_error: string | null;
  vendors_created: number;
}

export interface ExpenseStatus {
  ok: boolean;
  vantage_configured: boolean;
  digitalocean_configured: boolean;
  last_sync_at: string | null;
  vendor_count: number;
  line_item_count: number;
}

export interface ManualEntryPayload {
  vendor_name: string;
  provider?: string;
  service_category: string;
  amount_usd: number;
  billing_period_start: string;
  notes?: string;
}

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export class ExpenseApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getStoredExpenseKey(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function storeExpenseKey(key: string): void {
  sessionStorage.setItem(SESSION_KEY, key);
}

export function clearExpenseKey(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = getStoredExpenseKey();
  if (!key) {
    throw new ExpenseApiError('Not authenticated', 401);
  }
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Dashboard-Key', key);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${EXPENSES_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || body.message || detail;
    } catch {
      /* ignore */
    }
    throw new ExpenseApiError(detail, res.status);
  }
  const payload = (await res.json()) as Envelope<T>;
  return payload.data;
}

export const expenseLedgerService = {
  async unlock(key: string): Promise<ExpenseStatus> {
    storeExpenseKey(key.trim());
    try {
      return await request<ExpenseStatus>('/status');
    } catch (err) {
      clearExpenseKey();
      throw err;
    }
  },

  getSummary(month: string) {
    return request<ExpenseSummary>(`/summary?month=${encodeURIComponent(month)}`);
  },

  getVendors() {
    return request<{ items: ExpenseVendor[]; total: number }>('/vendors');
  },

  getVendorDetail(provider: string, month: string) {
    return request<ExpenseVendorDetail>(
      `/vendor/${encodeURIComponent(provider)}/detail?month=${encodeURIComponent(month)}`,
    );
  },

  sync(month: string) {
    return request<ExpenseSyncResult>(`/sync?month=${encodeURIComponent(month)}`, {
      method: 'POST',
    });
  },

  createManualEntry(payload: ManualEntryPayload) {
    return request<ExpenseLineItem>('/manual-entry', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
