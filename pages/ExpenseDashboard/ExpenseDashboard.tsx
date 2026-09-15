import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import ExpensePasswordGate from '../../components/expenses/ExpensePasswordGate';
import {
  expenseLedgerService,
  type ExpenseSummary,
  type ExpenseVendor,
  type ExpenseVendorDetail,
} from '../../services/expenseLedgerService';
import VendorDetailModal from './VendorDetailModal';
import VendorRegistryTable from './VendorRegistryTable';
import './ExpenseDashboard.css';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function tierClass(tier: string): string {
  if (tier === 'automated') return 'ex-badge ex-badge--auto';
  if (tier === 'semi_automated') return 'ex-badge ex-badge--semi';
  return 'ex-badge ex-badge--manual';
}

function tierLabel(tier: string): string {
  if (tier === 'automated') return 'Live';
  if (tier === 'semi_automated') return 'Scripted';
  return 'Manual';
}

const ExpenseDashboardInner: React.FC = () => {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [vendors, setVendors] = useState<ExpenseVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [detail, setDetail] = useState<ExpenseVendorDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [entryName, setEntryName] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCategory, setEntryCategory] = useState('Subscription');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sum, registry] = await Promise.all([
        expenseLedgerService.getSummary(month),
        expenseLedgerService.getVendors(),
      ]);
      setSummary(sum);
      setVendors(registry.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load expenses.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(
    () =>
      (summary?.history ?? []).map((row) => ({
        ...row,
        label: row.month.slice(5),
      })),
    [summary],
  );

  const openVendor = async (provider: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(false);
    try {
      setDetail(await expenseLedgerService.getVendorDetail(provider, month));
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncNote('');
    try {
      const result = await expenseLedgerService.sync(month);
      const bits = [
        `Vantage: ${result.vantage_upserted} rows`,
        result.digitalocean_upserted ? `DigitalOcean: ${result.digitalocean_upserted}` : '',
        result.vantage_error ? `Vantage note: ${result.vantage_error}` : '',
        result.digitalocean_error ? `DO note: ${result.digitalocean_error}` : '',
      ].filter(Boolean);
      setSyncNote(bits.join(' · '));
      await load();
    } catch (err) {
      setSyncNote(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(entryAmount);
    if (!entryName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    await expenseLedgerService.createManualEntry({
      vendor_name: entryName.trim(),
      service_category: entryCategory.trim() || 'Subscription',
      amount_usd: amount,
      billing_period_start: `${month}-01`,
    });
    setEntryName('');
    setEntryAmount('');
    await load();
  };

  const momClass =
    (summary?.mom_delta_usd ?? 0) > 0 ? 'up' : (summary?.mom_delta_usd ?? 0) < 0 ? 'down' : '';

  return (
    <div className="ex-root">
      <div className="ex-inner">
        <header className="ex-top">
          <div>
            <p className="ex-kicker">12 Ventures</p>
            <h1 className="ex-title">Company expenses</h1>
            <p className="ex-sub">Every service, this month, with what we can and cannot auto-track.</p>
          </div>
          <div className="ex-actions">
            <div className="ex-month">
              <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
                <FiChevronLeft />
              </button>
              <span>{monthLabel(month)}</span>
              <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">
                <FiChevronRight />
              </button>
            </div>
            <button type="button" className="ex-btn ex-btn--ghost" onClick={() => void load()}>
              Refresh
            </button>
            <button
              type="button"
              className="ex-btn ex-btn--primary"
              onClick={() => void handleSync()}
              disabled={syncing}
            >
              <FiRefreshCw style={{ marginRight: 6, verticalAlign: '-2px' }} />
              {syncing ? 'Syncing…' : 'Sync providers'}
            </button>
          </div>
        </header>

        {syncNote && <div className="ex-banner">{syncNote}</div>}
        {summary && !summary.vantage_configured && (
          <div className="ex-banner warn">
            Vantage is not connected yet. Manual entries still work. Add VANTAGE_API_TOKEN on Snapskill to auto-pull AWS, GCP, OpenAI, Cursor, ElevenLabs, and Twilio.
          </div>
        )}

        {loading && <div className="ex-loading">Loading expenses…</div>}
        {!loading && error && <div className="ex-error">{error}</div>}

        {!loading && !error && summary && (
          <>
            <section className="ex-stats">
              <div className="ex-card">
                <span className="ex-stat-label">This month</span>
                <AnimatedNumber
                  value={summary.total_usd}
                  decimals={2}
                  prefix="$"
                  className="ex-stat-value"
                />
                <p className={`ex-stat-note ${momClass}`}>
                  {summary.mom_delta_usd >= 0 ? '+' : ''}
                  {money(summary.mom_delta_usd)} vs last month
                </p>
              </div>
              <div className="ex-card">
                <span className="ex-stat-label">Automated coverage</span>
                <AnimatedNumber
                  value={summary.coverage_automated_pct}
                  decimals={1}
                  suffix="%"
                  className="ex-stat-value"
                />
                <p className="ex-stat-note">{money(summary.automated_usd)} live from APIs</p>
              </div>
              <div className="ex-card">
                <span className="ex-stat-label">Manual / unknown</span>
                <AnimatedNumber
                  value={summary.manual_usd}
                  decimals={2}
                  prefix="$"
                  className="ex-stat-value"
                />
                <p className="ex-stat-note">{money(summary.semi_automated_usd)} scripted (DO)</p>
              </div>
              <div className="ex-card">
                <span className="ex-stat-label">Services tracked</span>
                <AnimatedNumber value={summary.vendor_count} className="ex-stat-value" />
                <p className="ex-stat-note">
                  {summary.last_sync_at
                    ? `Last sync ${new Date(summary.last_sync_at).toLocaleString()}`
                    : 'No sync yet'}
                </p>
              </div>
            </section>

            <section className="ex-grid">
              <div className="ex-card">
                <h2>Spend by month</h2>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#12151d',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10,
                        }}
                        formatter={(value) => money(Number(value))}
                      />
                      <Bar dataKey="total_usd" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="ex-card">
                <h2>This month by service</h2>
                {summary.vendors.filter((v) => v.amount_usd > 0).length === 0 && (
                  <p className="ex-sub">Nothing recorded for this month yet. Sync providers or add a manual row.</p>
                )}
                {summary.vendors
                  .filter((v) => v.amount_usd > 0 || v.stale)
                  .map((vendor) => (
                    <div
                      key={vendor.provider}
                      className="ex-vendor-row"
                      onClick={() => void openVendor(vendor.provider)}
                    >
                      <div>
                        <div className="ex-vendor-name">{vendor.vendor_name}</div>
                        <div className="ex-vendor-meta">
                          <span className={tierClass(vendor.automation_tier)}>
                            {tierLabel(vendor.automation_tier)}
                          </span>
                          {vendor.stale && <span className="ex-badge ex-badge--stale">Needs update</span>}
                        </div>
                      </div>
                      <div className="ex-vendor-amt">{money(vendor.amount_usd)}</div>
                      <div className="ex-bar">
                        <span style={{ width: `${Math.min(vendor.share_pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section className="ex-card" style={{ marginBottom: 12 }}>
              <h2>Add a manual cost</h2>
              <p className="ex-sub">Google Workspace, domains, and anything without an API.</p>
              <form className="ex-form" onSubmit={(e) => void handleManual(e)}>
                <input
                  placeholder="Vendor (e.g. Google Workspace)"
                  value={entryName}
                  onChange={(e) => setEntryName(e.target.value)}
                />
                <input
                  placeholder="Category"
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value)}
                />
                <input
                  placeholder="Amount USD"
                  inputMode="decimal"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                />
                <button type="submit" className="ex-btn ex-btn--primary">
                  Save
                </button>
              </form>
            </section>

            <section className="ex-card">
              <h2>All known services</h2>
              <p className="ex-sub" style={{ marginBottom: 12 }}>
                Cancelled tools stay listed so nothing silently disappears.
              </p>
              <VendorRegistryTable vendors={vendors} />
            </section>
          </>
        )}
      </div>

      {detailOpen && (
        <VendorDetailModal
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
};

const ExpenseDashboard: React.FC = () => (
  <ExpensePasswordGate>
    <ExpenseDashboardInner />
  </ExpensePasswordGate>
);

export default ExpenseDashboard;
