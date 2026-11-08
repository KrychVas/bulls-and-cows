import { describe, expect, it, vi } from 'vitest';

import { generateSecret } from '../src/core/generateSecret.js';
import { constantRandom, sequenceRandom } from './support/random.js';

describe('generateSecret', () => {
  it('returns a secret of the requested length', () => {
    expect(generateSecret(4, 10, constantRandom(0))).toHaveLength(4);
    expect(generateSecret(6, 16, constantRandom(0))).toHaveLength(6);
  });

  it('is deterministic when the random source is deterministic', () => {
    expect(generateSecret(4, 10, constantRandom(0))).toBe('0123');
    expect(generateSecret(4, 10, constantRandom(0.999999))).toBe('9876');
  });

  it('uses each random value to pick one digit from the shrinking pool', () => {
    const secret = generateSecret(4, 10, sequenceRandom([0.5, 0.5, 0, 0]));

    expect(secret).toBe('5401');
  });

  it('never repeats a digit', () => {
    const secret = generateSecret(6, 10, constantRandom(0));

    expect(new Set(secret).size).toBe(secret.length);
  });

  it('supports a leading zero', () => {
    expect(generateSecret(4, 10, constantRandom(0))).toBe('0123');
  });

  it('can generate every digit of the base once', () => {
    const secret = generateSecret(16, 16, constantRandom(0));

    expect(secret).toBe('0123456789abcdef');
  });

  it('works for the binary base', () => {
    const secret = generateSecret(2, 2, constantRandom(0));

    expect(secret).toBe('01');
    expect(new Set(secret).size).toBe(2);
  });

  it('only contains characters from the chosen base', () => {
    const secret = generateSecret(5, 8, sequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5]));

    expect(secret.split('').every((digit) => '01234567'.includes(digit))).toBe(true);
  });

  it('calls the random source exactly once per selected digit', () => {
    const random = vi.fn(() => 0.25);

    generateSecret(5, 10, random);

    expect(random).toHaveBeenCalledTimes(5);
  });

  it('does not mutate the deterministic random source', () => {
    const values = [0.1, 0.2, 0.3, 0.4];
    const random = sequenceRandom(values);

    generateSecret(4, 10, random);

    expect(values).toEqual([0.1, 0.2, 0.3, 0.4]);
  });

  it('allows a one-digit secret at the core level', () => {
    expect(generateSecret(1, 10, constantRandom(0.5))).toBe('5');
  });

  it('throws when the requested length is impossible', () => {
    expect(() => generateSecret(0, 10, constantRandom(0))).toThrow(RangeError);
    expect(() => generateSecret(-1, 10, constantRandom(0))).toThrow(RangeError);
    expect(() => generateSecret(1.5, 10, constantRandom(0))).toThrow(RangeError);
    expect(() => generateSecret(11, 10, constantRandom(0))).toThrow(RangeError);
    expect(() => generateSecret(3, 2, constantRandom(0))).toThrow(RangeError);
  });

  it('throws for an unsupported base', () => {
    expect(() => generateSecret(2, 3, constantRandom(0))).toThrow(RangeError);
    expect(() => generateSecret(2, 0, constantRandom(0))).toThrow(RangeError);
  });

  it('throws when the random source leaves the interval [0, 1)', () => {
    expect(() => generateSecret(2, 10, constantRandom(1))).toThrow(RangeError);
    expect(() => generateSecret(2, 10, constantRandom(-0.1))).toThrow(RangeError);
    expect(() => generateSecret(2, 10, constantRandom(Number.NaN))).toThrow(RangeError);
  });
});
