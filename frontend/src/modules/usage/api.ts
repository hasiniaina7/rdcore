import client from '../../api/client';
import type {
  SessionListResult,
  UsageByUsernameSummary,
  UsageSessionsOptions,
  UsageStats,
  UsageTimeseries,
  UsageTimeseriesGranularity,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UsageRequestOptions {
  sessionLimit?: number;
  withSessions?: boolean;
  mac?: string;
}

interface UsageSummaryRequestOptions {
  historyLimit?: number;
  startDate?: string;
  endDate?: string;
  granularity?: UsageTimeseriesGranularity;
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

export async function fetchUsageSummary(options: UsageSummaryRequestOptions = {}): Promise<UsageByUsernameSummary> {
  const response = await client.get<ApiResponse<UsageByUsernameSummary>>('/usage-by-username', {
    params: {
      historyLimit: options.historyLimit,
      startDate: options.startDate,
      endDate: options.endDate,
      granularity: options.granularity,
    },
  });
  return response.data.data;
}

export async function fetchUsageTimeseries(options: UsageSummaryRequestOptions = {}): Promise<UsageTimeseries> {
  // Endpoint not available yet; return empty buckets to avoid breaking charts.
  return Promise.resolve({
    startDate: options.startDate || '',
    endDate: options.endDate || '',
    granularity: options.granularity || 'day',
    buckets: [],
  });
}

async function fetchSessions(
  endpoint: '/active-sessions' | '/inactive-sessions',
  options: UsageSessionsOptions = {}
): Promise<SessionListResult> {
  const response = await client.get<ApiResponse<SessionListResult>>(endpoint, {
    params: {
      limit: options.limit,
      startDate: options.startDate,
      endDate: options.endDate,
      status: options.status,
    },
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

export async function disconnectConsumptionSessions(payload: {
  username: string;
  password: string;
  radacctIds: string[];
}) {
  return client.post('/consumption/sessions/disconnect', payload);
}
