import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUsage } from './usageService';
import {
  getUsage,
  getSessions,
  findPermanentUser,
  findVoucher,
  getPermanentUserPassword,
} from './radiusdeskIntegration';

vi.mock('./radiusdeskIntegration', () => ({
  getUsage: vi.fn(),
  getSessions: vi.fn(),
  kickSessions: vi.fn(),
  findPermanentUser: vi.fn(),
  findVoucher: vi.fn(),
  getPermanentUserPassword: vi.fn(),
}));

const mockedGetUsage = vi.mocked(getUsage);
const mockedGetSessions = vi.mocked(getSessions);
const mockedFindPermanentUser = vi.mocked(findPermanentUser);
const mockedFindVoucher = vi.mocked(findVoucher);
const mockedGetPermanentUserPassword = vi.mocked(getPermanentUserPassword);

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetUsage.mockResolvedValue({ data: {} });
  mockedGetSessions.mockResolvedValue({ items: [] });
  mockedFindPermanentUser.mockResolvedValue({ items: [{ id: 'user-1', username: 'user' }] });
  mockedGetPermanentUserPassword.mockResolvedValue({ value: 'secret' });
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

  it('returns partial data when the MAC cannot be resolved', async () => {
    mockedGetSessions.mockResolvedValue({ items: [] });

    const result = await fetchUsage('user', 'secret', undefined, 5, true);

    expect(mockedGetSessions).toHaveBeenCalledWith('user', 5);
    expect(mockedGetUsage).not.toHaveBeenCalled();
    expect(result.sessions).toEqual([]);
    expect(result.mac).toBeUndefined();
  });

  it('trims and forwards the MAC address when provided without calling getSessions unnecessarily', async () => {
    await fetchUsage('user', 'secret', '  AA:BB:CC  ', 10, false);

    expect(mockedGetUsage).toHaveBeenCalledWith('user', {
      password: 'secret',
      mac: 'AA:BB:CC',
    });
    expect(mockedGetSessions).not.toHaveBeenCalled();
  });

  it('rejects when the permanent user password does not match', async () => {
    mockedGetPermanentUserPassword.mockResolvedValue({ value: 'different' });

    await expect(fetchUsage('user', 'secret', undefined, 5, true)).rejects.toThrow('Invalid username or password');
  });

  it('falls back to voucher validation when no permanent user exists', async () => {
    mockedFindPermanentUser.mockResolvedValue({ items: [] });
    mockedFindVoucher.mockResolvedValue({ items: [{ name: 'user', password: 'secret' }] });

    const result = await fetchUsage('user', 'secret', undefined, 5, false);

    expect(mockedFindVoucher).toHaveBeenCalled();
    expect(result.username).toBe('user');
  });
});
