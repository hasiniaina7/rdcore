import client from '../../api/client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type LoginResult = {
  token: string;
  expiresAt: number;
  profile: {
    username: string;
    mac?: string;
  };
};

export type LoginPayload = {
  username: string;
  password: string;
  mac?: string;
};

export async function requestLogin(payload: LoginPayload): Promise<LoginResult> {
  const response = await client.post<ApiResponse<LoginResult>>('/login', payload);
  return response.data.data;
}
