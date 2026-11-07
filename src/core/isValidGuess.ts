import { createDigitValidator } from './createDigitValidator.js';
import { isSupportedBase } from './digits.js';

export type GuessValidationError = 'settings' | 'length' | 'digits' | 'repeated';

export const getGuessValidationError = (
  guess: string,
  length: number,
  base: number,
): GuessValidationError | null => {
  if (!isSupportedBase(base) || !Number.isInteger(length) || length < 1 || length > base) {
    return 'settings';
  }

  const digits = Array.from(guess.toLowerCase());

  if (digits.length !== length) {
    return 'length';
  }

  const isValidDigit = createDigitValidator(base);

  if (!digits.every(isValidDigit)) {
    return 'digits';
  }

  if (new Set(digits).size !== digits.length) {
    return 'repeated';
  }

  return null;
};

export const isValidGuess = (guess: string, length: number, base: number): boolean =>
  getGuessValidationError(guess, length, base) === null;
