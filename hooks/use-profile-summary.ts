import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ProfileSummary } from '@/services/mood';
import { fetchProfileSummary } from '@/services/mood';

type UseProfileSummaryState = {
  summary: (ProfileSummary & { roleLabel?: string }) | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const formatRoleLabel = (role?: string | null) => {
  switch (role) {
    case 'manager':
      return 'Manager';
    case 'hr':
      return 'RH';
    case 'employee':
      return 'Employé';
    case 'admin':
      return 'Admin';
    default:
      return role ?? null;
  }
};

export const useProfileSummary = (): UseProfileSummaryState => {
  const [summary, setSummary] = useState<UseProfileSummaryState['summary']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchProfileSummary();
      setSummary({
        ...response,
        roleLabel: formatRoleLabel(response.role ?? undefined) ?? undefined,
      });
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      summary,
      isLoading,
      error,
      refresh: load,
    }),
    [summary, isLoading, error, load]
  );
};

