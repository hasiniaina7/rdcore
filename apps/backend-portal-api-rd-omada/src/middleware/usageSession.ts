import type { Request } from 'express';
import createError from 'http-errors';
import { getUsageSession } from '../services/usageSessionStore';

export type UsageSessionContext = {
  token: string;
  username: string;
  password: string;
  mac?: string;
};

const BEARER_PREFIX = /^Bearer\s+/i;

export function extractUsageSession(req: Request): UsageSessionContext | null {
  const authHeader = req.get('authorization');
  if (!authHeader) {
    return null;
  }
  if (!BEARER_PREFIX.test(authHeader)) {
    return null;
  }
  const token = authHeader.replace(BEARER_PREFIX, '').trim();
  if (!token) {
    throw createError(401, 'Invalid session token');
  }
  const session = getUsageSession(token);
  if (!session) {
    throw createError(401, 'Invalid session token');
  }
  return { token, ...session };
}

export function requireUsageSession(req: Request): UsageSessionContext {
  const session = extractUsageSession(req);
  if (!session) {
    throw createError(401, 'Session token required');
  }
  return session;
}
