import { Router } from 'express';
import createError from 'http-errors';
import { z } from 'zod';
import { loginUsageUser } from '../services/loginService';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
      mac: z.string().optional(),
    });
    const body = schema.safeParse(req.body);
    if (!body.success) {
      throw createError(400, 'Invalid credentials payload');
    }
    const result = await loginUsageUser(body.data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
