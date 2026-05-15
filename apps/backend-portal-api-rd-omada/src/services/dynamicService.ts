import { LRUCache } from 'lru-cache';
import { fetchDynamicDetails } from './radiusdeskIntegration';
import { DynamicDetailResponse } from '../types';
import config from '../config';
import { dynamicCacheGauge } from '../utils/metrics';

const cache = new LRUCache<string, DynamicDetailResponse>({
  ttl: 15 * 1000,
  allowStale: false,
  max: 100,
});

function normalizeQuery(query: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...query };
  if (!normalized.language && normalized.lang) {
    normalized.language = normalized.lang;
  }
  if (!normalized.language && config.DEFAULT_LANGUAGE) {
    normalized.language = config.DEFAULT_LANGUAGE;
  }
  return normalized;
}

export async function getDynamicDetail(query: Record<string, unknown>) {
  const normalizedQuery = normalizeQuery(query);
  const cacheKey = JSON.stringify(normalizedQuery);
  if (cache.has(cacheKey)) {
    return { data: cache.get(cacheKey)!, hit: true };
  }
  const detail = await fetchDynamicDetails(normalizedQuery);
  cache.set(cacheKey, detail);
  dynamicCacheGauge.set(cache.size);
  return { data: detail, hit: false };
}

export function resetDynamicDetailCache() {
  cache.clear();
  dynamicCacheGauge.set(cache.size);
}
