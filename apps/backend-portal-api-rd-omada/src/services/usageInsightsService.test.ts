import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsageByUsername, fetchUsageTimeseries } from './usageInsightsService';
import { getSessions } from './radiusdeskIntegration';

vi.mock('./radiusdeskIntegration', () => ({
  getSessions: vi.fn(),
}));

const mockedGetSessions = vi.mocked(getSessions);

describe('usageInsightsService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T12:00:00.000Z'));
    vi.clearAllMocks();
    const now = Date.now();
    mockedGetSessions.mockResolvedValue({
      items: [
        {
          acctstarttime: new Date(now - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          acctsessiontime: 600,
          acctinputoctets: 1024,
          acctoutputoctets: 2048,
          callingstationid: 'AA-BB-CC',
        },
        {
          acctstarttime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          acctsessiontime: 1200,
          acctinputoctets: 4096,
          acctoutputoctets: 1024,
          callingstationid: 'DD-EE-FF',
        },
        {
          acctstarttime: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          acctsessiontime: 60,
          acctinputoctets: 512,
          acctoutputoctets: 512,
          callingstationid: 'AA-BB-CC',
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates sessions across default periods', async () => {
    const result = await fetchUsageByUsername('demo@example.com', { historyLimit: 100 });

    expect(mockedGetSessions).toHaveBeenNthCalledWith(1, 'demo@example.com', 100, { onlyConnected: false });
    expect(mockedGetSessions).toHaveBeenNthCalledWith(2, 'demo@example.com', 100, { onlyConnected: true });
    expect(result.username).toBe('demo@example.com');
    expect(result.macs).toEqual(['AA-BB-CC', 'DD-EE-FF']);
    const hourly = result.periods.find((p) => p.period === 'hourly');
    expect(hourly).toMatchObject({
      totalBytes: 3072,
      sessionCount: 1,
    });
    const weekly = result.periods.find((p) => p.period === 'weekly');
    expect(weekly?.sessionCount).toBeGreaterThanOrEqual(2);
    const monthly = result.periods.find((p) => p.period === 'monthly');
    expect(monthly?.sessionCount).toBe(3);
    expect(result.series.buckets.length).toBeGreaterThan(0);
    expect(result.series.granularity).toBe('day');
  });

  it('counts monthly usage from the start of the current calendar month', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [
        {
          acctstarttime: '2026-05-15T10:00:00.000Z',
          acctsessiontime: 600,
          acctinputoctets: 1024,
          acctoutputoctets: 2048,
          callingstationid: 'AA-BB-CC',
        },
        {
          acctstarttime: '2026-06-02T10:00:00.000Z',
          acctsessiontime: 1200,
          acctinputoctets: 4096,
          acctoutputoctets: 1024,
          callingstationid: 'DD-EE-FF',
        },
      ],
    });

    const result = await fetchUsageByUsername('demo@example.com', { historyLimit: 100, endDate: new Date('2026-06-17T12:00:00.000Z') });
    const monthly = result.periods.find((p) => p.period === 'monthly');

    expect(monthly).toMatchObject({
      totalBytes: 5120,
      totalTimeSeconds: 1200,
      sessionCount: 1,
    });
  });

  it('throws when username is missing', async () => {
    await expect(fetchUsageByUsername('', { historyLimit: 100 })).rejects.toThrow('username is required');
  });

  it('builds timeseries with selected granularity', async () => {
    const start = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const end = new Date();
    const series = await fetchUsageTimeseries('demo@example.com', {
      historyLimit: 120,
      granularity: 'hour',
      startDate: start,
      endDate: end,
    });

    expect(mockedGetSessions).toHaveBeenNthCalledWith(1, 'demo@example.com', 120, { onlyConnected: false });
    expect(mockedGetSessions).toHaveBeenNthCalledWith(2, 'demo@example.com', 120, { onlyConnected: true });
    expect(series.granularity).toBe('hour');
    expect(series.buckets.length).toBeGreaterThan(0);
  });
});
