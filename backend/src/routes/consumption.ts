import { Router } from 'express';
import { z } from 'zod';
import createError from 'http-errors';
import { getConsumptionOverview, disconnectSessionsWithCredentials } from '../services/consumptionService';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/consumption/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid credentials payload');
    }
    const data = await getConsumptionOverview(parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

const disconnectSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  radacctIds: z.array(z.string()).nonempty(),
});

router.post('/sessions/disconnect', async (req, res, next) => {
  try {
    const parsed = disconnectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid disconnect payload');
    }
    const result = await disconnectSessionsWithCredentials(parsed.data);
    res.json({ success: result.success });
  } catch (error) {
    next(error);
  }
});

export default router;
