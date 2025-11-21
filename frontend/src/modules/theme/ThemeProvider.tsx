import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'cp-theme';

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return null;
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  if (typeof window.matchMedia === 'function') {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    return media.matches ? 'dark' : 'light';
  }
  return 'dark';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [hasStoredPreference, setHasStoredPreference] = useState<boolean>(() => Boolean(getStoredTheme()));
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    if (hasStoredPreference) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [theme, hasStoredPreference]);

  useEffect(() => {
    if (!hasStoredPreference && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (event: MediaQueryListEvent) => {
        setThemeState(event.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
    return undefined;
  }, [hasStoredPreference]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = (next: Theme) => {
    setHasStoredPreference(true);
    setThemeState(next);
  };
  const toggleTheme = () => {
    setHasStoredPreference(true);
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
