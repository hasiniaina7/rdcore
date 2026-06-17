import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { setApiAuthToken } from '../../api/client';

type AuthProfile = {
  username: string;
  mac?: string;
  accountType?: 'permanent' | 'voucher' | 'unknown';
};

export type UsageSession = {
  token: string;
  expiresAt?: number;
  profile: AuthProfile;
};

type AuthContextValue = {
  session: UsageSession | null;
  login: (session: UsageSession) => void;
  logout: () => void;
};

const STORAGE_KEY = 'cp:usage-session';
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadSession(): UsageSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as UsageSession;
    if (parsed?.token) {
      setApiAuthToken(parsed.token);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<UsageSession | null>(() => loadSession());

  useEffect(() => {
    setApiAuthToken(session?.token ?? null);
    if (typeof window === 'undefined') {
      return;
    }
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = useCallback((next: UsageSession) => setSession(next), []);
  const logout = useCallback(() => setSession(null), []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!session) {
      return;
    }
    const now = Date.now();
    const tokenTimeout = typeof session.expiresAt === 'number' ? Math.max(session.expiresAt - now, 0) : Infinity;
    const timerDuration = Math.min(tokenTimeout, INACTIVITY_TIMEOUT_MS);
    if (!Number.isFinite(timerDuration) || timerDuration <= 0) {
      setSession(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setSession(null);
    }, timerDuration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login,
      logout,
    }),
    [login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
