import { Router } from 'express';
import { z } from 'zod';
import createError from 'http-errors';
import { getConsumptionOverview, disconnectSessionsWithCredentials } from '../services/consumptionService';

const router = Router();

const loginSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const username = value.username.trim();
    const password = value.password.trim();
    const minLength = username.length + 5;
    if (!password.startsWith(username) || password.length < minLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message:
          'Password doit commencer par le username et contenir au moins 5 caractères supplémentaires (ex: Box15-wifi).',
      });
    }
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

const disconnectSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
    radacctIds: z.array(z.string()).nonempty(),
  })
  .superRefine((value, ctx) => {
    const username = value.username.trim();
    const password = value.password.trim();
    const minLength = username.length + 5;
    if (!password.startsWith(username) || password.length < minLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message:
          'Password doit commencer par le username et contenir au moins 5 caractères supplémentaires (ex: Box15-wifi).',
      });
    }
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
