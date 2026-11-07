import { describe, expect, it } from 'vitest';

import type { GameRecord } from '../src/core/records.js';
import {
  RECORDS_STORAGE_KEY,
  loadRecords,
  saveRecords,
  type StorageLike,
} from '../src/app/storage.js';

const record: GameRecord = {
  length: 4,
  base: 10,
  attempts: 3,
  timeMs: 12_000,
  achievedAt: 1_000,
};

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

describe('records storage', () => {
  it('returns an empty list when storage is absent', () => {
    expect(loadRecords(null)).toEqual([]);
  });

  it('returns an empty list when the key is missing', () => {
    expect(loadRecords(createMemoryStorage())).toEqual([]);
  });

  it('persists records under the versioned key', () => {
    const storage = createMemoryStorage();

    expect(saveRecords([record], storage)).toBe(true);
    expect(storage.values.has(RECORDS_STORAGE_KEY)).toBe(true);
    expect(loadRecords(storage)).toEqual([record]);
  });

  it('returns an empty list for corrupted storage data', () => {
    const storage = createMemoryStorage();
    storage.setItem(RECORDS_STORAGE_KEY, 'not json');

    expect(loadRecords(storage)).toEqual([]);
  });

  it('reports a failed save instead of throwing', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
    };

    expect(saveRecords([record], storage)).toBe(false);
  });

  it('returns an empty list when reading throws', () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error('Blocked');
      },
      setItem: () => undefined,
    };

    expect(loadRecords(storage)).toEqual([]);
  });
});
