import { Router } from 'express';
import { fetchUsage, disconnectSessions } from '../services/usageService';
import { listActiveSessions, listInactiveSessions } from '../services/sessionService';
import { fetchUsageByUsername } from '../services/usageInsightsService';
import { z } from 'zod';

const router = Router();

router.get('/usage', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string(),
      password: z.string(),
      mac: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(10),
      withSessions: z.coerce.boolean().optional().default(true),
    });
    const params = schema.parse(req.query);
    const data = await fetchUsage(params.username, params.password, params.mac, params.limit, params.withSessions);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/usage/disconnect', async (req, res, next) => {
  try {
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
    const schema = z.object({
      username: z.string(),
      historyLimit: z.coerce.number().optional(),
    });
    const params = schema.parse(req.query);
    const data = await fetchUsageByUsername(params.username, params.historyLimit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/active-sessions', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string(),
      limit: z.coerce.number().optional(),
    });
    const params = schema.parse(req.query);
    const data = await listActiveSessions(params.username, params.limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/inactive-sessions', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string(),
      limit: z.coerce.number().optional(),
    });
    const params = schema.parse(req.query);
    const data = await listInactiveSessions(params.username, params.limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
