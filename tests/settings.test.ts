import { describe, expect, it } from 'vitest';

import {
  ALL_LENGTHS,
  BASE_OPTIONS,
  DEFAULT_SETTINGS,
  createSettings,
  getAvailableLengths,
  getBaseLabel,
  getMaxLengthForBase,
  isGameLength,
  isLengthAvailable,
  isValidSettings,
} from '../src/core/settings.js';

describe('settings', () => {
  it('offers lengths from two through six', () => {
    expect(ALL_LENGTHS).toEqual([2, 3, 4, 5, 6]);
    expect(isGameLength(2)).toBe(true);
    expect(isGameLength(6)).toBe(true);
    expect(isGameLength(1)).toBe(false);
    expect(isGameLength(7)).toBe(false);
    expect(isGameLength(2.5)).toBe(false);
  });

  it('limits binary games to a length of two', () => {
    expect(getAvailableLengths(2)).toEqual([2]);
    expect(getMaxLengthForBase(2)).toBe(2);
    expect(isLengthAvailable(2, 2)).toBe(true);
    expect(isLengthAvailable(3, 2)).toBe(false);
  });

  it('allows every supported length for octal, decimal, and hexadecimal', () => {
    expect(getAvailableLengths(8)).toEqual([2, 3, 4, 5, 6]);
    expect(getAvailableLengths(10)).toEqual([2, 3, 4, 5, 6]);
    expect(getAvailableLengths(16)).toEqual([2, 3, 4, 5, 6]);
  });

  it('returns no lengths for an unsupported base', () => {
    expect(getAvailableLengths(3)).toEqual([]);
    expect(getMaxLengthForBase(3)).toBe(0);
  });

  it('validates settings against the available alphabet', () => {
    expect(isValidSettings({ length: 4, base: 10 })).toBe(true);
    expect(isValidSettings({ length: 2, base: 2 })).toBe(true);
    expect(isValidSettings({ length: 3, base: 2 })).toBe(false);
    expect(isValidSettings({ length: 7, base: 16 })).toBe(false);
    expect(isValidSettings({ length: 0, base: 10 })).toBe(false);
  });

  it('creates a valid settings object', () => {
    expect(createSettings(3, 8)).toEqual({ length: 3, base: 8 });
    expect(createSettings(2, 2)).toEqual({ length: 2, base: 2 });
  });

  it('throws when asked to create impossible settings', () => {
    expect(() => createSettings(3, 2)).toThrow(RangeError);
    expect(() => createSettings(1, 10)).toThrow(RangeError);
    expect(() => createSettings(2, 3)).toThrow(RangeError);
  });

  it('exposes a decimal default', () => {
    expect(DEFAULT_SETTINGS).toEqual({ length: 4, base: 10 });
    expect(isValidSettings(DEFAULT_SETTINGS)).toBe(true);
  });

  it('exposes human-readable base labels and options', () => {
    expect(getBaseLabel(2)).toBe('Binary');
    expect(getBaseLabel(8)).toBe('Octal');
    expect(getBaseLabel(10)).toBe('Decimal');
    expect(getBaseLabel(16)).toBe('Hexadecimal');
    expect(BASE_OPTIONS.map((option) => option.base)).toEqual([2, 8, 10, 16]);
  });
});
