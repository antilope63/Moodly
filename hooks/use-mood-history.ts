import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MoodEntry } from '@/types/mood';
import { fetchMoodHistory } from '@/services/mood';

export const useMoodHistory = () => {
  const [items, setItems] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchMoodHistory();
      setItems(response);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      items,
      isLoading,
      error,
      refresh: load,
    }),
    [items, isLoading, error, load]
  );
};
