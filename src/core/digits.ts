import { SUPPORTED_BASES, type Base, type DigitSequence } from './types.js';

const ALPHABETS: Readonly<Record<Base, string>> = Object.freeze({
  2: '01',
  8: '01234567',
  10: '0123456789',
  16: '0123456789abcdef',
});

export const isSupportedBase = (base: number): base is Base =>
  SUPPORTED_BASES.some((supportedBase) => supportedBase === base);

export const getAlphabet = (base: number): string => {
  if (!isSupportedBase(base)) {
    throw new RangeError(`Unsupported base: ${base}`);
  }

  return ALPHABETS[base];
};

export const normalizeDigit = (digit: string): string => digit.toLowerCase();

export const toDigits = (value: DigitSequence): readonly string[] =>
  typeof value === 'string' ? Array.from(value.toLowerCase()) : value.map(normalizeDigit);
