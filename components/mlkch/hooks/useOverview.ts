import { useCallback, useEffect, useState } from 'react';
import {
  buildStaticOverview,
  type DashboardOverview,
} from '../data/overview';
import type { DashboardSection, Initiative } from '../data/initiatives';
import { isMlkchApiConfigured, mlkchApi } from '../api/mlkchApi';

export type OverviewSource = 'api' | 'static';

export function useOverview(
  initiatives: Initiative[],
  sections: DashboardSection[],
) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<OverviewSource>('static');

  const refresh = useCallback(async () => {
    if (!isMlkchApiConfigured) {
      setOverview(buildStaticOverview(initiatives, sections));
      setSource('static');
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await mlkchApi.getOverview();
      setOverview(data);
      setSource('api');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load overview';
      setError(message);
      setOverview(buildStaticOverview(initiatives, sections));
      setSource('static');
    } finally {
      setLoading(false);
    }
  }, [initiatives, sections]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { overview, loading, error, source, refresh };
}
