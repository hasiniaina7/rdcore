import request from 'supertest';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('../services/dynamicService', () => ({
  getDynamicDetail: vi.fn(),
}));

import app from '../app';
import { getDynamicDetail } from '../services/dynamicService';
const mockedGetDynamicDetail = getDynamicDetail as unknown as Mock;

describe('GET /api/dynamic/details', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('surfaces success payloads from RadiusDesk', async () => {
    mockedGetDynamicDetail.mockResolvedValue({
      data: { success: true, data: { detail: { name: 'Lobby' } } },
      hit: false,
    });

    const res = await request(app).get('/api/dynamic/details?key=lobby');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { detail: { name: 'Lobby' } },
      message: undefined,
    });
    expect(res.headers['x-cache-status']).toBe('MISS');
  });

  it('propagates failure payloads to the frontend', async () => {
    mockedGetDynamicDetail.mockResolvedValue({
      data: { success: false, data: { key: 'invalid' }, message: 'not found' },
      hit: true,
    });

    const res = await request(app).get('/api/dynamic/details?key=unknown');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: false,
      data: { key: 'invalid' },
      message: 'not found',
    });
    expect(res.headers['x-cache-status']).toBe('HIT');
  });
});
