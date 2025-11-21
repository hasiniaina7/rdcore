import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: axiosMocks.get,
    })),
  },
}));

const getMock = axiosMocks.get;

import { getSessions } from './radiusdeskIntegration';

describe('radiusdeskIntegration.getSessions', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: {} });
  });

  it('applies default sorting by start time desc', async () => {
    await getSessions('user', 10);
    const [, options] = getMock.mock.calls[0];
    expect(options.params.sort).toBe('acctstarttime');
    expect(options.params.dir).toBe('DESC');
  });

  it('allows overriding sort settings via extra params', async () => {
    await getSessions('user', 10, { extraParams: { sort: 'realm', dir: 'ASC' } });
    const [, options] = getMock.mock.calls[0];
    expect(options.params.sort).toBe('realm');
    expect(options.params.dir).toBe('ASC');
  });

  it('retries with lowercase username when the first attempt is empty', async () => {
    getMock.mockResolvedValueOnce({ data: { items: [] } });
    getMock.mockResolvedValueOnce({ data: { items: [{ id: 1 }] } });
    await getSessions('Zambey', 10);
    expect(getMock).toHaveBeenCalledTimes(2);
    const secondCallParams = getMock.mock.calls[1][1].params;
    expect(secondCallParams.username).toBe('zambey');
  });

  it('avoids duplicate requests when username already matches stored case', async () => {
    getMock.mockResolvedValueOnce({ data: { items: [{ id: 1 }] } });
    await getSessions('nolimit', 5);
    expect(getMock).toHaveBeenCalledTimes(1);
    const [, options] = getMock.mock.calls[0];
    expect(options.params.username).toBe('nolimit');
  });
});
