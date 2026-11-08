import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VOLUME,
  THEME_STORAGE_KEY,
  VOLUME_STORAGE_KEY,
  clampVolume,
  isTheme,
  readTheme,
  readVolume,
  saveTheme,
  saveVolume,
} from '../src/app/preferences.js';
import type { StorageLike } from '../src/app/storage.js';

const createMemoryStorage = (): StorageLike & {
  readonly values: Map<string, string>;
} => {
  const values = new Map<string, string>();

  return {
    values,
    getItem: (key: string): string | null => values.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
  };
};

describe('theme preference', () => {
  it('recognizes only light and dark values', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('system')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('falls back to the system preference when nothing is stored', () => {
    expect(readTheme(null, false)).toBe('light');
    expect(readTheme(null, true)).toBe('dark');
    expect(readTheme(createMemoryStorage(), true)).toBe('dark');
  });

  it('uses a stored theme over the system preference', () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, 'light');

    expect(readTheme(storage, true)).toBe('light');
  });

  it('ignores an invalid stored theme', () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, 'sepia');

    expect(readTheme(storage, true)).toBe('dark');
  });

  it('persists a theme', () => {
    const storage = createMemoryStorage();

    expect(saveTheme('dark', storage)).toBe(true);
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(readTheme(storage, false)).toBe('dark');
  });

  it('reports storage failures instead of throwing', () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error('Blocked');
      },
      setItem: () => {
        throw new Error('Quota');
      },
    };

    expect(readTheme(storage, true)).toBe('dark');
    expect(saveTheme('dark', storage)).toBe(false);
  });
});

describe('volume preference', () => {
  it('clamps values to the 0..1 range', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_VOLUME);
  });

  it('uses the fallback when nothing is stored', () => {
    expect(readVolume(null)).toBe(DEFAULT_VOLUME);
    expect(readVolume(createMemoryStorage(), 0.2)).toBe(0.2);
  });

  it('reads and clamps a stored volume', () => {
    const storage = createMemoryStorage();
    storage.setItem(VOLUME_STORAGE_KEY, '0.65');

    expect(readVolume(storage)).toBe(0.65);

    storage.setItem(VOLUME_STORAGE_KEY, '4');

    expect(readVolume(storage)).toBe(1);
  });

  it('falls back for an invalid stored volume', () => {
    const storage = createMemoryStorage();
    storage.setItem(VOLUME_STORAGE_KEY, 'loud');

    expect(readVolume(storage, 0.25)).toBe(0.25);
  });

  it('persists a clamped volume', () => {
    const storage = createMemoryStorage();

    expect(saveVolume(1.4, storage)).toBe(true);
    expect(storage.values.get(VOLUME_STORAGE_KEY)).toBe('1');
    expect(readVolume(storage)).toBe(1);
  });

  it('reports storage failures instead of throwing', () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error('Blocked');
      },
      setItem: () => {
        throw new Error('Quota');
      },
    };

    expect(readVolume(storage)).toBe(DEFAULT_VOLUME);
    expect(saveVolume(0.5, storage)).toBe(false);
  });
});
