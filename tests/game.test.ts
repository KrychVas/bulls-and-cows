import { describe, expect, it } from 'vitest';

import { createIdleGame, getElapsedMs, startGame, submitGuess } from '../src/core/game.js';
import { createSettings } from '../src/core/settings.js';
import type { GameSettings } from '../src/core/types.js';
import { constantRandom } from './support/random.js';

const decimalSettings = createSettings(4, 10);

describe('startGame', () => {
  it('starts a playing round with a deterministic secret', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);

    expect(game.status).toBe('playing');
    expect(game.settings).toEqual(decimalSettings);
    expect(game.secret).toBe('0123');
    expect(game.history).toEqual([]);
    expect(game.startedAt).toBe(1_000);
    expect(game.finishedAt).toBeNull();
  });

  it('accepts a leading zero in the generated secret', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);

    expect(game.secret.startsWith('0')).toBe(true);
  });

  it('can start a binary game with length two', () => {
    const game = startGame(createSettings(2, 2), constantRandom(0), 1_000);

    expect(game.secret).toBe('01');
  });

  it('rejects impossible settings', () => {
    const impossible = { length: 3, base: 2 } as GameSettings;

    expect(() => startGame(impossible, constantRandom(0), 1_000)).toThrow(RangeError);
  });
});

describe('submitGuess', () => {
  it('adds a new attempt without mutating the previous state', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);

    const result = submitGuess(game, '2103', 2_000);

    expect(result.outcome).toBe('accepted');
    expect(result.state).not.toBe(game);
    expect(result.state.history).not.toBe(game.history);
    expect(game.history).toHaveLength(0);
    expect(result.state.history).toHaveLength(1);
    expect(result.attempt).toEqual({
      number: 1,
      guess: '2103',
      bulls: 2,
      cows: 2,
      elapsedMs: 1_000,
    });
  });

  it('keeps older history entries unchanged', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const first = submitGuess(game, '4567', 2_000);
    const second = submitGuess(first.state, '5678', 4_000);
    const firstEntry = first.state.history[0];

    expect(second.state.history).toHaveLength(2);
    expect(second.state.history[0]).toBe(firstEntry);
    expect(second.state.history[0]).toEqual({
      number: 1,
      guess: '4567',
      bulls: 0,
      cows: 0,
      elapsedMs: 1_000,
    });
    expect(second.state.history[1]).toEqual({
      number: 2,
      guess: '5678',
      bulls: 0,
      cows: 0,
      elapsedMs: 3_000,
    });
  });

  it('does not add the exact same guess twice', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const first = submitGuess(game, '4567', 2_000);
    const duplicate = submitGuess(first.state, '4567', 3_000);

    expect(duplicate.outcome).toBe('duplicate');
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.state.history).toHaveLength(1);
  });

  it('detects duplicates case-insensitively for hexadecimal', () => {
    const game = startGame(createSettings(2, 16), constantRandom(0.999999), 1_000);
    const first = submitGuess(game, '0A', 2_000);
    const duplicate = submitGuess(first.state, '0a', 3_000);

    expect(first.outcome).toBe('accepted');
    expect(first.state.history[0]?.guess).toBe('0a');
    expect(duplicate.outcome).toBe('duplicate');
    expect(duplicate.state.history).toHaveLength(1);
  });

  it('rejects a guess of the wrong length without touching history', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const result = submitGuess(game, '123', 2_000);

    expect(result.outcome).toBe('invalid');
    expect(result.error).toBe('length');
    expect(result.state).toBe(game);
  });

  it('rejects invalid digits without touching history', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const result = submitGuess(game, '12a4', 2_000);

    expect(result.outcome).toBe('invalid');
    expect(result.error).toBe('digits');
    expect(result.state).toBe(game);
  });

  it('rejects repeated digits without touching history', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const result = submitGuess(game, '1123', 2_000);

    expect(result.outcome).toBe('invalid');
    expect(result.error).toBe('repeated');
    expect(result.state).toBe(game);
  });

  it('wins when every digit is a bull and records the finish time', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const result = submitGuess(game, '0123', 5_500);

    expect(result.outcome).toBe('won');
    expect(result.state.status).toBe('won');
    expect(result.state.finishedAt).toBe(5_500);
    expect(result.state.history).toHaveLength(1);
    expect(result.attempt?.bulls).toBe(4);
    expect(result.attempt?.cows).toBe(0);
    expect(result.attempt?.elapsedMs).toBe(4_500);
  });

  it('does not accept guesses after the game has been won', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const won = submitGuess(game, '0123', 2_000);
    const late = submitGuess(won.state, '4567', 3_000);

    expect(late.outcome).toBe('finished');
    expect(late.state).toBe(won.state);
    expect(late.state.history).toHaveLength(1);
  });

  it('never produces a negative elapsed time', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const result = submitGuess(game, '4567', 500);

    expect(result.attempt?.elapsedMs).toBe(0);
  });
});

describe('getElapsedMs', () => {
  it('returns zero before the round starts', () => {
    expect(getElapsedMs(createIdleGame(decimalSettings), 5_000)).toBe(0);
  });

  it('measures a running round from its start', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);

    expect(getElapsedMs(game, 5_000)).toBe(4_000);
  });

  it('uses the finish time after a win', () => {
    const game = startGame(decimalSettings, constantRandom(0), 1_000);
    const won = submitGuess(game, '0123', 3_000).state;

    expect(getElapsedMs(won, 9_000)).toBe(2_000);
  });
});
