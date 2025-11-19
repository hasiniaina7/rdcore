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
  const headers = config.headers ?? {};
  if (authToken) {
    (headers as Record<string, unknown>).Authorization = `Bearer ${authToken}`;
  } else if ((headers as Record<string, unknown>).Authorization) {
    delete (headers as Record<string, unknown>).Authorization;
  }
  config.headers = headers;
  return config;
});

export default client;
