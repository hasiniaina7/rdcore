import { LRUCache } from 'lru-cache';
import { fetchDynamicDetails } from './radiusdeskIntegration';
import { DynamicDetailResponse } from '../types';
import { dynamicCacheGauge } from '../utils/metrics';

const cache = new LRUCache<string, DynamicDetailResponse>({
  ttl: 15 * 1000,
  allowStale: false,
  max: 100,
});

export async function getDynamicDetail(query: Record<string, unknown>) {
  const cacheKey = JSON.stringify(query);
  if (cache.has(cacheKey)) {
    return { data: cache.get(cacheKey)!, hit: true };
  }
  const detail = await fetchDynamicDetails(query);
  cache.set(cacheKey, detail);
  dynamicCacheGauge.set(cache.size);
  return { data: detail, hit: false };
}
