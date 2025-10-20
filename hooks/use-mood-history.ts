import { getAnonymizedAuthorToken } from '@/lib/anonymization';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { MoodEntry } from '@/types/mood'; // On utilise le type MoodEntry complet
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useMoodHistory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authorToken = await getAnonymizedAuthorToken(user.id);

      const [{ data, error: fetchError }, { data: anonymousData, error: anonymousError }] =
        await Promise.all([
          supabase
            .from('mood_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('logged_at', { ascending: false }),
          supabase
            .from('anonymous_mood_entries')
            .select('*')
            .eq('author_token', authorToken)
            .order('logged_at', { ascending: false }),
        ]);

      if (fetchError) {
        throw fetchError;
      }
      if (anonymousError) {
        throw anonymousError;
      }

      // On utilise la même logique de mapping que pour le feed
      const mappedStandard = (data || []).map(
        (row: any) =>
          ({
            id: row.id,
            moodValue: row.mood_value,
            context: row.context,
            isAnonymous: row.is_anonymous,
            reasonSummary: row.reason_summary ?? undefined,
            note: row.note ?? undefined,
            loggedAt: row.logged_at,
            visibility: row.visibility,
            categories: [],
            freedomChoice: row.freedom_choice ?? undefined,
            supportChoice: row.support_choice ?? undefined,
            energyChoice: row.energy_choice ?? undefined,
            pridePercent: row.pride_percent ?? undefined,
            source: 'standard',
          }) as MoodEntry,
      );
      const mappedAnonymous = (anonymousData || []).map(
        (row: any) =>
          ({
            id: row.id,
            moodValue: row.mood_value,
            context: row.context,
            isAnonymous: true,
            reasonSummary: row.reason_summary ?? undefined,
            note: row.note ?? undefined,
            loggedAt: row.logged_at,
            visibility: row.visibility,
            categories: [],
            freedomChoice: row.freedom_choice ?? undefined,
            supportChoice: row.support_choice ?? undefined,
            energyChoice: row.energy_choice ?? undefined,
            pridePercent: row.pride_percent ?? undefined,
            source: 'anonymous',
          }) as MoodEntry,
      );
      const mappedData = [...mappedStandard, ...mappedAnonymous].sort(
        (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      );

      setItems(mappedData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return useMemo(
    () => ({ items, isLoading, error, refresh: fetchHistory }),
    [items, isLoading, error, fetchHistory]
  );
};
