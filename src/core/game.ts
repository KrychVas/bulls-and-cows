import { evaluateGuess } from './evaluateGuess.js';
import { generateSecret } from './generateSecret.js';
import { getGuessValidationError, type GuessValidationError } from './isValidGuess.js';
import { isValidSettings } from './settings.js';
import type { GameSettings, GuessResult, RandomSource } from './types.js';

export type GameStatus = 'idle' | 'playing' | 'won';

export interface Attempt extends GuessResult {
  readonly number: number;
  readonly guess: string;
  readonly elapsedMs: number;
}

export interface GameState {
  readonly status: GameStatus;
  readonly settings: GameSettings;
  readonly secret: string;
  readonly history: readonly Attempt[];
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
}

export type SubmitOutcome = 'accepted' | 'won' | 'invalid' | 'duplicate' | 'finished';

export interface SubmitResult {
  readonly outcome: SubmitOutcome;
  readonly state: GameState;
  readonly attempt?: Attempt;
  readonly error?: GuessValidationError;
}

export const createIdleGame = (settings: GameSettings): GameState => ({
  status: 'idle',
  settings,
  secret: '',
  history: [],
  startedAt: null,
  finishedAt: null,
});

export const startGame = (
  settings: GameSettings,
  random: RandomSource,
  startedAt: number,
): GameState => {
  if (!isValidSettings(settings)) {
    throw new RangeError('Cannot start a game with invalid settings');
  }

  return {
    status: 'playing',
    settings,
    secret: generateSecret(settings.length, settings.base, random),
    history: [],
    startedAt,
    finishedAt: null,
  };
};

export const submitGuess = (state: GameState, rawGuess: string, at: number): SubmitResult => {
  if (state.status !== 'playing') {
    return { outcome: 'finished', state };
  }

  const guess = rawGuess.toLowerCase();

  if (state.history.some((entry) => entry.guess === guess)) {
    return { outcome: 'duplicate', state };
  }

  const error = getGuessValidationError(guess, state.settings.length, state.settings.base);

  if (error !== null) {
    return { outcome: 'invalid', state, error };
  }

  const result = evaluateGuess(state.secret, guess);
  const elapsedMs = Math.max(0, at - (state.startedAt ?? at));
  const attempt: Attempt = {
    number: state.history.length + 1,
    guess,
    bulls: result.bulls,
    cows: result.cows,
    elapsedMs,
  };
  const hasWon = result.bulls === state.settings.length;
  const status: GameStatus = hasWon ? 'won' : 'playing';
  const nextState: GameState = {
    ...state,
    status,
    history: [...state.history, attempt],
    finishedAt: hasWon ? at : null,
  };

  return {
    outcome: hasWon ? 'won' : 'accepted',
    state: nextState,
    attempt,
  };
};

export const getElapsedMs = (state: GameState, now: number): number => {
  if (state.startedAt === null) {
    return 0;
  }

  const end = state.finishedAt ?? now;
  return Math.max(0, end - state.startedAt);
};
