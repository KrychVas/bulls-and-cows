import { describe, expect, it } from 'vitest';

import { createDigitValidator, filterAllowedDigits } from '../src/core/createDigitValidator.js';

describe('createDigitValidator', () => {
  it('accepts every decimal digit', () => {
    const isDecimalDigit = createDigitValidator(10);

    expect('0123456789'.split('').every(isDecimalDigit)).toBe(true);
  });

  it('rejects characters outside the requested base', () => {
    const isBinaryDigit = createDigitValidator(2);
    const isDecimalDigit = createDigitValidator(10);

    expect(isBinaryDigit('0')).toBe(true);
    expect(isBinaryDigit('1')).toBe(true);
    expect(isBinaryDigit('2')).toBe(false);
    expect(isDecimalDigit('a')).toBe(false);
    expect(isDecimalDigit('A')).toBe(false);
  });

  it('accepts hexadecimal letters in either case', () => {
    const isHexDigit = createDigitValidator(16);

    expect(isHexDigit('a')).toBe(true);
    expect(isHexDigit('A')).toBe(true);
    expect(isHexDigit('f')).toBe(true);
    expect(isHexDigit('F')).toBe(true);
    expect(isHexDigit('g')).toBe(false);
    expect(isHexDigit('G')).toBe(false);
  });

  it('rejects empty strings, whitespace, and multi-character input', () => {
    const isDecimalDigit = createDigitValidator(10);

    expect(isDecimalDigit('')).toBe(false);
    expect(isDecimalDigit(' ')).toBe(false);
    expect(isDecimalDigit('10')).toBe(false);
    expect(isDecimalDigit(' 1')).toBe(false);
  });

  it('returns independent predicates for different bases', () => {
    const isOctalDigit = createDigitValidator(8);
    const isHexDigit = createDigitValidator(16);

    expect(isOctalDigit('a')).toBe(false);
    expect(isHexDigit('a')).toBe(true);
    expect(isOctalDigit('7')).toBe(true);
    expect(isOctalDigit('8')).toBe(false);
  });

  it('does not mutate or remember characters between calls', () => {
    const isHexDigit = createDigitValidator(16);

    expect(isHexDigit('a')).toBe(true);
    expect(isHexDigit('z')).toBe(false);
    expect(isHexDigit('b')).toBe(true);
  });

  it('throws for an unsupported base', () => {
    expect(() => createDigitValidator(3)).toThrow(RangeError);
    expect(() => createDigitValidator(0)).toThrow(RangeError);
    expect(() => createDigitValidator(1.5)).toThrow(RangeError);
  });
});

describe('filterAllowedDigits', () => {
  it('removes characters that are invalid for the base', () => {
    expect(filterAllowedDigits('1a2b3', 4, 10)).toBe('123');
  });

  it('normalizes hexadecimal letters to lowercase', () => {
    expect(filterAllowedDigits('A1B2', 4, 16)).toBe('a1b2');
  });

  it('keeps only the requested number of digits', () => {
    expect(filterAllowedDigits('012345', 4, 10)).toBe('0123');
  });

  it('removes whitespace and punctuation', () => {
    expect(filterAllowedDigits(' 0-1_2 ', 4, 2)).toBe('01');
  });

  it('returns an empty string when no characters are allowed', () => {
    expect(filterAllowedDigits('xyz', 4, 10)).toBe('');
  });

  it('throws for an unsupported base', () => {
    expect(() => filterAllowedDigits('0123', 4, 3)).toThrow(RangeError);
  });
});
