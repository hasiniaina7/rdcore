import client from '../../api/client';
import type {
  AdminAuthMode,
  AdminAuthModes,
  AdminLoginPayload,
  AdminLoginResult,
  AdminSessionInfo,
  AdminUserInsights,
} from './types';

const TOKEN_KEY = 'cp:adminToken';

const buildAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const adminTokenStorage = {
  load(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  },
  save(token: string) {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  },
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function fetchAdminAuthModes() {
  const response = await client.get<ApiResponse<AdminAuthModes>>('/admin/auth-modes');
  return response.data.data;
}

export async function adminLogin(payload: AdminLoginPayload) {
  const response = await client.post<ApiResponse<AdminLoginResult>>('/admin/login', payload);
  return response.data.data;
}

export async function fetchAdminSession(token: string) {
  const response = await client.get<ApiResponse<AdminSessionInfo>>('/admin/me', {
    headers: buildAuthHeaders(token),
  });
  return response.data.data;
}

export async function adminLogout(token: string) {
  await client.post('/admin/logout', undefined, {
    headers: buildAuthHeaders(token),
  });
}

export async function fetchAdminUserInsights(username: string, token: string, historyLimit?: number) {
  const response = await client.get<ApiResponse<AdminUserInsights>>(`/admin/users/${encodeURIComponent(username)}/insights`, {
    params: { historyLimit },
    headers: buildAuthHeaders(token),
  });
  return response.data.data;
}

export const ADMIN_MODES_LABELS: Record<AdminAuthMode, string> = {
  static: 'admin.modeStatic',
  radiusmysql: 'admin.modeRadiusmysql',
};
