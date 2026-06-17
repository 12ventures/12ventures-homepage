import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SECTIONS } from '../data/initiatives';
import type { DashboardSection } from '../data/initiatives';
import {
  isMlkchApiConfigured,
  mlkchApi,
  type SectionInput,
  type SectionPatch,
} from '../api/mlkchApi';

export type SectionsSource = 'api' | 'static';

export function useSections() {
  const [sections, setSections] = useState<DashboardSection[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SectionsSource>('static');
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    if (!isMlkchApiConfigured) {
      setSections(DEFAULT_SECTIONS);
      setSource('static');
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { items } = await mlkchApi.listSections();
      setSections(items);
      setSource('api');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sections';
      setError(message);
      setSections(DEFAULT_SECTIONS);
      setSource('static');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: SectionInput) => {
    if (!isMlkchApiConfigured) {
      throw new Error('API not configured');
    }
    setMutating(true);
    try {
      const created = await mlkchApi.createSection(input);
      setSections((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      setSource('api');
      setError(null);
      return created;
    } finally {
      setMutating(false);
    }
  }, []);

  const patch = useCallback(async (id: string, partial: SectionPatch) => {
    if (!isMlkchApiConfigured) {
      throw new Error('API not configured');
    }
    setMutating(true);
    try {
      const updated = await mlkchApi.patchSection(id, partial);
      setSections((prev) =>
        prev
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => a.sortOrder - b.sortOrder),
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
      await mlkchApi.removeSection(id);
      setSections((prev) => prev.filter((item) => item.id !== id));
      setSource('api');
      setError(null);
    } finally {
      setMutating(false);
    }
  }, []);

  const reorderSections = useCallback(
    async (reordered: DashboardSection[]) => {
      const withOrder = reordered.map((section, idx) => ({
        ...section,
        sortOrder: idx * 10,
      }));

      setSections(withOrder);

      if (!isMlkchApiConfigured) return;

      const saves = withOrder
        .map((section, idx) => {
          const newOrder = idx * 10;
          const prev = reordered.find((s) => s.id === section.id);
          return prev && prev.sortOrder !== newOrder
            ? mlkchApi.patchSection(section.id, { sortOrder: newOrder })
            : null;
        })
        .filter((p): p is Promise<DashboardSection> => p !== null);

      if (saves.length === 0) return;

      setMutating(true);
      try {
        const results = await Promise.all(saves);
        setSections((prev) => {
          const map = new Map(results.map((r) => [r.id, r]));
          return prev.map((s) => map.get(s.id) ?? s).sort((a, b) => a.sortOrder - b.sortOrder);
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
    sections,
    loading,
    error,
    source,
    mutating,
    refresh,
    create,
    patch,
    remove,
    reorderSections,
    canEdit: isMlkchApiConfigured,
  };
}
