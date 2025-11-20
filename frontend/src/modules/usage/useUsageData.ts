import { useCallback, useEffect, useState } from 'react';
import { fetchActiveSessions, fetchInactiveSessions, fetchUsageStats, fetchUsageSummary } from './api';
import type { SessionListResult, UsageByUsernameSummary, UsageStats, UsageTimeseriesGranularity } from './types';

const DEFAULT_ACTIVE_LIMIT = 25;
const DEFAULT_INACTIVE_LIMIT = 80;

const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const record = error as { response?: { data?: { message?: string } }; message?: string };
    return record.response?.data?.message || record.message || 'Unknown error';
  }
  return 'Unknown error';
};

type UsageHookFilters = {
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'active' | 'inactive';
  granularity?: UsageTimeseriesGranularity;
};

type UsageHookOptions = {
  mac?: string;
  enabled?: boolean;
  filters?: UsageHookFilters;
};

export function useUsageData(options: UsageHookOptions = {}) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [summary, setSummary] = useState<UsageByUsernameSummary | null>(null);
  const [activeSessions, setActiveSessions] = useState<SessionListResult | null>(null);
  const [inactiveSessions, setInactiveSessions] = useState<SessionListResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const normalizedMac = options.mac?.trim() || undefined;
  const isEnabled = options.enabled ?? true;
  const appliedFilters = options.filters ?? {};
  const granularity = appliedFilters.granularity ?? 'day';

  const refresh = useCallback(async () => {
    if (!isEnabled) {
      setUsage(null);
      setSummary(null);
      setActiveSessions(null);
      setInactiveSessions(null);
      setErrors([]);
      return;
    }
    setIsLoading(true);
    const newErrors: string[] = [];
    try {
      const [usageResult, summaryResult, activeResult, inactiveResult] = await Promise.allSettled([
        fetchUsageStats({ sessionLimit: DEFAULT_ACTIVE_LIMIT, withSessions: false, mac: normalizedMac }),
        fetchUsageSummary({
          historyLimit: DEFAULT_INACTIVE_LIMIT,
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          granularity,
        }),
        fetchActiveSessions({
          limit: DEFAULT_ACTIVE_LIMIT,
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          status: appliedFilters.status,
        }),
        fetchInactiveSessions({
          limit: DEFAULT_INACTIVE_LIMIT,
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          status: appliedFilters.status,
        }),
      ]);

      if (usageResult.status === 'fulfilled') {
        setUsage(usageResult.value);
      } else {
        newErrors.push(toErrorMessage(usageResult.reason));
      }

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        newErrors.push(toErrorMessage(summaryResult.reason));
      }

      if (activeResult.status === 'fulfilled') {
        setActiveSessions(activeResult.value);
      } else {
        newErrors.push(toErrorMessage(activeResult.reason));
      }

      if (inactiveResult.status === 'fulfilled') {
        setInactiveSessions(inactiveResult.value);
      } else {
        newErrors.push(toErrorMessage(inactiveResult.reason));
      }

      setErrors(newErrors);
      setLastUpdated(Date.now());
    } finally {
      setIsLoading(false);
    }
  }, [
    appliedFilters.endDate,
    appliedFilters.startDate,
    appliedFilters.status,
    granularity,
    isEnabled,
    normalizedMac,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    usage,
    summary,
    activeSessions,
    inactiveSessions,
    errors,
    isLoading,
    lastUpdated,
    refresh,
  } as const;
}
