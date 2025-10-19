import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { MoodEntry } from '@/types/mood';

type Scope = 'me' | 'team' | 'user';

export type UseManagedMoodHistoryParams = {
  scope: Scope;
  teamId?: number | null;
  teamIds?: number[] | null;
  targetUserId?: string | null;
};

const mapRowToMoodEntry = (row: any): MoodEntry => ({
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
});

export const useManagedMoodHistory = ({ scope, teamId, teamIds, targetUserId }: UseManagedMoodHistoryParams) => {
  const { user } = useAuth();
  const [items, setItems] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('mood_entries')
        .select('*')
        .order('logged_at', { ascending: false }) as any;

      if (scope === 'me') {
        query = query.eq('user_id', user.id);
      } else if (scope === 'team') {
        const ids = (teamIds && teamIds.length ? teamIds : (teamId ? [teamId] : []));
        if (!ids.length) {
          setItems([]);
          setIsLoading(false);
          return;
        }
        query = query.in('team_id', ids);
      } else if (scope === 'user') {
        if (!targetUserId) {
          setItems([]);
          setIsLoading(false);
          return;
        }
        query = query.eq('user_id', targetUserId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const mapped = (data ?? []).map(mapRowToMoodEntry);
      setItems(mapped);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [scope, teamId, teamIds, targetUserId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({ items, isLoading, error, refresh: load }),
    [items, isLoading, error, load]
  );
};
