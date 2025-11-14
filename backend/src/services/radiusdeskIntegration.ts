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

const toNumber = (value: unknown): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

type UsagePayload = {
  success?: boolean;
  data?: {
    data_used?: number;
    data_cap?: number | null;
    time_used?: number;
    time_cap?: number | null;
    depleted?: boolean;
  };
};

const normalizeUsagePayload = (payload: UsagePayload | undefined) => {
  if (!payload?.data) {
    return payload;
  }
  const normalized = {
    ...payload.data,
    data_used: toNumber(payload.data.data_used),
    data_cap: payload.data.data_cap === null ? null : toNumber(payload.data.data_cap),
    time_used: toNumber(payload.data.time_used),
    time_cap: payload.data.time_cap === null ? null : toNumber(payload.data.time_cap),
  };
  return { ...payload, data: normalized };
};

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

export async function getUsage(
  username: string,
  options: { mac?: string; password: string }
) {
  return timedRequest(async () => {
    const params: Record<string, unknown> = {
      username,
      password: options.password,
    };
    if (options.mac) {
      params.mac = options.mac;
    }
    const { data } = await radiusClient.get('/radaccts/get-usage.json', {
      params: withDefaults(params),
    });
    return normalizeUsagePayload(data);
  }, 'get-usage');
}

export async function getSessions(username: string, limit = 10) {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/radaccts/index.json', {
      params: withDefaults({
        username,
        limit,
        only_connected: 'false',
        page: 1,
        start: 0,
      }),
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
