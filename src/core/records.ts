import { isSupportedBase } from './digits.js';
import type { GameState } from './game.js';
import { getElapsedMs } from './game.js';
import { isGameLength, isValidSettings } from './settings.js';
import type { Base, GameLength } from './types.js';

export const RECORD_LIMIT = 10;

export interface GameRecord {
  readonly length: GameLength;
  readonly base: Base;
  readonly attempts: number;
  readonly timeMs: number;
  readonly achievedAt: number;
}

export interface AddRecordResult {
  readonly records: readonly GameRecord[];
  readonly rank: number | null;
}

const EMPTY_RECORDS: readonly GameRecord[] = Object.freeze([]);

export const toGameRecord = (state: GameState | null): GameRecord | null => {
  if (state === null || state.status !== 'won' || state.finishedAt === null) {
    return null;
  }

  return {
    length: state.settings.length,
    base: state.settings.base,
    attempts: state.history.length,
    timeMs: getElapsedMs(state, state.finishedAt),
    achievedAt: state.finishedAt,
  };
};

export const compareRecords = (left: GameRecord, right: GameRecord): number =>
  left.attempts - right.attempts ||
  left.timeMs - right.timeMs ||
  left.achievedAt - right.achievedAt;

export const sortRecords = (records: readonly GameRecord[]): readonly GameRecord[] =>
  Object.freeze([...records].sort(compareRecords));

export const addRecord = (
  records: readonly GameRecord[],
  record: GameRecord,
  limit: number = RECORD_LIMIT,
): AddRecordResult => {
  const safeLimit = Math.max(0, Math.floor(limit));
  const ranked = sortRecords([...records, record]);
  const index = ranked.indexOf(record);
  const rank = index >= 0 && index < safeLimit ? index + 1 : null;

  return {
    records: Object.freeze(ranked.slice(0, safeLimit)),
    rank,
  };
};

const isGameRecord = (value: unknown): value is GameRecord => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const { length, base, attempts, timeMs, achievedAt } = candidate;

  return (
    typeof length === 'number' &&
    isGameLength(length) &&
    typeof base === 'number' &&
    isSupportedBase(base) &&
    isValidSettings({ length, base }) &&
    typeof attempts === 'number' &&
    Number.isInteger(attempts) &&
    attempts >= 1 &&
    typeof timeMs === 'number' &&
    Number.isFinite(timeMs) &&
    timeMs >= 0 &&
    typeof achievedAt === 'number' &&
    Number.isFinite(achievedAt) &&
    achievedAt >= 0
  );
};

export const parseRecords = (
  raw: string | null,
  limit: number = RECORD_LIMIT,
): readonly GameRecord[] => {
  if (raw === null) {
    return EMPTY_RECORDS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return EMPTY_RECORDS;
    }

    const safeLimit = Math.max(0, Math.floor(limit));

    return Object.freeze(sortRecords(parsed.filter(isGameRecord)).slice(0, safeLimit));
  } catch {
    return EMPTY_RECORDS;
  }
};

export const serializeRecords = (records: readonly GameRecord[]): string =>
  JSON.stringify(records) ?? '[]';
