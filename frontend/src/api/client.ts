import axios, { AxiosHeaders } from 'axios';

const resolvedBaseUrl = (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) || '/api';

const client = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
});

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

client.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  } else {
    headers.delete('Authorization');
  }
  headers.set('Cache-Control', 'no-cache');
  headers.set('Pragma', 'no-cache');
  headers.set('If-Modified-Since', '0');
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
