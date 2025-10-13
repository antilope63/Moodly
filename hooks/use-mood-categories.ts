import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MoodCategory } from '@/types/mood';
import { fetchMoodCategories } from '@/services/mood';

type UseMoodCategoriesState = {
  categories: MoodCategory[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export const useMoodCategories = (): UseMoodCategoriesState => {
  const [categories, setCategories] = useState<MoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchMoodCategories();
      setCategories(response);
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
      categories,
      isLoading,
      error,
      refresh: load,
    }),
    [categories, isLoading, error, load]
  );
};
