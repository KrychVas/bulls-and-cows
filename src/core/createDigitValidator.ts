import { getAlphabet } from './digits.js';

export type DigitPredicate = (character: string) => boolean;

/**
 * Curried digit factory: fixing the base yields a reusable predicate.
 * Hexadecimal letters compare case-insensitively.
 */
export const createDigitValidator = (base: number): DigitPredicate => {
  const alphabet = getAlphabet(base);

  return (character: string): boolean =>
    character.length === 1 && alphabet.includes(character.toLowerCase());
};

/**
 * Second consumer of the curried validator: filters live input while typing.
 */
export const filterAllowedDigits = (input: string, length: number, base: number): string => {
  const isValidDigit = createDigitValidator(base);
  const limit = Number.isFinite(length) ? Math.max(0, Math.floor(length)) : 0;

  return Array.from(input.toLowerCase()).filter(isValidDigit).slice(0, limit).join('');
};
