import { getBrowserStorage, type StorageLike } from './storage.js';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bulls-and-cows:theme:v1';
export const VOLUME_STORAGE_KEY = 'bulls-and-cows:volume:v1';
export const DEFAULT_VOLUME = 0.35;

export const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

export const readTheme = (
  storage: StorageLike | null = getBrowserStorage(),
  prefersDark = false,
): Theme => {
  const fallback: Theme = prefersDark ? 'dark' : 'light';

  if (storage === null) {
    return fallback;
  }

  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
};

export const saveTheme = (
  theme: Theme,
  storage: StorageLike | null = getBrowserStorage(),
): boolean => {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
};

export const clampVolume = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, value));
};

export const readVolume = (
  storage: StorageLike | null = getBrowserStorage(),
  fallback: number = DEFAULT_VOLUME,
): number => {
  const safeFallback = clampVolume(fallback);

  if (storage === null) {
    return safeFallback;
  }

  try {
    const stored = storage.getItem(VOLUME_STORAGE_KEY);

    if (stored === null || stored.trim() === '') {
      return safeFallback;
    }

    const value = Number(stored);
    return Number.isFinite(value) ? clampVolume(value) : safeFallback;
  } catch {
    return safeFallback;
  }
};

export const saveVolume = (
  volume: number,
  storage: StorageLike | null = getBrowserStorage(),
): boolean => {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(VOLUME_STORAGE_KEY, String(clampVolume(volume)));
    return true;
  } catch {
    return false;
  }
};
