import { describe, expect, it } from 'vitest';

import { formatBase, formatDuration, formatSettings } from '../src/core/format.js';

describe('formatDuration', () => {
  it('formats seconds and minutes as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(999)).toBe('00:00');
    expect(formatDuration(1_000)).toBe('00:01');
    expect(formatDuration(61_000)).toBe('01:01');
    expect(formatDuration(3_600_000)).toBe('60:00');
  });

  it('never displays a negative or non-finite duration', () => {
    expect(formatDuration(-1)).toBe('00:00');
    expect(formatDuration(Number.NaN)).toBe('00:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('00:00');
  });
});

describe('formatBase', () => {
  it('formats supported bases as short uppercase labels', () => {
    expect(formatBase(2)).toBe('BIN');
    expect(formatBase(8)).toBe('OCT');
    expect(formatBase(10)).toBe('DEC');
    expect(formatBase(16)).toBe('HEX');
  });

  it('falls back to the numeric base for unknown values', () => {
    expect(formatBase(3)).toBe('BASE 3');
  });
});

describe('formatSettings', () => {
  it('combines length and base into a compact badge', () => {
    expect(formatSettings({ length: 4, base: 10 })).toBe('4 digits · DEC');
    expect(formatSettings({ length: 2, base: 2 })).toBe('2 digits · BIN');
  });
});
