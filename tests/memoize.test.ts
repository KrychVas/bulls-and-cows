import { describe, expect, it, vi } from 'vitest';

import { memoize } from '../src/core/memoize.js';

describe('memoize', () => {
  it('computes once for repeated arguments', () => {
    const compute = vi.fn((value: number) => value * 2);
    const doubled = memoize(compute);

    expect(doubled(4)).toBe(8);
    expect(doubled(4)).toBe(8);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('computes separately for different arguments', () => {
    const compute = vi.fn((left: number, right: number) => left + right);
    const add = memoize(compute);

    expect(add(1, 2)).toBe(3);
    expect(add(2, 1)).toBe(3);
    expect(add(1, 2)).toBe(3);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('keeps the original result object', () => {
    const result = { value: 42 };
    const getResult = memoize(() => result);

    expect(getResult()).toBe(result);
    expect(getResult()).toBe(result);
  });

  it('caches undefined results too', () => {
    const compute = vi.fn(() => undefined);
    const getUndefined = memoize(compute);

    expect(getUndefined()).toBeUndefined();
    expect(getUndefined()).toBeUndefined();
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('does not confuse null, undefined, and string keys', () => {
    const compute = vi.fn((value: string | null | undefined) => String(value));
    const stringify = memoize(compute);

    expect(stringify(null)).toBe('null');
    expect(stringify(undefined)).toBe('undefined');
    expect(stringify('null')).toBe('null');
    expect(compute).toHaveBeenCalledTimes(3);
  });

  it('supports functions without arguments', () => {
    const compute = vi.fn(() => 7);
    const getSeven = memoize(compute);

    expect(getSeven()).toBe(7);
    expect(getSeven()).toBe(7);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('does not share caches between memoized functions', () => {
    const first = vi.fn((value: number) => value + 1);
    const second = vi.fn((value: number) => value + 10);
    const increment = memoize(first);
    const addTen = memoize(second);

    expect(increment(1)).toBe(2);
    expect(addTen(1)).toBe(11);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
