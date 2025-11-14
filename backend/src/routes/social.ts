import { Router } from 'express';
import createError from 'http-errors';

const router = Router();

router.get('/social/:provider/start', (req, res, next) => {
  try {
    const { provider } = req.params;
    const state = req.query.state || req.requestId;
    res.json({
      success: true,
      data: {
        provider,
        authorizationUrl: `/oauth/${provider}?state=${state}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/social/:provider/callback', (req, res, next) => {
  try {
    const { provider } = req.params;
    if (!req.query.state) {
      throw createError(400, 'state missing');
    }
    res.json({
      success: true,
      data: {
        provider,
        state: req.query.state,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
