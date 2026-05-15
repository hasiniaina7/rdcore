import { Router } from 'express';
import register from '../utils/metrics';
import { readyCheck } from '../services/omadaIntegration';
import { getDynamicDetail } from '../services/dynamicService';

const router = Router();

router.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', success: true });
});

router.get('/readyz', async (_req, res, next) => {
  try {
    await Promise.all([readyCheck(), getDynamicDetail({ healthcheck: '1' })]);
    res.json({ status: 'ready', success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export default router;
