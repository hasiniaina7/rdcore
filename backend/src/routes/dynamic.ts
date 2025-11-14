import { Router } from 'express';
import { getDynamicDetail } from '../services/dynamicService';

const router = Router();

router.get('/dynamic/details', async (req, res, next) => {
  try {
    const { data, hit } = await getDynamicDetail(req.query);
    res.setHeader('x-cache-status', hit ? 'HIT' : 'MISS');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
