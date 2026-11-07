import { getAlphabet } from './digits.js';
import type { RandomSource } from './types.js';

const pickIndex = (poolSize: number, random: RandomSource): number => {
  const value = random();

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random source must return a number in [0, 1)');
  }

  return Math.floor(value * poolSize);
};

const pickUniqueDigits = (
  pool: readonly string[],
  remaining: number,
  prefix: string,
  random: RandomSource,
): string => {
  if (remaining === 0) {
    return prefix;
  }

  const index = pickIndex(pool.length, random);
  const digit = pool[index];

  if (digit === undefined) {
    throw new RangeError('Random index fell outside the digit pool');
  }

  const nextPool = pool.filter((_, poolIndex) => poolIndex !== index);

  return pickUniqueDigits(nextPool, remaining - 1, prefix + digit, random);
};

export const generateSecret = (
  length: number,
  base: number,
  random: RandomSource = Math.random,
): string => {
  const alphabet = getAlphabet(base);

  if (!Number.isInteger(length) || length < 1 || length > alphabet.length) {
    throw new RangeError(`Cannot generate ${length} unique digits for base ${base}`);
  }

  return pickUniqueDigits(Array.from(alphabet), length, '', random);
};
