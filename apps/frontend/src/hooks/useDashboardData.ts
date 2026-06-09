import { useState, useEffect } from 'react';
import type { DashboardState } from '../types';
import { fetchDashboardState } from '../utils/api';

export function useDashboardData() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const pollData = async () => {
      try {
        const state = await fetchDashboardState();
        if (mounted) {
          setData(state);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        }
      } finally {
        if (mounted && loading) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    pollData();

    // Poll every 2 seconds
    intervalId = setInterval(pollData, 2000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [loading]);

  return { data, loading, error };
}
