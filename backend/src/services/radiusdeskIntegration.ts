import axios from 'axios';
import config from '../config';
import { radiusdeskLatency } from '../utils/metrics';
import { DynamicDetailResponse } from '../types';

const radiusClient = axios.create({
  baseURL: config.RADIUS_BASE_URL,
  timeout: config.RADIUS_HTTP_TIMEOUT_MS,
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

type RadiusAuthTestResponse = {
  success?: boolean;
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

export async function testRadiusCredentials(username: string, password: string): Promise<boolean> {
  return timedRequest(async () => {
    const payload = { username, password };
    const { data } = await radiusClient.post<RadiusAuthTestResponse>(
      '/third-party-radius/auth-test.json',
      payload,
      { params: withDefaults({}) }
    );
    return Boolean((data as RadiusAuthTestResponse | undefined)?.success);
  }, 'auth-test');
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

type SessionsOptions = {
  onlyConnected?: boolean;
  page?: number;
  start?: number;
  extraParams?: Record<string, unknown>;
  caseInsensitive?: boolean;
};

const buildUsernameAttempts = (rawUsername: string | undefined, caseInsensitive: boolean) => {
  const normalized = rawUsername?.trim();
  if (!normalized) {
    return [normalized];
  }

  if (!caseInsensitive) {
    return [normalized];
  }

  const candidates = new Set<string>([normalized, normalized.toLowerCase(), normalized.toUpperCase()]);
  return Array.from(candidates);
};

export async function getSessions(username: string, limit = 10, options?: SessionsOptions) {
  const { onlyConnected, page = 1, start = 0, extraParams = {}, caseInsensitive = true } = options ?? {};

  const attemptRequest = async (usernameParam: string | undefined) => {
    const params: Record<string, unknown> = {
      limit,
      page,
      start,
      sort: 'acctstarttime',
      dir: 'DESC',
      ...extraParams,
    };
    if (usernameParam) {
      params.username = usernameParam;
    }
    if (typeof onlyConnected === 'boolean') {
      params.only_connected = onlyConnected ? 'true' : 'false';
    }
    const { data } = await radiusClient.get('/radaccts/index.json', {
      params: withDefaults(params),
    });
    return data;
  };

  const attempts = buildUsernameAttempts(username, caseInsensitive);
  let lastResponse: Awaited<ReturnType<typeof attemptRequest>> | undefined;

  for (const candidate of attempts) {
    lastResponse = await timedRequest(() => attemptRequest(candidate), 'sessions');
    const items = Array.isArray(lastResponse?.items) ? lastResponse.items : [];
    if (!caseInsensitive || items.length > 0) {
      return lastResponse;
    }
  }

  return lastResponse ?? (await timedRequest(() => attemptRequest(username?.trim()), 'sessions'));
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
    const filter = JSON.stringify([
      {
        property: 'username',
        operator: 'like',
        value: username,
      },
    ]);
    const { data } = await radiusClient.get('/permanent-users/index.json', {
      params: withDefaults({ limit: 1, page: 1, start: 0, filter }),
    });
    return data;
  }, 'permanent-users');
}

export async function getPermanentUserPassword(userId: string) {
  return timedRequest(async () => {
    const { data } = await radiusClient.get('/permanent-users/view-password.json', {
      params: withDefaults({ user_id: userId }),
    });
    return data;
  }, 'permanent-user-password');
}

export async function findVoucher(name: string) {
  return timedRequest(async () => {
    const filter = JSON.stringify([
      {
        property: 'name',
        operator: 'eq',
        value: name,
      },
    ]);
    const { data } = await radiusClient.get('/vouchers/index.json', {
      params: withDefaults({ limit: 1, page: 1, start: 0, filter }),
    });
    return data;
  }, 'vouchers');
}
