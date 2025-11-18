import client from '../../api/client';
import type {
  SessionListResult,
  UsageByUsernameSummary,
  UsageCredentials,
  UsageSessionsOptions,
  UsageStats,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UsageRequestOptions {
  sessionLimit?: number;
  withSessions?: boolean;
}

const withTrimmedCredentials = (credentials: UsageCredentials) => ({
  username: credentials.username.trim(),
  password: credentials.password.trim(),
  mac: credentials.mac?.trim() || undefined,
});

export async function fetchUsageStats(
  credentials: UsageCredentials,
  options: UsageRequestOptions = {}
): Promise<UsageStats> {
  const payload = withTrimmedCredentials(credentials);
  const params = {
    username: payload.username,
    password: payload.password,
    mac: payload.mac,
    limit: options.sessionLimit ?? 20,
    withSessions: options.withSessions ?? false,
  };
  const response = await client.get<ApiResponse<UsageStats>>('/usage', { params });
  return response.data.data;
}

export async function fetchUsageSummary(username: string, historyLimit?: number): Promise<UsageByUsernameSummary> {
  const response = await client.get<ApiResponse<UsageByUsernameSummary>>('/usage-by-username', {
    params: { username: username.trim(), historyLimit },
  });
  return response.data.data;
}

async function fetchSessions(
  endpoint: '/active-sessions' | '/inactive-sessions',
  username: string,
  options: UsageSessionsOptions = {}
): Promise<SessionListResult> {
  const response = await client.get<ApiResponse<SessionListResult>>(endpoint, {
    params: { username: username.trim(), limit: options.limit },
  });
  return response.data.data;
}

export const fetchActiveSessions = (username: string, options?: UsageSessionsOptions) =>
  fetchSessions('/active-sessions', username, options);

export const fetchInactiveSessions = (username: string, options?: UsageSessionsOptions) =>
  fetchSessions('/inactive-sessions', username, options);

export async function disconnectUsageSessions(radacctIds: string[]) {
  return client.post('/usage/disconnect', { radacctIds });
}
