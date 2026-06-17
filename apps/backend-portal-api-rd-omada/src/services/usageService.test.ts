import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUsage } from './usageService';
import { getUsage, getSessions, findPermanentUser, findVoucher } from './radiusdeskIntegration';

vi.mock('./radiusdeskIntegration', () => ({
  getUsage: vi.fn(),
  getSessions: vi.fn(),
  kickSessions: vi.fn(),
  findPermanentUser: vi.fn(),
  findVoucher: vi.fn(),
}));

const mockedGetUsage = vi.mocked(getUsage);
const mockedGetSessions = vi.mocked(getSessions);
const mockedFindPermanentUser = vi.mocked(findPermanentUser);
const mockedFindVoucher = vi.mocked(findVoucher);

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetUsage.mockResolvedValue({ data: {} });
  mockedGetSessions.mockResolvedValue({ items: [] });
  mockedFindPermanentUser.mockResolvedValue({ items: [] });
  mockedFindVoucher.mockResolvedValue({ items: [] });
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

  it('trims and forwards the MAC address when provided without calling getSessions unnecessarily', async () => {
    await fetchUsage('user', 'secret', '  AA:BB:CC  ', 10, false);

    expect(mockedGetUsage).toHaveBeenCalledWith('user', {
      password: 'secret',
      mac: 'AA:BB:CC',
    });
    expect(mockedGetSessions).not.toHaveBeenCalled();
  });

  it('returns quota data when no session MAC is available but permanent user info exists', async () => {
    mockedGetSessions.mockResolvedValue({ items: [] });
    mockedFindPermanentUser.mockResolvedValue({
      items: [{ data_used: 123, data_cap: 456, time_cap: 3600 }],
    });

    const result = await fetchUsage('user', 'secret', undefined, 5, true);
    expect(result.accountType).toBe('permanent');
    expect(result.mac).toBeUndefined();
    expect(result.dataUsed).toBe(123);
    expect(result.dataCap).toBe(456);
    expect(result.sessions).toHaveLength(0);
  });

  it('still throws when no MAC or quota metadata are available', async () => {
    mockedGetSessions.mockResolvedValue({ items: [] });
    mockedFindPermanentUser.mockResolvedValue({ items: [] });
    mockedFindVoucher.mockResolvedValue({ items: [] });

    await expect(fetchUsage('user', 'secret', undefined, 5, true)).rejects.toThrow(
      'Unable to determine MAC address for this user'
    );
  });
});
