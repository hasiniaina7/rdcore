import axios from 'axios';
import config from '../config';
import { radiusdeskLatency } from '../utils/metrics';
import { DynamicDetailResponse } from '../types';

const radiusClient = axios.create({
  baseURL: config.RADIUS_BASE_URL,
  timeout: 8000,
});

const withDefaults = (params: Record<string, unknown>) => ({
  token: config.RADIUS_TOKEN_LOCAL,
  cloud_id: config.RADIUS_CLOUD_ID,
  ...params,
});

async function timedRequest<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const end = radiusdeskLatency.startTimer({ endpoint: label });
  try {
    return await fn();
  } finally {
    end();
  }
}

export async function fetchDynamicDetails(query: Record<string, unknown>): Promise<DynamicDetailResponse> {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/dynamic-details/info-for.json', {
      params: withDefaults(query),
    });
    return data;
  }, 'dynamic-details');
}

export async function getUsage(username: string, mac: string) {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/radaccts/get-usage.json', {
      params: withDefaults({ username, mac }),
    });
    return data;
  }, 'get-usage');
}

export async function getSessions(username: string, limit = 10) {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/radaccts/index.json', {
      params: withDefaults({ username, limit, only_connected: 'false' }),
    });
    return data;
  }, 'sessions');
}

export async function kickSessions(radacctIds: string[]) {
  const params = radacctIds.reduce<Record<string, string>>((acc, id) => {
    acc[id] = '1';
    return acc;
  }, {});
  await timedRequest(async () => {
    await radiusClient.get('/radaccts/kick-active.json', {
      params: withDefaults(params),
    });
  }, 'kick-active');
}

export async function findPermanentUser(username: string) {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/permanent-users/index.json', {
      params: withDefaults({ username, limit: 1 }),
    });
    return data;
  }, 'permanent-users');
}

export async function findVoucher(name: string) {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/vouchers/index.json', {
      params: withDefaults({ name, limit: 1 }),
    });
    return data;
  }, 'vouchers');
}
