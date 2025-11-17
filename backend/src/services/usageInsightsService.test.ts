import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsageByUsername } from './usageInsightsService';
import { getSessions } from './radiusdeskIntegration';

vi.mock('./radiusdeskIntegration', () => ({
  getSessions: vi.fn(),
}));

const mockedGetSessions = vi.mocked(getSessions);

describe('fetchUsageByUsername', () => {
  beforeEach(() => {
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

  it('aggregates sessions across default periods', async () => {
    const result = await fetchUsageByUsername('demo@example.com', 100);

    expect(mockedGetSessions).toHaveBeenCalledWith('demo@example.com', 100, { onlyConnected: false });
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
  });

  it('throws when username is missing', async () => {
    await expect(fetchUsageByUsername('', 100)).rejects.toThrow('username is required');
  });
});
