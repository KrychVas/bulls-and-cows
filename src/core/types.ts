export const SUPPORTED_BASES = [2, 8, 10, 16] as const;

export type Base = (typeof SUPPORTED_BASES)[number];

export type GameLength = 2 | 3 | 4 | 5 | 6;

export type DigitSequence = string | readonly string[];

export type RandomSource = () => number;

export interface GuessResult {
  readonly bulls: number;
  readonly cows: number;
}

export interface GameSettings {
  readonly length: GameLength;
  readonly base: Base;
}
