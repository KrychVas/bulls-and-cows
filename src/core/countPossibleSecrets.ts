import { memoize } from './memoize.js';

const isNonNegativeInteger = (value: number): boolean => Number.isInteger(value) && value >= 0;

/**
 * P(base, length) = base! / (base - length)!
 *
 * The recurrence is one factor at a time:
 * P(base, length) = base * P(base - 1, length - 1).
 * The exported function is memoized, including recursive subproblems.
 */
export const countPossibleSecrets: (length: number, base: number) => number = memoize(
  (length: number, base: number): number => {
    if (!isNonNegativeInteger(length) || !isNonNegativeInteger(base)) {
      return 0;
    }

    if (length === 0) {
      return 1;
    }

    if (length > base) {
      return 0;
    }

    return base * countPossibleSecrets(length - 1, base - 1);
  },
);
