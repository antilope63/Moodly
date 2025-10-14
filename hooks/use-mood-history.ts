import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export interface MoodHistoryEntry {
  id: number;
  mood_value: number;
  mood_label: string;
  reason_summary: string | null;
  logged_at: string;
}

export const useMoodHistory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MoodHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    // --- LA CORRECTION EST ICI ---
    // On vérifie non seulement que `user` existe, mais aussi qu'il a un `id`.
    // Cela empêche la requête de se lancer avec un utilisateur temporaire.
    if (!user || !user.id) {
      setIsLoading(false); // On arrête le chargement si pas d'utilisateur
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('id, mood_value, mood_label, reason_summary, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) {
        throw error;
      }

      setItems(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { items, isLoading, error, refresh: fetchHistory };
};