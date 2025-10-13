import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MoodEntry } from '@/types/mood';
import { fetchMoodFeed } from '@/services/mood';

type MoodFeedState = {
  moods: MoodEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastUpdated?: Date;
};

export const useMoodFeed = (): MoodFeedState => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const loadMoods = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchMoodFeed();
      setMoods(response);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMoods();
  }, [loadMoods]);

  return useMemo(
    () => ({
      moods,
      isLoading,
      error,
      refresh: loadMoods,
      lastUpdated,
    }),
    [moods, isLoading, error, loadMoods, lastUpdated]
  );
};
