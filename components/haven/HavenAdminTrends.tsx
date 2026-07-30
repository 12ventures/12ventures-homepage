import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  FaGlobe,
  FaInstagram,
  FaRedditAlien,
  FaSearch,
  FaTiktok,
} from 'react-icons/fa';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import { havenAdminClient } from './api/havenAdminClient';
import type {
  TrendBundle,
  TrendCandidate,
  TrendRun,
  TrendRunStatus,
  TrendSourceChip,
} from './trendTypes';
import { TREND_RUN_STORAGE_KEY, TREND_STEP_FALLBACK } from './trendTypes';

const POLL_FAST_MS = 2000;
const POLL_SLOW_MS = 5000;
const POLL_BACKOFF_AFTER_MS = 30_000;

function isActiveStatus(status: TrendRunStatus): boolean {
  return status === 'queued' || status === 'processing';
}

function formatWhen(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: TrendRunStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'processing':
      return 'Running';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

function sourceLabel(id: string): string {
  if (id === 'reddit') return 'Reddit';
  if (id === 'gemini_search') return 'Web search';
  return id.replace(/_/g, ' ');
}

function TrendSourceIcon({
  platform,
  label,
}: {
  platform?: string | null;
  label?: string | null;
}) {
  const key = `${platform ?? ''} ${label ?? ''}`.toLowerCase();
  const size = 13;
  if (key.includes('tiktok')) return <FaTiktok size={size} aria-hidden="true" />;
  if (key.includes('instagram') || key.includes('insta')) {
    return <FaInstagram size={size} aria-hidden="true" />;
  }
  if (key.includes('reddit')) return <FaRedditAlien size={size} aria-hidden="true" />;
  if (
    key.includes('web') ||
    key.includes('www') ||
    key.includes('http') ||
    key.includes('globe') ||
    key.includes('gemini')
  ) {
    return key.includes('gemini') || key.includes('search') ? (
      <FaSearch size={size} aria-hidden="true" />
    ) : (
      <FaGlobe size={size} aria-hidden="true" />
    );
  }
  if (key.includes('search')) return <FaSearch size={size} aria-hidden="true" />;
  return <FaGlobe size={size} aria-hidden="true" />;
}

function persistRunId(runId: string | null) {
  try {
    if (runId) localStorage.setItem(TREND_RUN_STORAGE_KEY, runId);
    else localStorage.removeItem(TREND_RUN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    const url = new URL(window.location.href);
    if (runId) url.searchParams.set('trendRun', runId);
    else url.searchParams.delete('trendRun');
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* ignore */
  }
}

function readPersistedRunId(): string | null {
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('trendRun');
    if (fromUrl?.trim()) return fromUrl.trim();
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem(TREND_RUN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function CandidateCard({
  candidate,
  busy,
  onImportUrl,
  onViewProduct,
}: {
  candidate: TrendCandidate;
  busy: boolean;
  onImportUrl: (url: string) => void;
  onViewProduct: (productId: string) => void;
}) {
  const inCatalog =
    candidate.alreadyInCatalog ||
    candidate.origin === 'catalog' ||
    Boolean(candidate.productId);
  const canImport =
    !inCatalog &&
    candidate.origin === 'external' &&
    Boolean(candidate.affiliateUrl?.trim()) &&
    candidate.importReady;
  const price =
    candidate.price != null && Number.isFinite(candidate.price)
      ? `$${Math.round(candidate.price)}`
      : null;

  return (
    <article className="hv-admin__trend-candidate">
      <div className="hv-admin__trend-candidate-media" aria-hidden={!candidate.imageUrl}>
        {candidate.imageUrl ? (
          <img src={candidate.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="hv-admin__trend-candidate-ph">No image</span>
        )}
      </div>
      <div className="hv-admin__trend-candidate-body">
        <p className="hv-admin__trend-candidate-name">{candidate.name || 'Untitled'}</p>
        <p className="hv-admin__trend-candidate-meta">
          {[
            candidate.origin === 'catalog' ? 'Catalog' : 'External',
            candidate.merchant,
            price,
            candidate.category,
            candidate.confidence,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {candidate.matchReason ? (
          <p className="hv-admin__trend-candidate-reason">{candidate.matchReason}</p>
        ) : null}
        <div className="hv-admin__trend-candidate-actions">
          {inCatalog && candidate.productId ? (
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
              disabled={busy}
              onClick={() => onViewProduct(candidate.productId!)}
            >
              View in catalog
            </button>
          ) : null}
          {canImport ? (
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--primary hv-admin__btn--compact"
              disabled={busy}
              onClick={() => onImportUrl(candidate.affiliateUrl!.trim())}
            >
              Import from URL
            </button>
          ) : null}
          {!inCatalog && !canImport ? (
            <span className="hv-admin__trend-candidate-hint">
              {candidate.affiliateUrl
                ? 'Not import-ready — paste URL in Add product'
                : 'No product URL — paste manually in Add product'}
            </span>
          ) : null}
          {candidate.affiliateUrl ? (
            <a
              className="hv-admin__trend-ext-link"
              href={candidate.affiliateUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open link
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 11.5L6.2 7.8l2.3 2.3L13.5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 5H13.5V9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendResultCard({
  bundle,
  rank,
  busy,
  onImportUrl,
  onViewProduct,
  onImportQueries,
}: {
  bundle: TrendBundle;
  rank: number;
  busy: boolean;
  onImportUrl: (url: string) => void;
  onViewProduct: (productId: string) => void;
  onImportQueries: (queries: string[]) => void;
}) {
  const { trend, candidates, suggestedImportQueries } = bundle;
  return (
    <article className="hv-admin__trend-card">
      <header className="hv-admin__trend-card-head">
        <div className="hv-admin__trend-card-main">
          <h3 className="hv-admin__trend-card-title">
            <span className="hv-admin__trend-card-rank" aria-label={`Trend ${rank}`}>
              {rank}
            </span>
            <span className="hv-admin__trend-card-title-text">
              {trend.title || 'Untitled trend'}
            </span>
          </h3>
          {trend.summary ? (
            <p className="hv-admin__trend-card-summary">{trend.summary}</p>
          ) : null}
        </div>
        <span
          className={`hv-admin__trend-pill hv-admin__trend-pill--${trend.confidence}`}
        >
          {trend.confidence === 'high' ? <TrendingUpIcon /> : null}
          {trend.confidence}
        </span>
      </header>
      {trend.styleTags.length || trend.categoryHints.length ? (
        <div className="hv-admin__trend-tags">
          {trend.styleTags.map((t) => (
            <span key={`tag-${t}`} className="hv-admin__trend-tag">
              {t}
            </span>
          ))}
          {trend.categoryHints.map((c) => (
            <span key={`cat-${c}`} className="hv-admin__trend-tag hv-admin__trend-tag--cat">
              {c}
            </span>
          ))}
        </div>
      ) : null}
      {trend.sources.length ? (
        <ul className="hv-admin__trend-sources">
          {trend.sources.map((s, i) => {
            const text = s.label || s.platform || 'Source';
            const inner = (
              <>
                <TrendSourceIcon platform={s.platform} label={s.label} />
                <span>{text}</span>
              </>
            );
            return (
              <li key={`${s.platform}-${i}`}>
                {s.url ? (
                  <a
                    className="hv-admin__trend-source-link"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {inner}
                  </a>
                ) : (
                  <span className="hv-admin__trend-source-link">{inner}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {candidates.length === 0 ? (
        <p className="hv-admin__empty" style={{ marginTop: 10 }}>
          No product candidates for this trend.
        </p>
      ) : (
        <div className="hv-admin__trend-candidates">
          {candidates.map((c, i) => (
            <CandidateCard
              key={`${c.name}-${c.productId ?? c.affiliateUrl ?? i}`}
              candidate={c}
              busy={busy}
              onImportUrl={onImportUrl}
              onViewProduct={onViewProduct}
            />
          ))}
        </div>
      )}
      {suggestedImportQueries.length ? (
        <div className="hv-admin__trend-queries">
          <p className="hv-admin__label">Suggested import queries</p>
          <p className="hv-admin__trend-queries-list">
            {suggestedImportQueries.join(', ')}
          </p>
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
            disabled={busy}
            onClick={() => onImportQueries(suggestedImportQueries)}
          >
            Import via queries
          </button>
        </div>
      ) : null}
    </article>
  );
}

function SourceChips({ sources }: { sources: TrendSourceChip[] }) {
  if (!sources.length) return null;
  return (
    <div className="hv-admin__trend-source-chips" aria-label="Signal sources">
      {sources.map((s) => (
        <span
          key={s.id}
          className={`hv-admin__trend-source-chip hv-admin__trend-source-chip--${s.status}`}
          title={s.detail || undefined}
        >
          <TrendSourceIcon platform={s.id} label={sourceLabel(s.id)} />
          <span>
            {sourceLabel(s.id)}
            {s.itemCount > 0 ? ` · ${s.itemCount}` : ''}
            {s.status === 'error' ? ' · error' : ''}
            {s.status === 'empty' ? ' · empty' : ''}
            {s.status === 'skipped' ? ' · skipped' : ''}
          </span>
        </span>
      ))}
    </div>
  );
}

export const HavenAdminTrends: React.FC<{
  busy: string | null;
  onBusy: (key: string | null) => void;
  onError: (msg: string | null) => void;
  onImportUrl: (url: string) => void;
  onViewProduct: (productId: string) => void;
  onImportQueries: (queries: string[]) => void;
}> = ({ busy, onBusy, onError, onImportUrl, onViewProduct, onImportQueries }) => {
  const [history, setHistory] = useState<TrendRun[]>([]);
  const [selected, setSelected] = useState<TrendRun | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [booting, setBooting] = useState(true);
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pollStartedAt = useRef<number | null>(null);
  const pollTimer = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const readyLayoutAppliedRef = useRef<string | null>(null);
  const confirmTitleId = useId();

  const closeConfirm = useCallback(() => {
    if (busy === 'trends-start') return;
    setConfirmOpen(false);
  }, [busy]);
  const confirmBackdrop = useBackdropDismiss(closeConfirm, confirmOpen);

  const applyLayoutForRun = useCallback((run: TrendRun | null) => {
    setNotesExpanded(false);
    if (!run) {
      setStepsExpanded(true);
      setResultsExpanded(false);
      readyLayoutAppliedRef.current = null;
      return;
    }
    if (run.status === 'ready') {
      setStepsExpanded(false);
      setResultsExpanded(true);
      readyLayoutAppliedRef.current = run.id;
      return;
    }
    // Active or failed — show steps; results only appear when ready.
    setStepsExpanded(true);
    setResultsExpanded(false);
    readyLayoutAppliedRef.current = null;
  }, []);

  const clearPoll = useCallback(() => {
    if (pollTimer.current != null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const runs = await havenAdminClient.listTrendRuns({ limit: 30 });
    setHistory(runs);
    return runs;
  }, []);

  const selectRun = useCallback(
    (run: TrendRun | null) => {
      const nextId = run?.id ?? null;
      const idChanged = nextId !== selectedIdRef.current;
      selectedIdRef.current = nextId;
      setSelected(run);
      if (idChanged) applyLayoutForRun(run);
      persistRunId(run && isActiveStatus(run.status) ? run.id : run?.id ?? null);
      if (run && !isActiveStatus(run.status)) {
        // Keep id in URL for deep-link to ready/failed; still fine in storage
        persistRunId(run.id);
      }
    },
    [applyLayoutForRun],
  );

  // When a watched run finishes, collapse steps and expand results once.
  useEffect(() => {
    if (!selected || selected.status !== 'ready') return;
    if (readyLayoutAppliedRef.current === selected.id) return;
    applyLayoutForRun(selected);
  }, [selected, applyLayoutForRun]);

  const schedulePoll = useCallback(
    (runId: string) => {
      clearPoll();
      if (pollStartedAt.current == null) pollStartedAt.current = Date.now();
      const elapsed = Date.now() - (pollStartedAt.current ?? Date.now());
      const delay = elapsed >= POLL_BACKOFF_AFTER_MS ? POLL_SLOW_MS : POLL_FAST_MS;
      pollTimer.current = window.setTimeout(() => {
        void (async () => {
          try {
            const run = await havenAdminClient.getTrendRun(runId);
            if (selectedIdRef.current !== runId) return;
            setSelected(run);
            setHistory((prev) => {
              const rest = prev.filter((r) => r.id !== run.id);
              return [run, ...rest];
            });
            if (isActiveStatus(run.status)) {
              schedulePoll(runId);
            } else {
              pollStartedAt.current = null;
              persistRunId(run.id);
            }
          } catch (err) {
            if (selectedIdRef.current === runId) {
              onError(err instanceof Error ? err.message : 'Could not poll trend run.');
            }
            pollStartedAt.current = null;
          }
        })();
      }, delay);
    },
    [clearPoll, onError],
  );

  const openRun = useCallback(
    async (runId: string, opts?: { resumePoll?: boolean }) => {
      const run = await havenAdminClient.getTrendRun(runId);
      selectRun(run);
      setHistory((prev) => {
        const rest = prev.filter((r) => r.id !== run.id);
        return [run, ...rest];
      });
      if (opts?.resumePoll !== false && isActiveStatus(run.status)) {
        pollStartedAt.current = Date.now();
        schedulePoll(run.id);
      } else {
        clearPoll();
        pollStartedAt.current = null;
      }
      return run;
    },
    [clearPoll, schedulePoll, selectRun],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingList(true);
      setBooting(true);
      onError(null);
      try {
        const runs = await loadHistory();
        if (cancelled) return;

        const persisted = readPersistedRunId();
        let resumeId: string | null = null;
        if (persisted) {
          const fromList = runs.find((r) => r.id === persisted);
          if (fromList && isActiveStatus(fromList.status)) {
            resumeId = persisted;
          } else if (!fromList) {
            // May still be active but not in history page — probe once.
            resumeId = persisted;
          } else {
            persistRunId(null);
          }
        }
        if (!resumeId) {
          resumeId = runs.find((r) => isActiveStatus(r.status))?.id ?? null;
        }

        if (resumeId) {
          try {
            const run = await openRun(resumeId);
            if (!isActiveStatus(run.status) && !cancelled) {
              // Finished while away — return to history list.
              selectRun(null);
              persistRunId(null);
            }
          } catch {
            if (!cancelled) {
              selectRun(null);
              persistRunId(null);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : 'Could not load trend runs.');
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
          setBooting(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      clearPoll();
    };
    // Mount-only boot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSearch = () => {
    setConfirmOpen(false);
    void (async () => {
      onBusy('trends-start');
      onError(null);
      try {
        const started = await havenAdminClient.startTrendSearch({
          region: 'US',
          maxTrends: 5,
          maxCandidatesPerTrend: 4,
          includeExternalCandidates: true,
          includeCatalogMatches: true,
          trigger: 'manual',
        });
        if (!started.runId) throw new Error('Trend search did not return a run id.');
        persistRunId(started.runId);
        pollStartedAt.current = Date.now();
        await openRun(started.runId);
        await loadHistory().catch(() => undefined);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not start trend search.');
      } finally {
        onBusy(null);
      }
    })();
  };

  const requestStartSearch = () => {
    if (busy != null || booting) return;
    setConfirmOpen(true);
  };

  const backToList = () => {
    clearPoll();
    pollStartedAt.current = null;
    selectRun(null);
    persistRunId(null);
    void loadHistory().catch(() => undefined);
  };

  const steps =
    selected?.steps?.length
      ? selected.steps
      : TREND_STEP_FALLBACK.map((s) => ({
          key: s.key,
          label: s.label,
          status: 'pending' as const,
          detail: '',
          at: null,
        }));

  const result =
    selected?.status === 'ready' ? selected.result : null;
  const sources =
    selected?.sourceStatuses?.length
      ? selected.sourceStatuses
      : result?.sourceStatuses ?? [];

  return (
    <section className="hv-admin__panel hv-admin__panel--trends">
      <div className="hv-admin__panel-head">
        <div>
          <h2 className="hv-admin__panel-title hv-admin__panel-title--trends">
            Trending styles
            <span className="hv-admin__panel-title-trend" aria-hidden="true">
              <TrendingUpIcon />
            </span>
          </h2>
          <p className="hv-admin__panel-meta">
            {selected
              ? selected.status === 'ready'
                ? 'Run results'
                : selected.status === 'failed'
                  ? 'Run failed'
                  : 'Run in progress'
              : loadingList
                ? 'Loading history…'
                : `${history.length} recent run${history.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="hv-admin__panel-tools">
          {selected ? (
            <button
              type="button"
              className="hv-admin__btn hv-admin__btn--ghost hv-admin__btn--compact"
              disabled={busy === 'trends-start'}
              onClick={backToList}
            >
              History
            </button>
          ) : null}
          <button
            type="button"
            className="hv-admin__btn hv-admin__btn--primary hv-admin__btn--compact"
            disabled={busy != null || booting}
            onClick={requestStartSearch}
          >
            {busy === 'trends-start' ? 'Starting…' : 'Search latest trends'}
          </button>
        </div>
      </div>

      <div className="hv-admin__trend-scroll">
      {!selected ? (
        loadingList ? (
          <p className="hv-admin__empty" style={{ marginTop: 12 }}>
            Loading trend runs…
          </p>
        ) : history.length === 0 ? (
          <p className="hv-admin__empty" style={{ marginTop: 12 }}>
            No trend searches yet. Run a search to pull Reddit and web signals into
            shoppable candidates.
          </p>
        ) : (
          <ul className="hv-admin__trend-history">
            {history.map((run) => {
              const trendsFound = run.result?.stats?.trendsFound;
              const hasTrendsCount =
                run.status === 'ready' &&
                trendsFound != null &&
                Number.isFinite(trendsFound);
              return (
              <li key={run.id}>
                <button
                  type="button"
                  className="hv-admin__trend-history-row"
                  disabled={busy === 'trends-start'}
                  onClick={() => {
                    void (async () => {
                      onBusy('trends-open');
                      onError(null);
                      try {
                        await openRun(run.id);
                      } catch (err) {
                        onError(
                          err instanceof Error
                            ? err.message
                            : 'Could not open trend run.',
                        );
                      } finally {
                        onBusy(null);
                      }
                    })();
                  }}
                >
                  <span
                    className={`hv-admin__trend-status hv-admin__trend-status--${run.status}`}
                  >
                    {statusLabel(run.status)}
                  </span>
                  <span className="hv-admin__trend-history-main">
                    <span className="hv-admin__trend-history-msg">
                      {run.message || run.stage || 'Trend search'}
                    </span>
                    <span className="hv-admin__trend-history-meta">
                      {formatWhen(run.createdAt)}
                      {run.trigger === 'scheduled' ? ' · Scheduled' : ' · Manual'}
                      {isActiveStatus(run.status)
                        ? ` · ${Math.round(run.progress)}%`
                        : ''}
                      {hasTrendsCount
                        ? ` · ${trendsFound} trend${trendsFound === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </span>
                  <span className="hv-admin__trend-history-view" aria-hidden="true">
                    View
                  </span>
                </button>
              </li>
              );
            })}
          </ul>
        )
      ) : (
        <div className="hv-admin__trend-detail">
          <div className="hv-admin__trend-progress-block">
            <div className="hv-admin__trend-progress-head">
              <p className="hv-admin__trend-progress-msg">
                {selected.message || statusLabel(selected.status)}
              </p>
              <span
                className={`hv-admin__trend-status hv-admin__trend-status--${selected.status}`}
              >
                {statusLabel(selected.status)}
              </span>
            </div>
            {isActiveStatus(selected.status) || selected.status === 'ready' ? (
              <div
                className="hv-admin__trend-progress"
                role="progressbar"
                aria-valuenow={Math.round(selected.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="hv-admin__trend-progress-bar"
                  style={{ width: `${Math.round(selected.progress)}%` }}
                />
              </div>
            ) : null}
            <p className="hv-admin__trend-progress-meta">
              {formatWhen(selected.createdAt)}
              {selected.trigger === 'scheduled' ? ' · Scheduled' : ' · Manual'}
              {selected.finishedAt ? ` · Finished ${formatWhen(selected.finishedAt)}` : ''}
            </p>
          </div>

          <SourceChips sources={sources} />

          <div
            className={`hv-admin__trend-fold${stepsExpanded ? ' is-open' : ''}`}
          >
            <button
              type="button"
              className="hv-admin__trend-fold-toggle"
              aria-expanded={stepsExpanded}
              aria-label={stepsExpanded ? 'Collapse steps' : 'Expand steps'}
              onClick={() => setStepsExpanded((v) => !v)}
            >
              <span className="hv-admin__trend-fold-meta">
                {isActiveStatus(selected.status)
                  ? selected.stage || 'In progress'
                  : statusLabel(selected.status)}
              </span>
              <span className="hv-admin__trend-fold-chevron" aria-hidden="true">
                {stepsExpanded ? '▴' : '▾'}
              </span>
            </button>
            {stepsExpanded ? (
              <ol className="hv-admin__trend-steps">
                {steps.map((step) => (
                  <li
                    key={step.key}
                    className={`hv-admin__trend-step hv-admin__trend-step--${step.status}`}
                  >
                    <span className="hv-admin__trend-step-mark" aria-hidden="true">
                      {step.status === 'done'
                        ? '✓'
                        : step.status === 'active'
                          ? '…'
                          : step.status === 'error'
                            ? '!'
                            : step.status === 'skipped'
                              ? '–'
                              : ''}
                    </span>
                    <div className="hv-admin__trend-step-body">
                      <p className="hv-admin__trend-step-label">{step.label}</p>
                      {(step.status === 'active' ||
                        step.status === 'error' ||
                        (step.detail && step.status !== 'pending')) &&
                      step.detail ? (
                        <p className="hv-admin__trend-step-detail">{step.detail}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>

          {selected.status === 'failed' ? (
            <div className="hv-admin__trend-failed">
              <p className="hv-admin__msg hv-admin__msg--error">
                {selected.error || selected.message || 'Trend search failed.'}
              </p>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary hv-admin__btn--compact"
                disabled={busy != null}
                onClick={requestStartSearch}
              >
                Retry search
              </button>
            </div>
          ) : null}

          {result ? (
            <div
              className={`hv-admin__trend-fold hv-admin__trend-results${resultsExpanded ? ' is-open' : ''}`}
            >
              <button
                type="button"
                className="hv-admin__trend-fold-toggle"
                aria-expanded={resultsExpanded}
                aria-label={resultsExpanded ? 'Collapse results' : 'Expand results'}
                onClick={() => setResultsExpanded((v) => !v)}
              >
                <span className="hv-admin__trend-fold-meta">
                  {result.stats.trendsFound} trends · {result.stats.candidatesFound}{' '}
                  candidates · {result.stats.catalogMatches} catalog ·{' '}
                  {result.stats.externalCandidates} external
                </span>
                <span className="hv-admin__trend-fold-chevron" aria-hidden="true">
                  {resultsExpanded ? '▴' : '▾'}
                </span>
              </button>
              {resultsExpanded ? (
                <div className="hv-admin__trend-fold-body hv-admin__trend-results-body">
                  {result.notes.length ? (
                    <div
                      className={`hv-admin__trend-fold hv-admin__trend-notes-fold${notesExpanded ? ' is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="hv-admin__trend-fold-toggle"
                        aria-expanded={notesExpanded}
                        aria-label={
                          notesExpanded ? 'Collapse notes' : 'Expand notes'
                        }
                        onClick={() => setNotesExpanded((v) => !v)}
                      >
                        <span className="hv-admin__trend-fold-meta">
                          {result.notes.length} note
                          {result.notes.length === 1 ? '' : 's'}
                        </span>
                        <span
                          className="hv-admin__trend-fold-chevron"
                          aria-hidden="true"
                        >
                          {notesExpanded ? '▴' : '▾'}
                        </span>
                      </button>
                      {notesExpanded ? (
                        <ul className="hv-admin__trend-notes">
                          {result.notes.map((n, i) => (
                            <li key={`${i}-${n.slice(0, 24)}`}>{n}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                  {result.trends.length === 0 ? (
                    <p className="hv-admin__empty">
                      No trends in this run. Check source chips and notes above.
                    </p>
                  ) : (
                    result.trends.map((bundle, index) => (
                      <TrendResultCard
                        key={bundle.trend.id || bundle.trend.title}
                        bundle={bundle}
                        rank={index + 1}
                        busy={busy != null}
                        onImportUrl={onImportUrl}
                        onViewProduct={onViewProduct}
                        onImportQueries={onImportQueries}
                      />
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      </div>

      {confirmOpen ? (
        <div
          className="hv-admin__modal-backdrop"
          role="presentation"
          onMouseDown={confirmBackdrop.onMouseDown}
          onClick={confirmBackdrop.onClick}
        >
          <div
            className="hv-admin__modal hv-admin__modal--confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmTitleId}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={confirmTitleId} className="hv-admin__modal-title">
              Search latest trends?
            </h2>
            <p className="hv-admin__modal-copy">
              Scan the latest trends on the web for trending styles, then match them to
              catalog and external product candidates. This usually takes about a minute.
            </p>
            <div className="hv-admin__modal-actions">
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--ghost"
                disabled={busy === 'trends-start'}
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary"
                disabled={busy != null}
                onClick={startSearch}
              >
                {busy === 'trends-start' ? 'Starting…' : 'Start search'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
