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

    const result = await listActiveSessions('demo', { limit: 5 });

    expect(mockedGetSessions).toHaveBeenCalledWith('demo', 5, undefined);
    expect(result.sessions).toHaveLength(2);
    expect(result.radiusdeskTotal).toBe(2);
  });

  it('filters inactive sessions', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ acctstoptime: 'now' }, { acctstoptime: null }, { acctstoptime: 'yesterday' }],
      totalCount: 3,
    });

    const result = await listInactiveSessions('demo', { limit: 1 });

    expect(mockedGetSessions).toHaveBeenCalledWith('demo', 2, { onlyConnected: false });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].acctstoptime).toBe('now');
    expect(result.totalCount).toBe(1);
  });

  it('applies date filters to session lists', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [
        { acctstoptime: 'now', acctstarttime: '2024-05-02T10:00:00Z' },
        { acctstoptime: 'old', acctstarttime: '2024-04-20T10:00:00Z' },
      ],
    });

    const result = await listInactiveSessions('demo', {
      limit: 5,
      startDate: new Date('2024-05-01T00:00:00Z'),
      endDate: new Date('2024-05-03T23:59:59Z'),
    });

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].acctstoptime).toBe('now');
  });

  it('honors status filter for active sessions', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ acctstoptime: null, acctstarttime: '2024-05-02T10:00:00Z' }],
    });

    const result = await listActiveSessions('demo', { limit: 5, status: 'inactive' });

    expect(result.sessions).toHaveLength(0);
  });

  it('validates username', async () => {
    await expect(listActiveSessions('', { limit: 5 })).rejects.toThrow('username is required');
    await expect(listInactiveSessions('', { limit: 5 })).rejects.toThrow('username is required');
  });

  it('treats zero stop times as active', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ acctstoptime: '0000-00-00 00:00:00', acctstarttime: '2024-05-02T10:00:00Z' }],
    });

    const result = await listActiveSessions('demo', { limit: 5 });
    expect(result.sessions).toHaveLength(1);
  });

  it('uses the active flag when provided by RadiusDesk', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ acctstoptime: 1205182, active: true, acctstarttime: '2024-05-02T10:00:00Z' }],
    });

    const result = await listActiveSessions('demo', { limit: 5 });
    expect(result.sessions).toHaveLength(1);
  });

  it('falls back to MAC-based lookup when username query is empty', async () => {
    mockedGetSessions
      .mockResolvedValueOnce({ items: [], totalCount: 0 })
      .mockResolvedValueOnce({ items: [{ acctstoptime: null }], totalCount: 1 });

    const result = await listActiveSessions('Demo', { limit: 5 }, 'AA-BB-CC-11-22-33');

    expect(mockedGetSessions).toHaveBeenNthCalledWith(1, 'Demo', 5, undefined);
    expect(mockedGetSessions).toHaveBeenNthCalledWith(
      2,
      '',
      5,
      expect.objectContaining({
        caseInsensitive: false,
        extraParams: expect.objectContaining({ callingstationid: 'AA-BB-CC-11-22-33' }),
      })
    );
    expect(result.sessions).toHaveLength(1);
  });
});
