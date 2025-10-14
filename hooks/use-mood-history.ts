import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { MoodEntry } from '@/types/mood'; // On utilise le type MoodEntry complet

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
      const { data, error: fetchError } = await supabase
        .from('mood_entries')
        .select('*, categories:mood_entry_categories(mood_categories(*))')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // On utilise la même logique de mapping que pour le feed
      const mappedData = (data || []).map((row: any) => {
        const categoriesRaw = (row.categories ?? []).map((rel: any) => rel.mood_categories);
        return {
          id: row.id,
          moodValue: row.mood_value,
          moodLabel: row.mood_label,
          context: row.context,
          isAnonymous: row.is_anonymous,
          reasonSummary: row.reason_summary ?? undefined,
          note: row.note ?? undefined,
          loggedAt: row.logged_at,
          visibility: row.visibility,
          categories: (categoriesRaw ?? []).map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              categoryType: c.category_type,
          })),
        } as MoodEntry
      });

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