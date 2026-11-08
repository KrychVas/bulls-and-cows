import { describe, expect, it } from 'vitest';

import { evaluateGuess } from '../src/core/evaluateGuess.js';

describe('evaluateGuess', () => {
  it('counts a perfect match as four bulls', () => {
    expect(evaluateGuess('1234', '1234')).toEqual({ bulls: 4, cows: 0 });
  });

  it('reports no matches when no digit occurs in the secret', () => {
    expect(evaluateGuess('1234', '5678')).toEqual({ bulls: 0, cows: 0 });
  });

  it('counts every misplaced digit as a cow', () => {
    expect(evaluateGuess('1234', '4321')).toEqual({ bulls: 0, cows: 4 });
  });

  it('counts bulls and cows together for a partial match', () => {
    expect(evaluateGuess('1234', '1243')).toEqual({ bulls: 2, cows: 2 });
    expect(evaluateGuess('0123', '3210')).toEqual({ bulls: 0, cows: 4 });
    expect(evaluateGuess('0123', '2103')).toEqual({ bulls: 2, cows: 2 });
  });

  it('handles leading zeroes as ordinary digits', () => {
    expect(evaluateGuess('0123', '0123')).toEqual({ bulls: 4, cows: 0 });
    expect(evaluateGuess('0123', '0213')).toEqual({ bulls: 2, cows: 2 });
  });

  it('is case-insensitive for hexadecimal digits', () => {
    expect(evaluateGuess('A1b2', 'a1B2')).toEqual({ bulls: 4, cows: 0 });
    expect(evaluateGuess('abcd', 'BADC')).toEqual({ bulls: 0, cows: 4 });
  });

  it('accepts secrets and guesses as arrays of digits', () => {
    expect(evaluateGuess(['a', '1', 'b', '2'], ['A', '1', 'B', '2'])).toEqual({
      bulls: 4,
      cows: 0,
    });
  });

  it('respects duplicate counts instead of using plain set intersection', () => {
    expect(evaluateGuess('1234', '1123')).toEqual({ bulls: 1, cows: 2 });
  });

  it('handles empty input without throwing', () => {
    expect(evaluateGuess('', '')).toEqual({ bulls: 0, cows: 0 });
    expect(evaluateGuess('1234', '')).toEqual({ bulls: 0, cows: 0 });
  });

  it('returns a fresh result object', () => {
    const first = evaluateGuess('1234', '1243');
    const second = evaluateGuess('1234', '1243');

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it('does not mutate array inputs', () => {
    const secret = Object.freeze(['1', '2', '3', '4']);
    const guess = Object.freeze(['4', '3', '2', '1']);

    expect(evaluateGuess(secret, guess)).toEqual({ bulls: 0, cows: 4 });
    expect(secret).toEqual(['1', '2', '3', '4']);
    expect(guess).toEqual(['4', '3', '2', '1']);
  });
});
