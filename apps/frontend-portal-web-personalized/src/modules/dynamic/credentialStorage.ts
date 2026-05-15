const STORAGE_KEY = 'cp:lastCredentials';

export type StoredCredentials = {
  username?: string;
  password?: string;
  mac?: string;
  mode?: string;
};

export function saveCredentials(data: StoredCredentials) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readCredentials(): StoredCredentials | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCredentials() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
