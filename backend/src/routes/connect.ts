import { Router } from 'express';
import { z } from 'zod';
import { connect } from '../services/authService';
import { ConnectMode } from '../types';

const router = Router();

const omadaSchema = z.object({
  clientMac: z.string(),
  site: z.string(),
  radioId: z.number(),
  time: z.number().default(() => Date.now() * 1000),
  authType: z.number().default(4),
  redirectUrl: z.string().optional(),
  apMac: z.string().optional(),
  gatewayMac: z.string().optional(),
  ssidName: z.string().optional(),
  vid: z.number().optional(),
});

const bodySchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  voucherCode: z.string().optional(),
  mac: z.string().optional(),
  dynamicKey: z.string().optional(),
  omada: omadaSchema,
});

router.post('/connect/:mode(permanent|voucher|click|social)', async (req, res, next) => {
  try {
    const payload = bodySchema.parse(req.body);
    const mode = req.params.mode as ConnectMode;
    const result = await connect(
      {
        mode,
        username: payload.username,
        password: payload.password,
        voucherCode: payload.voucherCode,
        mac: payload.mac,
        dynamicKey: payload.dynamicKey,
        omada: { ...payload.omada, accessToken: payload.omada.clientMac },
      },
      req.requestId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
