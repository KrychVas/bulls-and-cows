import { isSupportedBase } from './digits.js';
import type { Base, GameLength, GameSettings } from './types.js';

export const MIN_LENGTH = 2;
export const MAX_LENGTH = 6;

export const ALL_LENGTHS = [2, 3, 4, 5, 6] as const satisfies readonly GameLength[];

export interface BaseOption {
  readonly base: Base;
  readonly code: string;
  readonly label: string;
  readonly digits: string;
  readonly description: string;
}

const BASE_OPTIONS_DATA: readonly BaseOption[] = [
  {
    base: 2,
    code: 'BIN',
    label: 'Binary',
    digits: '0–1',
    description: 'Only two digits, so every round has length 2.',
  },
  {
    base: 8,
    code: 'OCT',
    label: 'Octal',
    digits: '0–7',
    description: 'Eight digits with a compact board.',
  },
  {
    base: 10,
    code: 'DEC',
    label: 'Decimal',
    digits: '0–9',
    description: 'The classic Bulls and Cows experience.',
  },
  {
    base: 16,
    code: 'HEX',
    label: 'Hexadecimal',
    digits: '0–9, A–F',
    description: 'Letters count as digits; case does not matter.',
  },
];

export const BASE_OPTIONS: readonly BaseOption[] = Object.freeze(BASE_OPTIONS_DATA);

const DEFAULT_SETTINGS_DATA: GameSettings = {
  length: 4,
  base: 10,
};

export const DEFAULT_SETTINGS: GameSettings = Object.freeze(DEFAULT_SETTINGS_DATA);

export interface SettingsCandidate {
  readonly length: number;
  readonly base: number;
}

export const isGameLength = (length: number): length is GameLength =>
  ALL_LENGTHS.some((candidate) => candidate === length);

export const getMaxLengthForBase = (base: number): number => {
  if (!isSupportedBase(base)) {
    return 0;
  }

  return Math.min(MAX_LENGTH, base);
};

export const isLengthAvailable = (length: number, base: number): boolean =>
  isSupportedBase(base) && isGameLength(length) && length <= base;

export const getAvailableLengths = (base: number): readonly GameLength[] =>
  ALL_LENGTHS.filter((length) => isLengthAvailable(length, base));

export const isValidSettings = (settings: SettingsCandidate): settings is GameSettings =>
  isGameLength(settings.length) &&
  isSupportedBase(settings.base) &&
  isLengthAvailable(settings.length, settings.base);

export const createSettings = (length: number, base: number): GameSettings => {
  if (!isGameLength(length)) {
    throw new RangeError(`Unsupported game length: ${length}`);
  }

  if (!isSupportedBase(base)) {
    throw new RangeError(`Unsupported base: ${base}`);
  }

  if (!isLengthAvailable(length, base)) {
    throw new RangeError(`Length ${length} does not fit into base ${base}`);
  }

  return Object.freeze({ length, base });
};

export const getBaseLabel = (base: number): string =>
  BASE_OPTIONS.find((option) => option.base === base)?.label ?? `Base ${base}`;
