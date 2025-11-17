import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUsage } from './usageService';
import { getUsage, getSessions } from './radiusdeskIntegration';

vi.mock('./radiusdeskIntegration', () => ({
  getUsage: vi.fn(),
  getSessions: vi.fn(),
  kickSessions: vi.fn(),
}));

const mockedGetUsage = vi.mocked(getUsage);
const mockedGetSessions = vi.mocked(getSessions);

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetUsage.mockResolvedValue({ data: {} });
  mockedGetSessions.mockResolvedValue({ items: [] });
});

describe('fetchUsage', () => {
  it('derives the MAC from sessions when it is missing', async () => {
    mockedGetSessions.mockResolvedValue({
      items: [{ callingstationid: 'AA:BB:CC:DD:EE:FF' }],
    });

    await fetchUsage('user', 'secret', undefined, 5, false);

    expect(mockedGetSessions).toHaveBeenCalledWith('user', 5);
    expect(mockedGetUsage).toHaveBeenCalledWith('user', { password: 'secret', mac: 'AA:BB:CC:DD:EE:FF' });
  });

  it('rejects when the MAC cannot be resolved', async () => {
    mockedGetSessions.mockResolvedValue({ items: [] });

    await expect(fetchUsage('user', 'secret', undefined, 5, true)).rejects.toThrow(
      'Unable to determine MAC address for this user'
    );
  });

  it('trims and forwards the MAC address when provided without calling getSessions unnecessarily', async () => {
    await fetchUsage('user', 'secret', '  AA:BB:CC  ', 10, false);

    expect(mockedGetUsage).toHaveBeenCalledWith('user', {
      password: 'secret',
      mac: 'AA:BB:CC',
    });
    expect(mockedGetSessions).not.toHaveBeenCalled();
  });

  it('throws a 404 when it cannot determine a MAC', async () => {
    mockedGetSessions.mockResolvedValue({ items: [] });

    await expect(fetchUsage('user', 'secret', undefined, 5, true)).rejects.toThrow(
      'Unable to determine MAC address for this user'
    );
  });
});
