import { parseRecords, serializeRecords } from '../core/records.js';
import type { GameRecord } from '../core/records.js';

export const RECORDS_STORAGE_KEY = 'bulls-and-cows:records:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const getBrowserStorage = (): StorageLike | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const loadRecords = (
  storage: StorageLike | null = getBrowserStorage(),
): readonly GameRecord[] => {
  if (storage === null) {
    return [];
  }

  try {
    return parseRecords(storage.getItem(RECORDS_STORAGE_KEY));
  } catch {
    return [];
  }
};

export const saveRecords = (
  records: readonly GameRecord[],
  storage: StorageLike | null = getBrowserStorage(),
): boolean => {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(RECORDS_STORAGE_KEY, serializeRecords(records));
    return true;
  } catch {
    return false;
  }
};
