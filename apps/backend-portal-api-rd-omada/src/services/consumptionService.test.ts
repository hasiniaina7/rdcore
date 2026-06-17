import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConsumptionOverview } from './consumptionService';
import { fetchUsage } from './usageService';
import { fetchUsageByUsername } from './usageInsightsService';
import { listActiveSessions, listInactiveSessions } from './sessionService';
import { findPermanentUser, findVoucher, getPermanentUserPassword } from './radiusdeskIntegration';

vi.mock('./usageService', () => ({
  fetchUsage: vi.fn(),
}));

vi.mock('./usageInsightsService', () => ({
  fetchUsageByUsername: vi.fn(),
}));

vi.mock('./sessionService', () => ({
  listActiveSessions: vi.fn(),
  listInactiveSessions: vi.fn(),
}));

vi.mock('./radiusdeskIntegration', () => ({
  fetchUsage: vi.fn(),
  fetchUsageByUsername: vi.fn(),
  listActiveSessions: vi.fn(),
  listInactiveSessions: vi.fn(),
  findPermanentUser: vi.fn(),
  findVoucher: vi.fn(),
  getPermanentUserPassword: vi.fn(),
}));

const mockedFetchUsage = vi.mocked(fetchUsage);
const mockedFetchUsageByUsername = vi.mocked(fetchUsageByUsername);
const mockedListActiveSessions = vi.mocked(listActiveSessions);
const mockedListInactiveSessions = vi.mocked(listInactiveSessions);
const mockedFindPermanentUser = vi.mocked(findPermanentUser);
const mockedFindVoucher = vi.mocked(findVoucher);
const mockedGetPermanentUserPassword = vi.mocked(getPermanentUserPassword);

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchUsage.mockResolvedValue({
    username: 'tsou',
    accountType: 'permanent',
    dataUsed: 123,
    dataCap: 800 * 1024 * 1024 * 1024,
    timeUsed: 0,
    timeCap: null,
    depleted: false,
    sessions: [],
  });
  mockedFetchUsageByUsername.mockResolvedValue({
    username: 'tsou',
    historyLimit: 200,
    macs: ['AA:BB:CC:DD:EE:FF'],
    periods: [
      { period: 'hourly', totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
      { period: 'daily', totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
      { period: 'weekly', totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
      { period: 'monthly', totalBytes: Math.round(421.6 * 1024 * 1024 * 1024), totalTimeSeconds: 0, sessionCount: 9 },
    ],
    series: { startDate: '', endDate: '', granularity: 'day', buckets: [] },
  });
  mockedListActiveSessions.mockResolvedValue({ username: 'tsou', totalCount: 0, sessions: [] });
  mockedListInactiveSessions.mockResolvedValue({ username: 'tsou', totalCount: 0, sessions: [] });
  mockedFindPermanentUser.mockResolvedValue({
      items: [
        {
          id: '42',
          username: 'tsou',
          profile: 'premium',
          status: 'active',
        active: 1,
      },
    ],
  });
  mockedFindVoucher.mockResolvedValue({ items: [] });
  mockedGetPermanentUserPassword.mockResolvedValue({ value: 'secret' });
});

describe('getConsumptionOverview', () => {
  it('uses the monthly total for permanent users and ignores the quota field', async () => {
    const result = await getConsumptionOverview({ username: 'tsou', password: 'secret' });

    expect(result.summary.accountType).toBe('permanent');
    expect(result.summary.dataUsed.raw).toBe(Math.round(421.6 * 1024 * 1024 * 1024));
    expect(result.summary.dataUsed.formatted).toBe('421.60');
    expect(result.summary.dataRemaining.raw).toBe(Math.round(378.4 * 1024 * 1024 * 1024));
    expect(result.summary.percDataUsed).toBe(53);
  });
});
