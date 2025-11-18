import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchActiveSessions,
  fetchInactiveSessions,
  fetchUsageStats,
  fetchUsageSummary,
} from './api';
import type { SessionListResult, UsageByUsernameSummary, UsageCredentials, UsageStats } from './types';

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

export function useUsageData(credentials: UsageCredentials | null) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [summary, setSummary] = useState<UsageByUsernameSummary | null>(null);
  const [activeSessions, setActiveSessions] = useState<SessionListResult | null>(null);
  const [inactiveSessions, setInactiveSessions] = useState<SessionListResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const normalizedCredentials = useMemo(() => {
    if (!credentials?.username?.trim() || !credentials?.password?.trim()) {
      return null;
    }
    return {
      username: credentials.username.trim(),
      password: credentials.password.trim(),
      mac: credentials.mac?.trim() || undefined,
    } satisfies UsageCredentials;
  }, [credentials]);

  const refresh = useCallback(async () => {
    if (!normalizedCredentials) {
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
        fetchUsageStats(normalizedCredentials, { sessionLimit: DEFAULT_ACTIVE_LIMIT, withSessions: false }),
        fetchUsageSummary(normalizedCredentials.username, DEFAULT_INACTIVE_LIMIT),
        fetchActiveSessions(normalizedCredentials.username, { limit: DEFAULT_ACTIVE_LIMIT }),
        fetchInactiveSessions(normalizedCredentials.username, { limit: DEFAULT_INACTIVE_LIMIT }),
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
  }, [normalizedCredentials]);

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
    credentials: normalizedCredentials,
  } as const;
}
