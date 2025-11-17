import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listActiveSessions, listInactiveSessions } from './sessionService';
import { getSessions } from './radiusdeskIntegration';

vi.mock('./radiusdeskIntegration', () => ({
  getSessions: vi.fn(),
}));

const mockedGetSessions = vi.mocked(getSessions);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sessionService', () => {
  it('lists active sessions', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ acctstoptime: null }, { acctstoptime: null }],
      totalCount: 2,
    });

    const result = await listActiveSessions('demo', 5);

    expect(mockedGetSessions).toHaveBeenCalledWith('demo', 5, { onlyConnected: true });
    expect(result.sessions).toHaveLength(2);
    expect(result.radiusdeskTotal).toBe(2);
  });

  it('filters inactive sessions', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ acctstoptime: 'now' }, { acctstoptime: null }, { acctstoptime: 'yesterday' }],
      totalCount: 3,
    });

    const result = await listInactiveSessions('demo', 1);

    expect(mockedGetSessions).toHaveBeenCalledWith('demo', 2, { onlyConnected: false });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].acctstoptime).toBe('now');
    expect(result.totalCount).toBe(1);
  });

  it('validates username', async () => {
    await expect(listActiveSessions('', 5)).rejects.toThrow('username is required');
    await expect(listInactiveSessions('', 5)).rejects.toThrow('username is required');
  });
});
