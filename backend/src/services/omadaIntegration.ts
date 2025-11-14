import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import config from '../config';
import { omadaLatency } from '../utils/metrics';
import { OmadaPortalPayload } from '../types';

const jar = new CookieJar();
const omadaClient = wrapper(
  axios.create({
    baseURL: config.OMADA_BASE_URL,
    timeout: 8000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
    jar,
  })
);

interface SessionState {
  token: string;
  expiresAt: number;
}

let session: SessionState | null = null;
let ongoingLogin: Promise<SessionState> | null = null;

async function login(): Promise<SessionState> {
  const end = omadaLatency.startTimer({ endpoint: 'login' });
  try {
    const { data } = await omadaClient.post('/api/v2/hotspot/login', {
      name: config.OMADA_OPERATOR,
      password: config.OMADA_PASSWORD,
    });
    const token = data?.result?.token;
    if (!token) {
      throw new Error('Omada token missing');
    }
    session = {
      token,
      expiresAt: Date.now() + 55 * 60 * 1000,
    };
    return session;
  } finally {
    end();
    ongoingLogin = null;
  }
}

async function ensureSession(): Promise<SessionState> {
  if (session && session.expiresAt > Date.now()) {
    return session;
  }
  if (!ongoingLogin) {
    ongoingLogin = login();
  }
  return ongoingLogin;
}

export async function authorizeClient(payload: OmadaPortalPayload) {
  const sess = await ensureSession();
  const end = omadaLatency.startTimer({ endpoint: 'extPortal/auth' });
  try {
    const { data } = await omadaClient.post('/api/v2/hotspot/extPortal/auth', payload, {
      params: { token: sess.token },
    });
    return data;
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'response' in error) {
      const errObj = error as { response?: { status?: number } };
      if (errObj.response?.status === 401) {
        session = null;
      }
    }
    throw error;
  } finally {
    end();
  }
}

export async function readyCheck() {
  try {
    await ensureSession();
    return true;
  } catch (error) {
      session = null;
      throw error;
    }
}
