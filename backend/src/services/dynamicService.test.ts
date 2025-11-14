import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./radiusdeskIntegration', () => ({
  fetchDynamicDetails: vi.fn(async () => ({ success: true, data: { detail: { name: 'Demo' } } })),
}));

vi.mock('../utils/metrics', () => ({
  dynamicCacheGauge: {
    set: vi.fn(),
  },
}));

import { getDynamicDetail, resetDynamicDetailCache } from './dynamicService';
import { fetchDynamicDetails } from './radiusdeskIntegration';

describe('dynamicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDynamicDetailCache();
  });

  it('injects default language when missing', async () => {
    await getDynamicDetail({ key: 'demo' });
    expect(fetchDynamicDetails).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'demo', language: 'fr_FR' })
    );
  });

  it('prefers explicit lang over default', async () => {
    await getDynamicDetail({ lang: 'en_US', clientMac: 'aa-bb' });
    expect(fetchDynamicDetails).toHaveBeenCalledWith(
      expect.objectContaining({ lang: 'en_US', clientMac: 'aa-bb', language: 'en_US' })
    );
  });

  it('returns cached payload on repeat queries', async () => {
    const resultA = await getDynamicDetail({ key: 'demo' });
    const resultB = await getDynamicDetail({ key: 'demo' });
    expect(resultA.data).toEqual(resultB.data);
    expect(fetchDynamicDetails).toHaveBeenCalledTimes(1);
  });
});
