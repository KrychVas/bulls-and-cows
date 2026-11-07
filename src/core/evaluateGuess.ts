import { toDigits } from './digits.js';
import type { DigitSequence, GuessResult } from './types.js';

/**
 * Counts digits in a single pass. The accumulator is local to this pure
 * function, so mutating it cannot be observed by callers.
 */
const countDigits = (digits: readonly string[]): ReadonlyMap<string, number> =>
  digits.reduce<Map<string, number>>((counts, digit) => {
    counts.set(digit, (counts.get(digit) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

export const evaluateGuess = (secret: DigitSequence, guess: DigitSequence): GuessResult => {
  const secretDigits = toDigits(secret);
  const guessDigits = toDigits(guess);

  const bulls = guessDigits.filter((digit, index) => secretDigits[index] === digit).length;

  const secretCounts = countDigits(secretDigits);
  const guessCounts = countDigits(guessDigits);

  const commonDigits = [...guessCounts.entries()].reduce(
    (total, [digit, count]) => total + Math.min(count, secretCounts.get(digit) ?? 0),
    0,
  );

  return {
    bulls,
    cows: Math.max(0, commonDigits - bulls),
  };
};
