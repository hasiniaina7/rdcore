import request from 'supertest';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('../services/loginService', () => ({
  loginUsageUser: vi.fn(),
}));

import app from '../app';
import { loginUsageUser } from '../services/loginService';

const mockedLoginUsageUser = loginUsageUser as unknown as Mock;

describe('POST /api/login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates a usage session token upon successful login', async () => {
    mockedLoginUsageUser.mockResolvedValue({
      token: 'session-token',
      expiresAt: 123,
      profile: { username: 'bob', mac: '00:11:22', accountType: 'permanent' },
    });

    const res = await request(app).post('/api/login').send({ username: 'bob', password: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        token: 'session-token',
        expiresAt: 123,
        profile: { username: 'bob', mac: '00:11:22', accountType: 'permanent' },
      },
    });
    expect(mockedLoginUsageUser).toHaveBeenCalledWith({ username: 'bob', password: 'secret' });
  });

  it('validates required fields', async () => {
    const res = await request(app).post('/api/login').send({ username: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockedLoginUsageUser).not.toHaveBeenCalled();
  });
});
