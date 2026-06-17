import createError from 'http-errors';
import { fetchUsage } from './usageService';
import { fetchUsageByUsername } from './usageInsightsService';
import { listActiveSessions, listInactiveSessions } from './sessionService';
import { findPermanentUser, findVoucher, getPermanentUserPassword } from './radiusdeskIntegration';

type RadiusdeskCollection = {
  items?: Array<Record<string, unknown>>;
};

type AccountType = 'permanent' | 'voucher' | 'unknown';

type HumanizedValue = {
  raw?: number | null;
  formatted?: string | null;
  unit?: string | null;
};

type ConsumptionSummary = {
  username: string;
  accountType: AccountType;
  profile?: string;
  status?: string;
  active?: boolean;
  adminState?: string;
  dataCap: HumanizedValue;
  dataUsed: HumanizedValue;
  dataRemaining: HumanizedValue;
  percDataUsed?: number | null;
  timeCap: HumanizedValue;
  timeUsed: HumanizedValue;
  timeRemaining: HumanizedValue;
  percTimeUsed?: number | null;
  expiresAt?: string;
  isExpired: boolean;
  daysRemaining?: number | null;
  validFrom?: string;
  validTo?: string;
  metadata: {
    createdAt?: string;
    updatedAt?: string;
  };
};

type RecentActivity = {
  lastAcceptTime?: string;
  lastAcceptNas?: string;
  lastRejectTime?: string;
  lastRejectNas?: string;
  lastRejectMessage?: string;
  lastRejectReasonSimple?: string;
};

type DisconnectResult = {
  success: boolean;
};

const toNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toIsoDate = (value: unknown): string | undefined => {
  if (value == null) {
    return undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const ts = Date.parse(value);
    if (!Number.isNaN(ts)) {
      return new Date(ts).toISOString();
    }
  }
  return undefined;
};

const extractFirstRecord = (payload: RadiusdeskCollection | undefined): Record<string, unknown> | undefined => {
  if (!payload?.items || !Array.isArray(payload.items)) {
    return undefined;
  }
  return payload.items[0];
};

const getMonthlyUsageBytes = (insights: Awaited<ReturnType<typeof fetchUsageByUsername>> | null | undefined) => {
  const monthly = insights?.periods.find((period) => period.period === 'monthly');
  return monthly?.totalBytes ?? undefined;
};

const humanizeBytes = (value: number | null | undefined): HumanizedValue => {
  if (value == null || !Number.isFinite(value)) {
    return { raw: value ?? null, formatted: null, unit: null };
  }
  const abs = Math.abs(value);
  if (abs >= 1024 * 1024 * 1024) {
    return {
      raw: value,
      formatted: (value / (1024 * 1024 * 1024)).toFixed(2),
      unit: 'GB',
    };
  }
  if (abs >= 1024 * 1024) {
    return {
      raw: value,
      formatted: (value / (1024 * 1024)).toFixed(2),
      unit: 'MB',
    };
  }
  if (abs >= 1024) {
    return {
      raw: value,
      formatted: (value / 1024).toFixed(2),
      unit: 'KB',
    };
  }
  return {
    raw: value,
    formatted: String(Math.floor(value)),
    unit: 'B',
  };
};

const humanizeSeconds = (value: number | null | undefined): HumanizedValue => {
  if (value == null || !Number.isFinite(value)) {
    return { raw: value ?? null, formatted: null, unit: null };
  }
  const abs = Math.abs(value);
  if (abs >= 24 * 3600) {
    return {
      raw: value,
      formatted: (value / (24 * 3600)).toFixed(1),
      unit: 'days',
    };
  }
  if (abs >= 3600) {
    return {
      raw: value,
      formatted: (value / 3600).toFixed(1),
      unit: 'hours',
    };
  }
  if (abs >= 60) {
    return {
      raw: value,
      formatted: (value / 60).toFixed(1),
      unit: 'minutes',
    };
  }
  return {
    raw: value,
    formatted: String(Math.floor(value)),
    unit: 'seconds',
  };
};

const computePercentage = (used?: number, cap?: number | null): number | null => {
  if (!Number.isFinite(used as number) || !Number.isFinite(cap as number) || !cap) {
    return null;
  }
  if (cap <= 0) {
    return null;
  }
  const ratio = (Number(used) / Number(cap)) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
};

const computeDaysRemaining = (expiresAt?: string): number | null => {
  if (!expiresAt) {
    return null;
  }
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) {
    return null;
  }
  const diffMs = ts - Date.now();
  const days = diffMs / (24 * 3600 * 1000);
  return Math.floor(days);
};

const resolveAccountMetadata = async (
  username: string
): Promise<{
  accountType: AccountType;
  profile?: string;
  status?: string;
  active?: boolean;
  adminState?: string;
  validFrom?: string;
  validTo?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  activity?: RecentActivity;
  percTimeUsed?: number | null;
  timeCapSeconds?: number | null;
  timeUsedSeconds?: number | null;
}> => {
  const normalized = username.trim();

  // Try permanent user first
  try {
    const permanentResponse = await findPermanentUser(normalized);
    const permanentRecord = extractFirstRecord(permanentResponse);
    if (permanentRecord) {
      const profile =
        (typeof permanentRecord.profile === 'string' && permanentRecord.profile) ||
        (typeof permanentRecord.profile_name === 'string' && permanentRecord.profile_name) ||
        undefined;
      const active =
        typeof permanentRecord.active === 'boolean'
          ? permanentRecord.active
          : typeof permanentRecord.active === 'number'
            ? permanentRecord.active !== 0
            : undefined;
      const adminState =
        (typeof permanentRecord.admin_state === 'string' && permanentRecord.admin_state) ||
        (typeof permanentRecord.status === 'string' && permanentRecord.status) ||
        undefined;
      const validFrom = toIsoDate(
        permanentRecord.from_date ?? permanentRecord.fromDate ?? permanentRecord.valid_from ?? permanentRecord.validFrom
      );
      const validTo = toIsoDate(
        permanentRecord.to_date ?? permanentRecord.toDate ?? permanentRecord.expire ?? permanentRecord.valid_to
      );
      const expiresAt = validTo;
      const createdAt = toIsoDate(permanentRecord.created ?? permanentRecord.created_in_words);
      const updatedAt = toIsoDate(permanentRecord.modified ?? permanentRecord.modified_in_words);
      const activity: RecentActivity = {
        lastAcceptTime: toIsoDate(permanentRecord.last_accept_time),
        lastAcceptNas:
          typeof permanentRecord.last_accept_nas === 'string' ? permanentRecord.last_accept_nas : undefined,
        lastRejectTime: toIsoDate(permanentRecord.last_reject_time),
        lastRejectNas:
          typeof permanentRecord.last_reject_nas === 'string' ? permanentRecord.last_reject_nas : undefined,
        lastRejectMessage:
          typeof permanentRecord.last_reject_message === 'string' ? permanentRecord.last_reject_message : undefined,
        lastRejectReasonSimple:
          typeof permanentRecord.last_reject_reason_simple === 'string'
            ? permanentRecord.last_reject_reason_simple
            : undefined,
      };
      return {
        accountType: 'permanent',
        profile,
        status: adminState,
        active,
        adminState,
        validFrom,
        validTo,
        expiresAt,
        createdAt,
        updatedAt,
        activity,
      };
    }
  } catch {
    // Swallow errors and fall back to voucher lookup
  }

  // Then voucher
  try {
    const voucherResponse = await findVoucher(normalized);
    const voucherRecord = extractFirstRecord(voucherResponse);
    if (voucherRecord) {
      const voucherName = typeof voucherRecord.name === 'string' ? voucherRecord.name.trim() : undefined;
      if (!voucherName || voucherName !== normalized) {
        // exact match required
        return { accountType: 'unknown', activity: {} };
      }
      const percTimeUsed =
        toNumber((voucherRecord as any).perc_time_used) ?? toNumber((voucherRecord as any).time_used_percent) ?? null;
      const timeCapSeconds = toNumber((voucherRecord as any).time_cap) ?? null;
      const timeUsedSeconds = toNumber((voucherRecord as any).time_used) ?? null;
      const profile =
        (typeof voucherRecord.profile === 'string' && voucherRecord.profile) ||
        (typeof voucherRecord.profile_name === 'string' && voucherRecord.profile_name) ||
        undefined;
      const status =
        (typeof voucherRecord.status === 'string' && voucherRecord.status) ||
        (typeof voucherRecord.state === 'string' && voucherRecord.state) ||
        undefined;
      const validFrom = toIsoDate(
        voucherRecord.from_date ?? voucherRecord.fromDate ?? voucherRecord.valid_from ?? voucherRecord.validFrom
      );
      const validTo = toIsoDate(
        voucherRecord.to_date ?? voucherRecord.toDate ?? voucherRecord.expire ?? voucherRecord.valid_to
      );
      const expiresAt = validTo ?? toIsoDate(voucherRecord.expire);
      const createdAt = toIsoDate(voucherRecord.created ?? voucherRecord.created_in_words);
      const updatedAt = toIsoDate(voucherRecord.modified ?? voucherRecord.modified_in_words);
      const activity: RecentActivity = {
        lastAcceptTime: toIsoDate(voucherRecord.last_accept_time),
        lastAcceptNas: typeof voucherRecord.last_accept_nas === 'string' ? voucherRecord.last_accept_nas : undefined,
        lastRejectTime: toIsoDate(voucherRecord.last_reject_time),
        lastRejectNas: typeof voucherRecord.last_reject_nas === 'string' ? voucherRecord.last_reject_nas : undefined,
        lastRejectMessage:
          typeof voucherRecord.last_reject_message === 'string' ? voucherRecord.last_reject_message : undefined,
        lastRejectReasonSimple:
          typeof voucherRecord.last_reject_reason_simple === 'string'
            ? voucherRecord.last_reject_reason_simple
            : undefined,
      };
      return {
        accountType: 'voucher',
        profile,
        status,
        validFrom,
        validTo,
        expiresAt,
        createdAt,
        updatedAt,
        activity,
        percTimeUsed,
        timeCapSeconds,
        timeUsedSeconds,
      };
    }
  } catch {
    // Ignore voucher lookup failures
  }

  return {
    accountType: 'unknown',
    activity: {},
  };
};

const verifyRadiusdeskCredentials = async (username: string, password: string): Promise<boolean> => {
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();

  // 1) PermanentUsers: comparer le mot de passe côté RadiusDesk
  try {
    const permanentResponse = await findPermanentUser(normalizedUsername);

    //Patch pour contourner collision de nom d'utilisateur
    const permanentItems = (permanentResponse as any)?.items;
    const permanentRecord = Array.isArray(permanentItems)
      ? permanentItems.find(
        (item: any) =>
          typeof item?.username === 'string' &&
          item.username.trim() === normalizedUsername
    )
      : undefined;
    if (permanentRecord) {
      const recordUsername = (permanentRecord as any).username?.trim();
      if (recordUsername && recordUsername === normalizedUsername) {
          const userId = (permanentRecord as any).id;
        if (userId != null) {
          const passwordPayload = await getPermanentUserPassword(String(userId));
          const storedPassword =
            passwordPayload && typeof (passwordPayload as any).value === 'string'
              ? ((passwordPayload as any).value as string).trim()
              : undefined;
          if (storedPassword && storedPassword === normalizedPassword) {
            return true;
          }
        }
      }
    
    //Patch pour contourner collision de nom d'utilisateur



    }
  } catch {
    // Ignore lookup issues and fall back to vouchers.
  }

  // 2) Vouchers: utiliser le champ password renvoyé par /vouchers/index.json
  try {
    const voucherResponse = await findVoucher(normalizedUsername);
    const voucherRecord = extractFirstRecord(voucherResponse as any);
    if (voucherRecord) {
      const voucherName =
        typeof (voucherRecord as any).name === 'string'
          ? ((voucherRecord as any).name as string).trim()
          : undefined;
      if (!voucherName || voucherName !== normalizedUsername) {
        return false;
      }
      const storedVoucherPassword =
        typeof (voucherRecord as any).password === 'string'
          ? ((voucherRecord as any).password as string).trim()
          : undefined;
      if (storedVoucherPassword && storedVoucherPassword === normalizedPassword) {
        return true;
      }
    }
  } catch {
    // Ignore voucher lookup failures.
  }

  return false;
};

export async function getConsumptionOverview(payload: { username: string; password: string }) {
  const username = payload.username?.trim();
  const password = payload.password?.trim();

  if (!username || !password) {
    throw createError(400, 'username and password are required');
  }

  // 1) Vérifier les identifiants en s'appuyant sur les mots de passe RadiusDesk (PermanentUsers / Vouchers)
  const credentialsOk = await verifyRadiusdeskCredentials(username, password);
  if (!credentialsOk) {
    throw createError(401, 'Invalid username or password');
  }

  // 2) Récupérer les usages/sessions RadiusDesk pour construire l’overview
  const usage = await fetchUsage(username, password, undefined, 20, true);

  // 3) Enrich with account metadata (profile, status, validity period, activity)
  const [account, insights, activeSessions, inactiveSessions] = await Promise.all([
    resolveAccountMetadata(usage.username),
    fetchUsageByUsername(usage.username, {
      historyLimit: 200,
      // 30 derniers jours pour la fenêtre par défaut
      startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      endDate: new Date(),
      granularity: 'day',
    }),
    listActiveSessions(usage.username, { limit: 50 }, usage.mac),
    listInactiveSessions(
      usage.username,
      {
        limit: 200,
        startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        endDate: new Date(),
        status: 'inactive',
      },
      usage.mac
    ),
  ]);

  const totalSessionSeconds =
    (activeSessions?.sessions?.reduce((acc: number, s: any) => acc + (toNumber(s?.acctsessiontime) ?? 0), 0) ?? 0) +
    (inactiveSessions?.sessions?.reduce((acc: number, s: any) => acc + (toNumber(s?.acctsessiontime) ?? 0), 0) ?? 0);

  const dataCapBytes = usage.dataCap ?? null;
  const monthlyUsageBytes = getMonthlyUsageBytes(insights);
  const dataUsedBytes =
    account.accountType === 'permanent' ? monthlyUsageBytes ?? usage.dataUsed ?? 0 : usage.dataUsed ?? 0;
  const dataRemainingBytes = dataCapBytes != null ? Math.max(0, dataCapBytes - dataUsedBytes) : null;
  let timeCapSeconds = usage.timeCap ?? account.timeCapSeconds ?? null;
  let timeUsedSeconds = usage.timeUsed ?? account.timeUsedSeconds ?? null;

  // Fallback: use aggregated session time when usage did not provide it
  if (timeUsedSeconds == null && totalSessionSeconds > 0) {
    timeUsedSeconds = totalSessionSeconds;
  }

  // Normalize bogus zeros from upstream when quota time is not provided
  if (timeCapSeconds !== null && timeCapSeconds <= 0) {
    timeCapSeconds = null;
  }

  // If we have a percentage but no cap, infer cap from used seconds
  if (timeCapSeconds === null && account.percTimeUsed && account.percTimeUsed > 0 && timeUsedSeconds != null) {
    const inferred = Math.round((timeUsedSeconds * 100) / account.percTimeUsed);
    if (Number.isFinite(inferred) && inferred > 0) {
      timeCapSeconds = inferred;
    }
  }
  const timeRemainingSeconds =
    typeof usage.timeRemainingSeconds === 'number'
      ? usage.timeRemainingSeconds
      : timeCapSeconds != null && timeUsedSeconds != null
        ? Math.max(0, timeCapSeconds - timeUsedSeconds)
        : null;

  const expiresAt = account.expiresAt ?? usage.expiresAt;
  const daysRemaining = computeDaysRemaining(expiresAt ?? undefined);

  const summary: ConsumptionSummary = {
    username: usage.username,
    accountType: account.accountType,
    profile: account.profile,
    status: account.status,
    active: account.active,
    adminState: account.adminState,
    dataCap: humanizeBytes(dataCapBytes),
    dataUsed: humanizeBytes(dataUsedBytes),
    dataRemaining: humanizeBytes(dataRemainingBytes),
    percDataUsed: computePercentage(dataUsedBytes, dataCapBytes),
    timeCap: humanizeSeconds(timeCapSeconds),
    timeUsed: humanizeSeconds(timeUsedSeconds),
    timeRemaining: humanizeSeconds(timeRemainingSeconds),
    percTimeUsed: computePercentage(timeUsedSeconds ?? undefined, timeCapSeconds ?? undefined) ?? account.percTimeUsed ?? null,
    expiresAt,
    isExpired: Boolean(expiresAt && Date.parse(expiresAt) <= Date.now()),
    daysRemaining,
    validFrom: account.validFrom,
    validTo: account.validTo ?? expiresAt,
    metadata: {
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    },
  };

  const recentActivity: RecentActivity = {
    lastAcceptTime: account.activity?.lastAcceptTime,
    lastAcceptNas: account.activity?.lastAcceptNas,
    lastRejectTime: account.activity?.lastRejectTime,
    lastRejectNas: account.activity?.lastRejectNas,
    lastRejectMessage: account.activity?.lastRejectMessage,
    lastRejectReasonSimple: account.activity?.lastRejectReasonSimple,
  };

  return {
    summary,
    recentActivity,
    insights,
    activeSessions,
    inactiveSessions,
  };
}

export async function disconnectSessionsWithCredentials(payload: {
  username: string;
  password: string;
  radacctIds: string[];
}): Promise<DisconnectResult> {
  const username = payload.username?.trim();
  const password = payload.password?.trim();

  if (!username || !password) {
    throw createError(400, 'username and password are required');
  }
  if (!payload.radacctIds || !payload.radacctIds.length) {
    throw createError(400, 'radacctIds required');
  }

  // Vérifie d’abord les identifiants via les mots de passe RadiusDesk (PermanentUsers / Vouchers)
  const credentialsOk = await verifyRadiusdeskCredentials(username, password);
  if (!credentialsOk) {
    throw createError(401, 'Invalid username or password');
  }

  // Utilise le endpoint existant via usageService
  const { disconnectSessions } = await import('./usageService');
  await disconnectSessions(payload.radacctIds);

  return { success: true };
}
