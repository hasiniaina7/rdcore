import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
});

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

client.interceptors.request.use((config) => {
  const headers = (config.headers ?? {}) as Record<string, unknown>;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
    headers.authorization = headers.Authorization;
  } else {
    delete headers.Authorization;
    delete headers.authorization;
  }
  headers['Cache-Control'] = 'no-cache';
  headers.Pragma = 'no-cache';
  headers['If-Modified-Since'] = '0';
  config.headers = headers;
  if (config.method?.toLowerCase() === 'get') {
    if (config.params instanceof URLSearchParams) {
      config.params.set('_ts', Date.now().toString());
    } else {
      config.params = {
        ...(config.params as Record<string, unknown> | undefined),
        _ts: Date.now(),
      };
    }
  }
  return config;
});

export default client;
