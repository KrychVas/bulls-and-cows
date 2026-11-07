import { describe, expect, it } from 'vitest';

import { countPossibleSecrets } from '../src/core/countPossibleSecrets.js';

describe('countPossibleSecrets', () => {
  it('returns one permutation for an empty secret', () => {
    expect(countPossibleSecrets(0, 10)).toBe(1);
    expect(countPossibleSecrets(0, 0)).toBe(1);
  });

  it('counts permutations without repetitions', () => {
    expect(countPossibleSecrets(1, 10)).toBe(10);
    expect(countPossibleSecrets(2, 10)).toBe(90);
    expect(countPossibleSecrets(3, 10)).toBe(720);
    expect(countPossibleSecrets(4, 10)).toBe(5_040);
    expect(countPossibleSecrets(6, 10)).toBe(151_200);
  });

  it('supports other bases', () => {
    expect(countPossibleSecrets(2, 2)).toBe(2);
    expect(countPossibleSecrets(2, 8)).toBe(56);
    expect(countPossibleSecrets(4, 16)).toBe(43_680);
    expect(countPossibleSecrets(6, 6)).toBe(720);
  });

  it('returns zero when the length cannot fit into the base', () => {
    expect(countPossibleSecrets(3, 2)).toBe(0);
    expect(countPossibleSecrets(7, 6)).toBe(0);
    expect(countPossibleSecrets(11, 10)).toBe(0);
  });

  it('returns zero for negative or fractional arguments', () => {
    expect(countPossibleSecrets(-1, 10)).toBe(0);
    expect(countPossibleSecrets(2, -1)).toBe(0);
    expect(countPossibleSecrets(2.5, 10)).toBe(0);
    expect(countPossibleSecrets(4, 10.5)).toBe(0);
  });

  it('is memoized', () => {
    const first = countPossibleSecrets(6, 16);
    const second = countPossibleSecrets(6, 16);

    expect(second).toBe(first);
    expect(first).toBe(5_765_760);
  });
});
