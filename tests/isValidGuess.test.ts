import { describe, expect, it } from 'vitest';

import { getGuessValidationError, isValidGuess } from '../src/core/isValidGuess.js';

describe('isValidGuess', () => {
  it('accepts a guess with the right length and unique digits', () => {
    expect(isValidGuess('1234', 4, 10)).toBe(true);
    expect(isValidGuess('5072', 4, 10)).toBe(true);
  });

  it('accepts leading zeroes because the secret is a string', () => {
    expect(isValidGuess('0123', 4, 10)).toBe(true);
    expect(isValidGuess('01', 2, 2)).toBe(true);
  });

  it('accepts hexadecimal letters in either case', () => {
    expect(isValidGuess('A1b2', 4, 16)).toBe(true);
    expect(isValidGuess('face', 4, 16)).toBe(true);
  });

  it('rejects guesses of the wrong length', () => {
    expect(isValidGuess('123', 4, 10)).toBe(false);
    expect(isValidGuess('12345', 4, 10)).toBe(false);
    expect(isValidGuess('', 4, 10)).toBe(false);
  });

  it('rejects digits that do not exist in the base', () => {
    expect(isValidGuess('12a4', 4, 10)).toBe(false);
    expect(isValidGuess('012', 3, 2)).toBe(false);
    expect(isValidGuess('12g4', 4, 16)).toBe(false);
    expect(isValidGuess('1 23', 4, 10)).toBe(false);
  });

  it('rejects repeated digits', () => {
    expect(isValidGuess('1123', 4, 10)).toBe(false);
    expect(isValidGuess('0000', 4, 10)).toBe(false);
  });

  it('treats upper- and lowercase hexadecimal letters as the same digit', () => {
    expect(isValidGuess('A1a2', 4, 16)).toBe(false);
    expect(isValidGuess('Ff12', 4, 16)).toBe(false);
  });

  it('rejects a length that is impossible for the base', () => {
    expect(isValidGuess('010', 3, 2)).toBe(false);
    expect(isValidGuess('0123', 4, 2)).toBe(false);
  });

  it('rejects an unsupported base or invalid length argument', () => {
    expect(isValidGuess('01', 2, 3)).toBe(false);
    expect(isValidGuess('01', 0, 10)).toBe(false);
    expect(isValidGuess('01', 1.5, 10)).toBe(false);
  });
});

describe('getGuessValidationError', () => {
  it('returns null for a valid guess', () => {
    expect(getGuessValidationError('0123', 4, 10)).toBeNull();
  });

  it('distinguishes a length error', () => {
    expect(getGuessValidationError('123', 4, 10)).toBe('length');
  });

  it('distinguishes an invalid-character error', () => {
    expect(getGuessValidationError('12a4', 4, 10)).toBe('digits');
  });

  it('distinguishes a repeated-digit error', () => {
    expect(getGuessValidationError('1123', 4, 10)).toBe('repeated');
  });

  it('reports inconsistent settings as a settings error', () => {
    expect(getGuessValidationError('010', 3, 2)).toBe('settings');
    expect(getGuessValidationError('01', 2, 3)).toBe('settings');
  });

  it('checks length before characters and characters before repetition', () => {
    expect(getGuessValidationError('12a', 4, 10)).toBe('length');
    expect(getGuessValidationError('11a2', 4, 10)).toBe('digits');
  });
});
