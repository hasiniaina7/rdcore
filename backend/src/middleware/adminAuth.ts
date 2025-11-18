import type { RequestHandler } from 'express';
import createError from 'http-errors';
import { verifyAdminToken } from '../services/adminAuthService';

export const requireAdminAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return next(createError(401, 'Admin token required'));
  }
  const token = authorization.slice(7);
  const session = verifyAdminToken(token);
  if (!session) {
    return next(createError(401, 'Invalid or expired admin token'));
  }
  req.adminSession = { username: session.username, mode: session.mode };
  req.adminTokenValue = token;
  return next();
};
