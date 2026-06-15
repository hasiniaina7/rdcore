import { randomBytes } from 'crypto';
import { LRUCache as _LRUCache } from 'lru-cache';
const LRUCache = require('lru-cache') as typeof _LRUCache;
import config from '../config';

export type UsageSessionPayload = {
  username: string;
  password: string;
  mac?: string;
};

const ttlMs = config.USAGE_SESSION_TTL_MINUTES * 60 * 1000;

const sessionStore = new LRUCache<string, UsageSessionPayload>({
  max: config.USAGE_SESSION_CACHE_SIZE,
  ttl: ttlMs,
  updateAgeOnGet: true,
});

export function createUsageSession(payload: UsageSessionPayload) {
  const token = randomBytes(32).toString('hex');
  sessionStore.set(token, { ...payload });
  const expiresAt = Date.now() + ttlMs;
  return { token, expiresAt };
}

export function getUsageSession(token: string): UsageSessionPayload | null {
  return sessionStore.get(token) ?? null;
}

export function deleteUsageSession(token: string) {
  sessionStore.delete(token);
}
