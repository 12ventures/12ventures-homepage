import { useCallback, useEffect, useState } from 'react';
import { INITIATIVES } from '../data/initiatives';
import type { Initiative } from '../data/initiatives';
import {
  initiativeToInput,
  isMlkchApiConfigured,
  mlkchApi,
  type InitiativeInput,
  type InitiativePatch,
} from '../api/mlkchApi';

export type InitiativesSource = 'api' | 'static';

export function useInitiatives() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<InitiativesSource>('static');
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    if (!isMlkchApiConfigured) {
      setInitiatives(INITIATIVES);
      setSource('static');
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { items } = await mlkchApi.list();
      setInitiatives(items);
      setSource('api');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load initiatives';
      setError(message);
      setInitiatives(INITIATIVES);
      setSource('static');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: InitiativeInput) => {
    if (!isMlkchApiConfigured) {
      throw new Error('API not configured');
    }
    setMutating(true);
    try {
      const created = await mlkchApi.create(input);
      setInitiatives((prev) => [...prev, created].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      setSource('api');
      setError(null);
      return created;
    } finally {
      setMutating(false);
    }
  }, []);

  const update = useCallback(async (id: string, input: InitiativeInput) => {
    if (!isMlkchApiConfigured) {
      throw new Error('API not configured');
    }
    setMutating(true);
    try {
      const updated = await mlkchApi.update(id, input);
      setInitiatives((prev) =>
        prev
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      );
      setSource('api');
      setError(null);
      return updated;
    } finally {
      setMutating(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    if (!isMlkchApiConfigured) {
      throw new Error('API not configured');
    }
    setMutating(true);
    try {
      await mlkchApi.remove(id);
      setInitiatives((prev) => prev.filter((item) => item.id !== id));
      setSource('api');
      setError(null);
    } finally {
      setMutating(false);
    }
  }, []);

  const patch = useCallback(async (id: string, partial: InitiativePatch) => {
    if (!isMlkchApiConfigured) {
      throw new Error('API not configured');
    }
    setMutating(true);
    try {
      const updated = await mlkchApi.patch(id, partial);
      setInitiatives((prev) =>
        prev
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      );
      setSource('api');
      setError(null);
      return updated;
    } finally {
      setMutating(false);
    }
  }, []);

  const reorderSection = useCallback(
    async (sectionId: string, reordered: Initiative[]) => {
      if (!isMlkchApiConfigured) return;

      setInitiatives((prev) => [
        ...prev.filter((i) => i.sectionId !== sectionId),
        ...reordered.map((item, idx) => ({ ...item, sortOrder: idx * 10 })),
      ]);

      const saves = reordered
        .map((item, idx) => {
          const newOrder = idx * 10;
          return (item.sortOrder ?? 0) !== newOrder
            ? mlkchApi.patch(item.id, { sortOrder: newOrder })
            : null;
        })
        .filter((p): p is Promise<Initiative> => p !== null);

      if (saves.length === 0) return;
      setMutating(true);
      try {
        const results = await Promise.all(saves);
        setInitiatives((prev) => {
          const map = new Map(results.map((r) => [r.id, r]));
          return prev.map((i) => map.get(i.id) ?? i);
        });
      } catch {
        refresh();
      } finally {
        setMutating(false);
      }
    },
    [refresh],
  );

  return {
    initiatives,
    loading,
    error,
    source,
    mutating,
    refresh,
    create,
    update,
    remove,
    patch,
    reorderSection,
    canEdit: isMlkchApiConfigured,
    apiConfigured: isMlkchApiConfigured,
    initiativeToInput,
  };
}
