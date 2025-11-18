import { Router } from 'express';
import { z } from 'zod';
import { listAdminAuthModes, loginAdmin, logoutAdmin } from '../services/adminAuthService';
import { requireAdminAuth } from '../middleware/adminAuth';
import { fetchAdminUserInsights } from '../services/adminInsightsService';

const router = Router();

router.get('/admin/auth-modes', (_req, res) => {
  const modes = listAdminAuthModes();
  res.json({ success: true, data: modes });
});

router.post('/admin/login', (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
      mode: z.enum(['static', 'radiusmysql']).optional(),
    });
    const body = schema.parse(req.body);
    const session = loginAdmin(body.username, body.password, body.mode);
    res.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        mode: session.mode,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/me', requireAdminAuth, (req, res) => {
  res.json({ success: true, data: req.adminSession });
});

router.post('/admin/logout', requireAdminAuth, (req, res) => {
  const token = (req as typeof req & { adminTokenValue?: string }).adminTokenValue;
  if (token) {
    logoutAdmin(token);
  }
  res.json({ success: true });
});

router.get('/admin/users/:username/insights', requireAdminAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().min(1),
      historyLimit: z.coerce.number().optional(),
    });
    const params = schema.parse({ ...req.params, ...req.query });
    const insights = await fetchAdminUserInsights(params.username, params.historyLimit);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
});

export default router;
