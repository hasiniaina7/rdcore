import request from 'supertest';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import createError from 'http-errors';

vi.mock('../services/usageService', () => ({
  fetchUsage: vi.fn(),
  disconnectSessions: vi.fn(),
}));

vi.mock('../services/sessionService', () => ({
  listActiveSessions: vi.fn(),
  listInactiveSessions: vi.fn(),
}));

vi.mock('../services/usageInsightsService', () => ({
  fetchUsageByUsername: vi.fn(),
  fetchUsageTimeseries: vi.fn(),
}));

vi.mock('../middleware/usageSession', () => ({
  extractUsageSession: vi.fn(),
  requireUsageSession: vi.fn(),
}));

import app from '../app';
import { fetchUsage, disconnectSessions } from '../services/usageService';
import { listActiveSessions, listInactiveSessions } from '../services/sessionService';
import { fetchUsageByUsername, fetchUsageTimeseries } from '../services/usageInsightsService';
import { extractUsageSession, requireUsageSession } from '../middleware/usageSession';

const mockedFetchUsage = fetchUsage as unknown as Mock;
const mockedDisconnectSessions = disconnectSessions as unknown as Mock;
const mockedListActiveSessions = listActiveSessions as unknown as Mock;
const mockedListInactiveSessions = listInactiveSessions as unknown as Mock;
const mockedFetchUsageByUsername = fetchUsageByUsername as unknown as Mock;
const mockedFetchUsageTimeseries = fetchUsageTimeseries as unknown as Mock;
const mockedExtractUsageSession = extractUsageSession as unknown as Mock;
const mockedRequireUsageSession = requireUsageSession as unknown as Mock;

describe('usage routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('prefers session credentials for /usage', async () => {
    mockedExtractUsageSession.mockReturnValue({
      username: 'alice',
      password: 'pw',
      mac: '00:11',
    });
    mockedFetchUsage.mockResolvedValue({ username: 'alice', mac: '00:11' });

    const res = await request(app).get('/api/usage?limit=5&withSessions=false');

    expect(res.status).toBe(200);
    expect(mockedFetchUsage).toHaveBeenCalledWith('alice', 'pw', '00:11', 5, false);
  });

  it('falls back to explicit credentials when no session token is provided', async () => {
    mockedExtractUsageSession.mockReturnValue(null);
    mockedFetchUsage.mockResolvedValue({ username: 'bob', mac: 'aa:bb' });

    const res = await request(app).get('/api/usage?username=bob&password=secret&limit=5');

    expect(res.status).toBe(200);
    expect(mockedFetchUsage).toHaveBeenCalledWith('bob', 'secret', undefined, 5, true);
  });

  it('requires a session token for derived usage endpoints', async () => {
    mockedRequireUsageSession.mockReturnValue({
      username: 'alice',
      password: 'pw',
      mac: 'ff:ee',
    });
    mockedFetchUsageByUsername.mockResolvedValue({
      username: 'alice',
      historyLimit: 100,
      macs: [],
      periods: [],
      series: { startDate: '', endDate: '', granularity: 'day', buckets: [] },
    });
    mockedListActiveSessions.mockResolvedValue({ sessions: [] });
    mockedListInactiveSessions.mockResolvedValue({ sessions: [] });

    const summaryRes = await request(app).get('/api/usage-by-username');
    const activeRes = await request(app).get('/api/active-sessions');
    const inactiveRes = await request(app).get('/api/inactive-sessions');

    expect(summaryRes.status).toBe(200);
    expect(activeRes.status).toBe(200);
    expect(inactiveRes.status).toBe(200);
    expect(mockedFetchUsageByUsername).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ historyLimit: undefined, granularity: undefined })
    );
    expect(mockedListActiveSessions).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ limit: undefined, status: undefined })
    );
    expect(mockedListInactiveSessions).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ limit: undefined, status: undefined })
    );
  });

  it('rejects requests when the session token is missing', async () => {
    mockedRequireUsageSession.mockImplementation(() => {
      throw createError(401, 'Session token required');
    });

    const res = await request(app).get('/api/usage-by-username');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(mockedFetchUsageByUsername).not.toHaveBeenCalled();
  });

  it('checks session existence before disconnecting sessions', async () => {
    mockedRequireUsageSession.mockReturnValue({
      username: 'alice',
      password: 'pw',
    });
    mockedDisconnectSessions.mockResolvedValue(undefined);

    const res = await request(app).post('/api/usage/disconnect').send({ radacctIds: ['1'] });

    expect(res.status).toBe(200);
    expect(mockedDisconnectSessions).toHaveBeenCalledWith(['1']);
  });

  it('passes time filters to insights endpoints', async () => {
    mockedRequireUsageSession.mockReturnValue({ username: 'alice' });
    mockedFetchUsageByUsername.mockResolvedValue({
      username: 'alice',
      historyLimit: 123,
      macs: [],
      periods: [],
      series: { startDate: '', endDate: '', granularity: 'day', buckets: [] },
    });

    const res = await request(app).get(
      '/api/usage-by-username?historyLimit=250&startDate=2024-05-01&endDate=2024-05-07&granularity=hour'
    );

    expect(res.status).toBe(200);
    expect(mockedFetchUsageByUsername).toHaveBeenCalledTimes(1);
    const [, options] = mockedFetchUsageByUsername.mock.calls[0];
    expect(options).toMatchObject({
      historyLimit: 250,
      granularity: 'hour',
    });
    expect(options?.startDate).toEqual(new Date('2024-05-01T00:00:00.000Z'));
    expect(options?.endDate).toEqual(new Date('2024-05-07T00:00:00.000Z'));
  });

  it('returns usage timeseries data', async () => {
    mockedRequireUsageSession.mockReturnValue({ username: 'alice' });
    mockedFetchUsageTimeseries.mockResolvedValue({
      startDate: '2024-05-01T00:00:00.000Z',
      endDate: '2024-05-07T23:59:59.000Z',
      granularity: 'day',
      buckets: [],
    });

    const res = await request(app).get('/api/usage/timeseries?granularity=day');

    expect(res.status).toBe(200);
    expect(mockedFetchUsageTimeseries).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ granularity: 'day' })
    );
    expect(res.body.data.granularity).toBe('day');
  });

  it('forwards filters to session list endpoints', async () => {
    mockedRequireUsageSession.mockReturnValue({ username: 'alice' });
    mockedListActiveSessions.mockResolvedValue({ sessions: [] });
    mockedListInactiveSessions.mockResolvedValue({ sessions: [] });

    const activeRes = await request(app).get(
      '/api/active-sessions?limit=10&startDate=2024-05-01&endDate=2024-05-07&status=inactive'
    );
    expect(activeRes.status).toBe(200);
    expect(mockedListActiveSessions).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ limit: 10, status: 'inactive' })
    );
    const [, activeOptions] = mockedListActiveSessions.mock.calls[0];
    expect(activeOptions?.startDate).toEqual(new Date('2024-05-01T00:00:00.000Z'));
    expect(activeOptions?.endDate).toEqual(new Date('2024-05-07T00:00:00.000Z'));
  });
});
