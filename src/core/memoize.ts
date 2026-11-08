type Primitive = string | number | boolean | null | undefined;

const cacheKey = (args: readonly Primitive[]): string =>
  JSON.stringify(args.map((argument) => [typeof argument, argument])) ?? '';

/**
 * Memoizes a function whose arguments are primitive values.
 *
 * Keys include the argument type, so `null`, `undefined`, and the string
 * `"null"` remain distinct cache entries.
 */
export const memoize = <Args extends readonly Primitive[], Result>(
  compute: (...args: Args) => Result,
): ((...args: Args) => Result) => {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = cacheKey(args);

    if (cache.has(key)) {
      return cache.get(key) as Result;
    }

    const result = compute(...args);
    cache.set(key, result);
    return result;
  };
};
