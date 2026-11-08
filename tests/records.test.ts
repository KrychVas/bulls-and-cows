import { describe, expect, it } from 'vitest';

import { startGame, submitGuess } from '../src/core/game.js';
import {
  RECORD_LIMIT,
  addRecord,
  compareRecords,
  parseRecords,
  serializeRecords,
  sortRecords,
  toGameRecord,
} from '../src/core/records.js';
import type { GameRecord } from '../src/core/records.js';
import { createSettings } from '../src/core/settings.js';
import { constantRandom } from './support/random.js';

const makeRecord = (overrides: Partial<GameRecord> = {}): GameRecord => ({
  length: 4,
  base: 10,
  attempts: 5,
  timeMs: 30_000,
  achievedAt: 1_000,
  ...overrides,
});

describe('toGameRecord', () => {
  it('creates a record from a won game', () => {
    const game = startGame(createSettings(4, 10), constantRandom(0), 1_000);
    const won = submitGuess(game, '0123', 5_000).state;

    expect(toGameRecord(won)).toEqual({
      length: 4,
      base: 10,
      attempts: 1,
      timeMs: 4_000,
      achievedAt: 5_000,
    });
  });

  it('returns null for a round that is still running', () => {
    const game = startGame(createSettings(4, 10), constantRandom(0), 1_000);

    expect(toGameRecord(game)).toBeNull();
  });

  it('returns null for an idle game', () => {
    expect(toGameRecord(null)).toBeNull();
  });
});

describe('compareRecords', () => {
  it('ranks fewer attempts first', () => {
    const fewer = makeRecord({ attempts: 3 });
    const more = makeRecord({ attempts: 4 });

    expect(compareRecords(fewer, more)).toBeLessThan(0);
    expect(compareRecords(more, fewer)).toBeGreaterThan(0);
  });

  it('uses time as the tie-breaker', () => {
    const faster = makeRecord({ attempts: 3, timeMs: 10_000 });
    const slower = makeRecord({ attempts: 3, timeMs: 20_000 });

    expect(compareRecords(faster, slower)).toBeLessThan(0);
    expect(compareRecords(slower, faster)).toBeGreaterThan(0);
  });

  it('uses the achievement time as the final tie-breaker', () => {
    const older = makeRecord({ attempts: 3, timeMs: 10_000, achievedAt: 1_000 });
    const newer = makeRecord({ attempts: 3, timeMs: 10_000, achievedAt: 2_000 });

    expect(compareRecords(older, newer)).toBeLessThan(0);
  });

  it('returns zero for identical ranking fields', () => {
    expect(compareRecords(makeRecord(), makeRecord())).toBe(0);
  });
});

describe('sortRecords', () => {
  it('sorts without mutating the input', () => {
    const records = [
      makeRecord({ attempts: 5, timeMs: 1_000 }),
      makeRecord({ attempts: 2, timeMs: 9_000 }),
      makeRecord({ attempts: 2, timeMs: 3_000 }),
    ];
    const copy = [...records];

    const sorted = sortRecords(records);

    expect(sorted.map((record) => record.attempts)).toEqual([2, 2, 5]);
    expect(sorted.map((record) => record.timeMs)).toEqual([3_000, 9_000, 1_000]);
    expect(records).toEqual(copy);
  });
});

describe('addRecord', () => {
  it('inserts a record in ranked order', () => {
    const records = [
      makeRecord({ attempts: 2 }),
      makeRecord({ attempts: 6 }),
      makeRecord({ attempts: 4 }),
    ];

    const result = addRecord(records, makeRecord({ attempts: 3 }));

    expect(result.records.map((record) => record.attempts)).toEqual([2, 3, 4, 6]);
    expect(result.rank).toBe(2);
  });

  it('keeps only the top ten records', () => {
    const records = Array.from({ length: RECORD_LIMIT }, (_, index) =>
      makeRecord({ attempts: index + 1 }),
    );

    const result = addRecord(records, makeRecord({ attempts: 0 }));

    expect(result.records).toHaveLength(RECORD_LIMIT);
    expect(result.records[0]?.attempts).toBe(0);
    expect(result.rank).toBe(1);
  });

  it('reports a null rank when the result is outside the table', () => {
    const records = Array.from({ length: RECORD_LIMIT }, (_, index) =>
      makeRecord({ attempts: index + 1 }),
    );

    const result = addRecord(records, makeRecord({ attempts: 99 }));

    expect(result.rank).toBeNull();
    expect(result.records).toHaveLength(RECORD_LIMIT);
    expect(result.records.some((record) => record.attempts === 99)).toBe(false);
  });

  it('does not mutate the incoming records array', () => {
    const records = [makeRecord({ attempts: 5 })];
    const copy = [...records];

    addRecord(records, makeRecord({ attempts: 1 }));

    expect(records).toEqual(copy);
  });

  it('supports a custom table size', () => {
    const records = [makeRecord({ attempts: 1 }), makeRecord({ attempts: 2 })];

    const result = addRecord(records, makeRecord({ attempts: 3 }), 2);

    expect(result.records).toHaveLength(2);
    expect(result.rank).toBeNull();
  });
});

describe('parseRecords', () => {
  it('returns an empty list for missing storage data', () => {
    expect(parseRecords(null)).toEqual([]);
  });

  it('returns an empty list for invalid JSON', () => {
    expect(parseRecords('not json')).toEqual([]);
    expect(parseRecords('{')).toEqual([]);
  });

  it('returns an empty list for a non-array payload', () => {
    expect(parseRecords('{"attempts": 3}')).toEqual([]);
    expect(parseRecords('42')).toEqual([]);
  });

  it('filters out malformed records', () => {
    const valid = makeRecord({ attempts: 2 });
    const payload = JSON.stringify([
      valid,
      null,
      { ...valid, base: 3 },
      { ...valid, length: 9 },
      { ...valid, attempts: 0 },
      { ...valid, timeMs: -1 },
      { ...valid, achievedAt: 'yesterday' },
    ]);

    expect(parseRecords(payload)).toEqual([valid]);
  });

  it('sorts parsed records and keeps only the top ten', () => {
    const payload = JSON.stringify(
      Array.from({ length: 12 }, (_, index) =>
        makeRecord({ attempts: 12 - index, achievedAt: 1_000 + index }),
      ),
    );

    const parsed = parseRecords(payload);

    expect(parsed).toHaveLength(RECORD_LIMIT);
    expect(parsed[0]?.attempts).toBe(1);
    expect(parsed.at(-1)?.attempts).toBe(RECORD_LIMIT);
  });

  it('round-trips through serializeRecords', () => {
    const records = [makeRecord({ attempts: 3 }), makeRecord({ attempts: 7, base: 16, length: 6 })];

    expect(parseRecords(serializeRecords(records))).toEqual(sortRecords(records));
  });
});
