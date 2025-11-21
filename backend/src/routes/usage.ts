import { Router } from 'express';
import { fetchUsage, disconnectSessions } from '../services/usageService';
import { listActiveSessions, listInactiveSessions } from '../services/sessionService';
import { fetchUsageByUsername, fetchUsageTimeseries } from '../services/usageInsightsService';
import { z } from 'zod';
import { extractUsageSession, requireUsageSession } from '../middleware/usageSession';

const router = Router();
const booleanFromQuery = z
  .union([z.string(), z.boolean(), z.number()])
  .transform((value) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    const normalized = value.trim().toLowerCase();
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    return Boolean(normalized);
  });

const dateFromQuery = z.coerce.date().optional();
const granularityParam = z.enum(['hour', 'day', 'month']).optional();
const sessionStatusParam = z.enum(['all', 'active', 'inactive']).optional();

router.get('/usage', async (req, res, next) => {
  try {
    const schema = z.object({
      mac: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(10),
      withSessions: booleanFromQuery.optional().default(true),
    });
    const params = schema.parse(req.query);
    const session = extractUsageSession(req);
    const credentials = session
      ? {
          username: session.username,
          password: session.password,
          mac: session.mac,
        }
      : (() => {
          const authSchema = z.object({
            username: z.string(),
            password: z.string(),
            mac: z.string().optional(),
          });
          const auth = authSchema.parse(req.query);
          return auth;
        })();
    const mac = params.mac || credentials.mac;
    const data = await fetchUsage(credentials.username, credentials.password, mac, params.limit, params.withSessions);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/usage/disconnect', async (req, res, next) => {
  try {
    requireUsageSession(req);
    const schema = z.object({
      radacctIds: z.array(z.string()).nonempty(),
    });
    const body = schema.parse(req.body);
    await disconnectSessions(body.radacctIds);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/usage-by-username', async (req, res, next) => {
  try {
    const session = requireUsageSession(req);
    const schema = z.object({
      historyLimit: z.coerce.number().optional(),
      startDate: dateFromQuery,
      endDate: dateFromQuery,
      granularity: granularityParam,
    });
    const params = schema.parse(req.query);
    const data = await fetchUsageByUsername(session.username, {
      historyLimit: params.historyLimit,
      startDate: params.startDate,
      endDate: params.endDate,
      granularity: params.granularity,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/usage/timeseries', async (req, res, next) => {
  try {
    const session = requireUsageSession(req);
    const schema = z.object({
      historyLimit: z.coerce.number().optional(),
      startDate: dateFromQuery,
      endDate: dateFromQuery,
      granularity: granularityParam,
    });
    const params = schema.parse(req.query);
    const data = await fetchUsageTimeseries(session.username, {
      historyLimit: params.historyLimit,
      startDate: params.startDate,
      endDate: params.endDate,
      granularity: params.granularity,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/active-sessions', async (req, res, next) => {
  try {
    const session = requireUsageSession(req);
    const schema = z.object({
      limit: z.coerce.number().optional(),
      startDate: dateFromQuery,
      endDate: dateFromQuery,
      status: sessionStatusParam,
    });
    const params = schema.parse(req.query);
    const data = await listActiveSessions(
      session.username,
      {
        limit: params.limit,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status,
      },
      session.mac
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/inactive-sessions', async (req, res, next) => {
  try {
    const session = requireUsageSession(req);
    const schema = z.object({
      limit: z.coerce.number().optional(),
      startDate: dateFromQuery,
      endDate: dateFromQuery,
      status: sessionStatusParam,
    });
    const params = schema.parse(req.query);
    const data = await listInactiveSessions(
      session.username,
      {
        limit: params.limit,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status,
      },
      session.mac
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
