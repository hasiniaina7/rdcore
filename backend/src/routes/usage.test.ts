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
}));

vi.mock('../middleware/usageSession', () => ({
  extractUsageSession: vi.fn(),
  requireUsageSession: vi.fn(),
}));

import app from '../app';
import { fetchUsage, disconnectSessions } from '../services/usageService';
import { listActiveSessions, listInactiveSessions } from '../services/sessionService';
import { fetchUsageByUsername } from '../services/usageInsightsService';
import { extractUsageSession, requireUsageSession } from '../middleware/usageSession';

const mockedFetchUsage = fetchUsage as unknown as Mock;
const mockedDisconnectSessions = disconnectSessions as unknown as Mock;
const mockedListActiveSessions = listActiveSessions as unknown as Mock;
const mockedListInactiveSessions = listInactiveSessions as unknown as Mock;
const mockedFetchUsageByUsername = fetchUsageByUsername as unknown as Mock;
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
    mockedFetchUsageByUsername.mockResolvedValue({ username: 'alice', periods: [] });
    mockedListActiveSessions.mockResolvedValue({ sessions: [] });
    mockedListInactiveSessions.mockResolvedValue({ sessions: [] });

    const summaryRes = await request(app).get('/api/usage-by-username');
    const activeRes = await request(app).get('/api/active-sessions');
    const inactiveRes = await request(app).get('/api/inactive-sessions');

    expect(summaryRes.status).toBe(200);
    expect(activeRes.status).toBe(200);
    expect(inactiveRes.status).toBe(200);
    expect(mockedFetchUsageByUsername).toHaveBeenCalledWith('alice', undefined);
    expect(mockedListActiveSessions).toHaveBeenCalledWith('alice', undefined);
    expect(mockedListInactiveSessions).toHaveBeenCalledWith('alice', undefined);
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
});
