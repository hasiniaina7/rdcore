import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { setApiAuthToken } from '../../api/client';

type AuthProfile = {
  username: string;
  mac?: string;
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
