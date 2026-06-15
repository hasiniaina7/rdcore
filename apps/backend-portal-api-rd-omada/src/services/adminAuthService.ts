import crypto from 'crypto';
import { LRUCache as _LRUCache } from 'lru-cache';
const LRUCache = require('lru-cache') as typeof _LRUCache;
import createError from 'http-errors';
import config from '../config';
import type { AdminAuthMode, AdminSession } from '../types';

interface AdminCredentials {
  username: string;
  password: string;
}

interface AdminToken extends AdminSession {
  token: string;
  expiresAt: number;
}

const ttlMs = config.ADMIN_TOKEN_TTL_MINUTES * 60 * 1000;
const tokenStore = new LRUCache<string, AdminToken>({ ttl: ttlMs, max: 500 });

const isStaticConfigured = Boolean(config.ADMIN_STATIC_USER && config.ADMIN_STATIC_PASSWORD);
const isMysqlConfigured = Boolean(config.RADIUS_MYSQL_USER && config.RADIUS_MYSQL_PASSWORD);

const availableModes: AdminAuthMode[] = [];
if (isStaticConfigured) {
  availableModes.push('static');
}
if (isMysqlConfigured) {
  availableModes.push('radiusmysql');
}

const defaultMode: AdminAuthMode | null = (() => {
  if (availableModes.includes(config.ADMIN_AUTH_MODE)) {
    return config.ADMIN_AUTH_MODE;
  }
  return availableModes[0] ?? null;
})();

function getCredentialsForMode(mode: AdminAuthMode): AdminCredentials | null {
  if (mode === 'static') {
    if (!isStaticConfigured || !config.ADMIN_STATIC_USER || !config.ADMIN_STATIC_PASSWORD) {
      return null;
    }
    return { username: config.ADMIN_STATIC_USER, password: config.ADMIN_STATIC_PASSWORD };
  }
  if (!isMysqlConfigured || !config.RADIUS_MYSQL_USER || !config.RADIUS_MYSQL_PASSWORD) {
    return null;
  }
  return { username: config.RADIUS_MYSQL_USER, password: config.RADIUS_MYSQL_PASSWORD };
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function listAdminAuthModes() {
  return {
    availableModes,
    defaultMode,
  };
}

export function loginAdmin(username: string, password: string, requestedMode?: AdminAuthMode) {
  if (!availableModes.length) {
    throw createError(503, 'Admin authentication is not configured');
  }
  const targetMode = (requestedMode && availableModes.includes(requestedMode) ? requestedMode : defaultMode) ?? availableModes[0];
  const credentials = getCredentialsForMode(targetMode);
  if (!credentials) {
    throw createError(503, 'Admin mode unavailable');
  }
  if (!safeCompare(username, credentials.username) || !safeCompare(password, credentials.password)) {
    throw createError(401, 'Invalid administrator credentials');
  }
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + ttlMs;
  const payload: AdminToken = {
    username: credentials.username,
    mode: targetMode,
    token,
    expiresAt,
  };
  tokenStore.set(token, payload);
  return payload;
}

export function verifyAdminToken(token: string): AdminToken | null {
  if (!token) {
    return null;
  }
  return tokenStore.get(token) ?? null;
}

export function logoutAdmin(token: string) {
  tokenStore.delete(token);
}
