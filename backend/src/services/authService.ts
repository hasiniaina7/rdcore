import createError from 'http-errors';
import { randomUUID } from 'crypto';
import config from '../config';
import { ConnectRequestContext, ConnectResult } from '../types';
import { authorizeClient } from './omadaIntegration';
import { findPermanentUser, findVoucher } from './radiusdeskIntegration';
import logger from '../utils/logger';
import { authRequestsTotal } from '../utils/metrics';

function ensure(value: unknown, message: string) {
  if (!value) {
    throw createError(400, message);
  }
}

export async function connect(ctx: ConnectRequestContext, requestId?: string): Promise<ConnectResult> {
  const rid = requestId || randomUUID();
  const basePayload = { ...ctx.omada };
  basePayload.accessToken = ctx.omada.accessToken || ctx.username || ctx.voucherCode || ctx.mac || rid;
  ensure(basePayload.clientMac, 'clientMac is required');
  ensure(basePayload.site, 'site is required');
  ensure(basePayload.radioId !== undefined, 'radioId is required');

  switch (ctx.mode) {
    case 'permanent':
      ensure(ctx.username, 'username required');
      ensure(ctx.password, 'password required');
      await findPermanentUser(ctx.username!);
      break;
    case 'voucher':
      ensure(ctx.voucherCode, 'voucher code required');
      await findVoucher(ctx.voucherCode!);
      break;
    case 'click':
      ensure(ctx.dynamicKey, 'dynamic key required');
      break;
    case 'social':
      ensure(ctx.username, 'social username required');
      break;
    default:
      throw createError(400, 'Unsupported mode');
  }

  try {
    await authorizeClient(basePayload);
    authRequestsTotal.inc({ mode: ctx.mode, status: 'success' });
    const result: ConnectResult = {
      status: 'accepted',
      message: 'Access granted',
      nextRedirect: ctx.omada.redirectUrl || config.PORTAL_SUCCESS_URL,
      omadaSite: ctx.omada.site,
      username: ctx.username || ctx.voucherCode,
      mac: ctx.mac || ctx.omada.clientMac,
      requestId: rid,
    };
    logger.info({
      requestId: rid,
      mode: ctx.mode,
      username: ctx.username,
      mac: ctx.mac,
      site: ctx.omada.site,
      dynamicKey: ctx.dynamicKey,
    });
    return result;
  } catch (error: unknown) {
    authRequestsTotal.inc({ mode: ctx.mode, status: 'error' });
    logger.error({ error, requestId: rid }, 'Omada authorization failed');
    if (typeof error === 'object' && error && 'response' in error) {
      const errObj = error as { response?: { status?: number; data?: { msg?: string } } };
      throw createError(errObj.response?.status || 502, errObj.response?.data?.msg || 'Omada authorization failed');
    }
    throw createError(502, 'Omada authorization failed');
  }
}
