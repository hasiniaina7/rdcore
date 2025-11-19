import client from '../../api/client';
import type { SessionListResult, UsageByUsernameSummary, UsageSessionsOptions, UsageStats } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UsageRequestOptions {
  sessionLimit?: number;
  withSessions?: boolean;
  mac?: string;
}

export async function fetchUsageStats(options: UsageRequestOptions = {}): Promise<UsageStats> {
  const params = {
    mac: options.mac?.trim() || undefined,
    limit: options.sessionLimit ?? 20,
    withSessions: options.withSessions ?? false,
  };
  const response = await client.get<ApiResponse<UsageStats>>('/usage', { params });
  return response.data.data;
}

export async function fetchUsageSummary(historyLimit?: number): Promise<UsageByUsernameSummary> {
  const response = await client.get<ApiResponse<UsageByUsernameSummary>>('/usage-by-username', {
    params: { historyLimit },
  });
  return response.data.data;
}

async function fetchSessions(
  endpoint: '/active-sessions' | '/inactive-sessions',
  options: UsageSessionsOptions = {}
): Promise<SessionListResult> {
  const response = await client.get<ApiResponse<SessionListResult>>(endpoint, {
    params: { limit: options.limit },
  });
  return response.data.data;
}

export const fetchActiveSessions = (options?: UsageSessionsOptions) =>
  fetchSessions('/active-sessions', options);

export const fetchInactiveSessions = (options?: UsageSessionsOptions) =>
  fetchSessions('/inactive-sessions', options);

export async function disconnectUsageSessions(radacctIds: string[]) {
  return client.post('/usage/disconnect', { radacctIds });
}
