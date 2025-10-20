import { useCallback, useEffect, useMemo, useState } from 'react';

import { getAnonymizedAuthorToken } from '@/lib/anonymization';
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

const mapRowToMoodEntry = (row: any, source: 'standard' | 'anonymous'): MoodEntry => ({
  id: row.id,
  moodValue: row.mood_value,
  context: row.context,
  isAnonymous: source === 'anonymous' ? true : row.is_anonymous,
  reasonSummary: row.reason_summary ?? undefined,
  note: row.note ?? undefined,
  loggedAt: row.logged_at,
  visibility: row.visibility,
  categories: [],
  freedomChoice: row.freedom_choice ?? undefined,
  supportChoice: row.support_choice ?? undefined,
  energyChoice: row.energy_choice ?? undefined,
  pridePercent: row.pride_percent ?? undefined,
  source,
  loggedBy: null,
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
      let standardQuery = supabase
        .from('mood_entries')
        .select('*')
        .order('logged_at', { ascending: false }) as any;
      let anonymousQuery: Promise<any> | null = null;

      if (scope === 'me') {
        standardQuery = standardQuery.eq('user_id', user.id);
        const authorToken = await getAnonymizedAuthorToken(user.id);
        anonymousQuery = supabase
          .from('anonymous_mood_entries')
          .select('*')
          .eq('author_token', authorToken)
          .order('logged_at', { ascending: false });
      } else if (scope === 'team') {
        const ids = (teamIds && teamIds.length ? teamIds : (teamId ? [teamId] : []));
        if (!ids.length) {
          setItems([]);
          setIsLoading(false);
          return;
        }
        standardQuery = standardQuery.in('team_id', ids);
        anonymousQuery = supabase
          .from('anonymous_mood_entries')
          .select('*')
          .in('team_id', ids)
          .order('logged_at', { ascending: false });
      } else if (scope === 'user') {
        if (!targetUserId) {
          setItems([]);
          setIsLoading(false);
          return;
        }
        standardQuery = standardQuery.eq('user_id', targetUserId);
        // On ne tente pas de reconstituer les publications anonymes pour préserver l'anonymat.
      }

      const [standardResult, anonymousResult] = await Promise.all([
        standardQuery,
        anonymousQuery ?? Promise.resolve({ data: [], error: null }),
      ]);
      const { data, error: fetchError } = standardResult;
      const { data: anonymousData, error: anonymousError } = anonymousResult;
      if (fetchError) throw fetchError;
      if (anonymousError) throw anonymousError;

      const standardRows = (data ?? []) as any[];
      let profilesMap = new Map<string, { username?: string | null; email?: string | null }>();

      if (scope === 'team') {
        const userIds = Array.from(
          new Set(
            standardRows
              .map((row) => row.user_id as string | undefined)
              .filter((id): id is string => Boolean(id)),
          ),
        );
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, email')
            .in('id', userIds);
          if (profilesError) {
            throw profilesError;
          }
          (profiles ?? []).forEach((profile: any) => {
            profilesMap.set(profile.id as string, {
              username: (profile.username as string | null) ?? null,
              email: (profile.email as string | null) ?? null,
            });
          });
        }
      }

      const standardEntries = standardRows.map((row: any) => {
        const entry = mapRowToMoodEntry(row, 'standard');
        if (scope === 'team' && row.user_id && !row.is_anonymous) {
          const profile = profilesMap.get(row.user_id as string);
          const fallback =
            (row.user_email as string | null)?.split('@')[0] ?? 'Anonyme';
          entry.loggedBy = {
            id: row.user_id as string,
            username: profile?.username ?? fallback,
            email: profile?.email ?? (row.user_email as string | null) ?? undefined,
            role: undefined,
            rawRole: null,
          };
        }
        return entry;
      });

      const anonymousEntries = (anonymousData ?? []).map((row: any) => {
        const entry = mapRowToMoodEntry(row, 'anonymous');
        entry.loggedBy = null;
        return entry;
      });
      const combined = [...standardEntries, ...anonymousEntries].sort(
        (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      );
      setItems(combined);
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
