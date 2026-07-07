import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheckCircle, FiLoader, FiAlertCircle, FiX, FiActivity } from 'react-icons/fi';
import { poseidonService, type MaintenanceStatus } from '../../services/poseidonService';
import './MaintenanceModal.css';

const POLL_MS = 45_000;

interface Props {
  onClose: () => void;
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

interface MetricProps {
  label: string;
  value: string;
  barPct?: number;
  barDelay?: number;
  animateBars: boolean;
  ok?: boolean;
}

function MetricCard({
  label,
  value,
  barPct,
  barDelay = 0,
  animateBars,
  ok = true,
}: MetricProps) {
  const targetWidth = barPct != null ? `${clampPct(barPct)}%` : undefined;

  return (
    <div className="mm-metric">
      <div className={`mm-metric__icon${ok ? ' mm-metric__icon--ok' : ''}`}>
        {ok ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
      </div>
      <div className="mm-metric__body">
        <span className="mm-metric__label">{label}</span>
        <span className={`mm-metric__value${ok ? ' mm-metric__value--ok' : ' mm-metric__value--warn'}`}>
          {value}
        </span>
        {targetWidth != null && (
          <div className="mm-metric__bar-track" aria-hidden="true">
            <div
              className={`mm-metric__bar-fill${ok ? ' mm-metric__bar-fill--ok' : ''}${animateBars ? ' mm-metric__bar-fill--live' : ''}`}
              style={{
                width: animateBars ? targetWidth : '0%',
                transitionDelay: animateBars ? `${barDelay}ms` : undefined,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const MaintenanceModal: React.FC<Props> = ({ onClose }) => {
  const [data, setData] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (isPoll = false) => {
    if (isPoll) setRefreshing(true);
    else if (!hasLoadedRef.current) setLoading(true);

    try {
      const result = await poseidonService.getMaintenance();
      setData(result);
      setError(false);
      hasLoadedRef.current = true;
    } catch {
      if (!hasLoadedRef.current) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const intervalId = window.setInterval(() => { void load(true); }, POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [load]);

  useEffect(() => {
    if (!data) {
      setAnimateBars(false);
      return;
    }
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateBars(true));
    });
    return () => cancelAnimationFrame(frameId);
  }, [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const capacityPct = data && data.max_concurrent > 0
    ? (data.active_agents / data.max_concurrent) * 100
    : 0;
  const waitOk = (data?.wait_time_seconds ?? 0) <= 5;
  const waitBarPct = Math.max(8, 100 - Math.min((data?.wait_time_seconds ?? 0) * 20, 92));

  return createPortal(
    <div className="mm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="mm-panel" role="dialog" aria-modal="true" aria-labelledby="mm-title">
        <div className="mm-header">
          <div className="mm-header-text">
            <div className="mm-header-title-row">
              <h2 id="mm-title" className="mm-title">System Maintenance</h2>
              {data && !error && (
                <span className="mm-status-badge">
                  <span className="mm-status-dot" />
                  Healthy
                </span>
              )}
            </div>
          </div>
          <button type="button" className="mm-close" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="mm-body">
          {loading && !data && (
            <div className="mm-state">
              <FiLoader size={22} className="mm-spin" />
              <span>Loading maintenance status…</span>
            </div>
          )}

          {!loading && error && !data && (
            <div className="mm-state mm-state--error">
              <FiAlertCircle size={20} />
              <span>Could not load maintenance status.</span>
            </div>
          )}

          {data && (
            <>
              <div className={`mm-metrics${animateBars ? ' mm-metrics--live' : ''}`}>
                <MetricCard
                  label="Production Uptime"
                  value={data.production_uptime_display}
                  barPct={data.production_uptime_percent}
                  barDelay={180}
                  animateBars={animateBars}
                  ok={data.production_uptime_percent >= 99}
                />
                <MetricCard
                  label="Active Agents"
                  value={String(data.active_agents)}
                  barPct={capacityPct}
                  barDelay={320}
                  animateBars={animateBars}
                  ok={data.active_agents <= data.max_concurrent}
                />
                <MetricCard
                  label="Average Wait Time"
                  value={data.wait_time_display}
                  barPct={waitBarPct}
                  barDelay={460}
                  animateBars={animateBars}
                  ok={waitOk}
                />
              </div>

              <div className={`mm-footer${animateBars ? ' mm-footer--live' : ''}`}>
                <FiActivity size={13} className="mm-footer-icon" />
                <span>
                  Last updated {formatUpdatedAt(data.updated_at)}
                  {refreshing && <span className="mm-refreshing"> · Updating…</span>}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MaintenanceModal;
