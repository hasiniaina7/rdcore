import { fetchUsage } from './usageService';
import { createUsageSession } from './usageSessionStore';

type LoginPayload = {
  username: string;
  password: string;
  mac?: string;
};

export async function loginUsageUser(payload: LoginPayload) {
  const usage = await fetchUsage(payload.username, payload.password, payload.mac, 5, false);
  const normalizedMac = payload.mac || usage.mac;
  const { token, expiresAt } = createUsageSession({
    username: usage.username,
    password: payload.password,
    mac: normalizedMac,
  });
  return {
    token,
    expiresAt,
    profile: {
      username: usage.username,
      mac: usage.mac ?? normalizedMac,
      accountType: usage.accountType,
    },
  };
}
