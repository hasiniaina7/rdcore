import { Router } from 'express';
import { fetchUsage, disconnectSessions } from '../services/usageService';
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

export default router;
