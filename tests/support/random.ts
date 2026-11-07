export const constantRandom =
  (value: number): (() => number) =>
  () =>
    value;

export const sequenceRandom = (values: readonly number[]): (() => number) => {
  let index = 0;

  return () => {
    const value = values[index];
    index += 1;

    if (value === undefined) {
      throw new Error('The deterministic random source ran out of values.');
    }

    return value;
  };
};
