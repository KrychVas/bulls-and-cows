import type { GuessValidationError } from '../core/isValidGuess.js';
import type { GameState } from '../core/game.js';
import { startGame, submitGuess } from '../core/game.js';
import type { GameRecord } from '../core/records.js';
import { addRecord, toGameRecord } from '../core/records.js';
import { DEFAULT_SETTINGS, getBaseLabel } from '../core/settings.js';
import type { GameSettings } from '../core/types.js';
import type { FeedbackTone, GameViewHandle } from './gameView.js';
import { createGameView } from './gameView.js';
import { createFooter, createHeader } from './header.js';
import { el } from './dom.js';
import {
  clampVolume,
  readTheme,
  readVolume,
  saveTheme,
  saveVolume,
  type Theme,
} from './preferences.js';
import { createSetupView } from './setupView.js';
import { getBrowserStorage, loadRecords, saveRecords } from './storage.js';

type Screen = 'setup' | 'game';

interface AppState {
  readonly screen: Screen;
  readonly settings: GameSettings;
  readonly game: GameState | null;
  readonly records: readonly GameRecord[];
  readonly feedback: string | null;
  readonly feedbackTone: FeedbackTone;
  readonly recordRank: number | null;
}

const initialState = (records: readonly GameRecord[]): AppState => ({
  screen: 'setup',
  settings: DEFAULT_SETTINGS,
  game: null,
  records,
  feedback: null,
  feedbackTone: 'info',
  recordRank: null,
});

const validationMessage = (error: GuessValidationError, settings: GameSettings): string => {
  switch (error) {
    case 'settings':
      return 'Those settings are no longer valid. Start a new round.';
    case 'length':
      return `Enter exactly ${settings.length} digits.`;
    case 'digits':
      return `Use only digits from the ${getBaseLabel(settings.base)} alphabet.`;
    case 'repeated':
      return 'Each digit may appear only once. Try a different combination.';
    default:
      return 'That guess is not valid.';
  }
};

const describeAttempt = (state: GameState): string => {
  const attempt = state.history.at(-1);

  if (attempt === undefined) {
    return 'Guess recorded.';
  }

  return `${attempt.bulls} ${attempt.bulls === 1 ? 'bull' : 'bulls'}, ${attempt.cows} ${attempt.cows === 1 ? 'cow' : 'cows'}.`;
};

export const mountApp = (root: HTMLElement): (() => void) => {
  const storage = getBrowserStorage();
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  let theme: Theme = readTheme(storage, prefersDark);
  let volume = readVolume(storage);
  let musicPlaying = false;
  let musicRequestPending = false;
  let musicPausedByUser = false;

  const audio = new Audio('./assets/muz.mp3');
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = volume;

  const applyTheme = (): void => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#12110f' : '#f3efe6');
  };

  applyTheme();

  let state = initialState(loadRecords(storage));
  let timerId: number | null = null;
  let gameView: GameViewHandle | null = null;

  const stopTimer = (): void => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = (): void => {
    stopTimer();

    if (state.screen !== 'game' || state.game?.status !== 'playing') {
      return;
    }

    timerId = window.setInterval(() => {
      gameView?.updateTimer(Date.now());
    }, 250);
  };

  const render = (): void => {
    stopTimer();
    gameView = null;

    let screen: HTMLElement;

    if (state.screen === 'game' && state.game !== null) {
      const handle = createGameView({
        game: state.game,
        records: state.records,
        feedback: state.feedback,
        feedbackTone: state.feedbackTone,
        recordRank: state.recordRank,
        onSubmit: handleSubmit,
        onNewGame: handleNewGame,
      });

      gameView = handle;
      screen = handle.element;
    } else {
      screen = createSetupView({
        settings: state.settings,
        records: state.records,
        onSettingsChange: handleSettingsChange,
        onStart: handleStart,
      });
    }

    root.replaceChildren(
      createHeader({
        theme,
        musicPlaying,
        volume,
        onToggleTheme: handleThemeToggle,
        onToggleMusic: handleMusicToggle,
        onVolumeChange: handleVolumeChange,
      }),
      el('main', { className: 'page' }, [screen, createFooter()]),
    );

    if (state.game?.status === 'playing') {
      startTimer();
      gameView?.focusGuess();
    }
  };

  const startMusic = (): void => {
    if (musicPausedByUser || musicRequestPending || musicPlaying || !audio.paused) {
      return;
    }

    musicPlaying = true;
    musicRequestPending = true;

    void audio
      .play()
      .catch(() => {
        musicPlaying = false;
      })
      .finally(() => {
        musicRequestPending = false;
        render();
      });
  };

  const handleThemeToggle = (): void => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveTheme(theme, storage);
    render();
  };

  const handleMusicToggle = (): void => {
    if (musicRequestPending) {
      return;
    }

    if (musicPlaying || !audio.paused) {
      audio.pause();
      musicPlaying = false;
      musicPausedByUser = true;
      render();
      return;
    }

    musicPausedByUser = false;
    startMusic();
    render();
  };

  const handleVolumeChange = (nextVolume: number): void => {
    volume = clampVolume(nextVolume);
    audio.volume = volume;
    saveVolume(volume, storage);
  };

  const handleSettingsChange = (settings: GameSettings): void => {
    state = {
      ...state,
      settings,
      feedback: null,
      feedbackTone: 'info',
    };
    render();
  };

  const handleStart = (): void => {
    startMusic();
    const game = startGame(state.settings, Math.random, Date.now());

    state = {
      ...state,
      screen: 'game',
      game,
      feedback: null,
      feedbackTone: 'info',
      recordRank: null,
    };
    render();
  };

  const handleNewGame = (): void => {
    state = {
      ...state,
      screen: 'setup',
      game: null,
      feedback: null,
      feedbackTone: 'info',
      recordRank: null,
    };
    render();
  };

  const handleSubmit = (guess: string): void => {
    if (state.game === null) {
      return;
    }

    const result = submitGuess(state.game, guess, Date.now());

    if (result.outcome === 'invalid') {
      state = {
        ...state,
        game: result.state,
        feedback:
          result.error === undefined
            ? 'That guess is not valid.'
            : validationMessage(result.error, state.settings),
        feedbackTone: 'error',
      };
      render();
      return;
    }

    if (result.outcome === 'duplicate') {
      state = {
        ...state,
        game: result.state,
        feedback: 'That exact guess is already in your history. Try a different combination.',
        feedbackTone: 'error',
      };
      render();
      return;
    }

    if (result.outcome === 'finished') {
      state = {
        ...state,
        game: result.state,
        feedback: 'This round is already over. Start a new game.',
        feedbackTone: 'info',
      };
      render();
      return;
    }

    let records = state.records;
    let recordRank = state.recordRank;
    let feedback = describeAttempt(result.state);
    let feedbackTone: FeedbackTone = 'info';

    if (result.outcome === 'won') {
      const record = toGameRecord(result.state);

      if (record !== null) {
        const added = addRecord(records, record, 10);
        records = added.records;
        recordRank = added.rank;
        saveRecords(records, storage);
        feedback =
          recordRank === null
            ? 'Solved! This result did not reach the top 10.'
            : `Solved! Leaderboard position #${recordRank} on this device.`;
        feedbackTone = 'success';
      }
    }

    state = {
      ...state,
      game: result.state,
      records,
      feedback,
      feedbackTone,
      recordRank,
    };
    render();
  };

  render();

  return () => {
    stopTimer();
    audio.pause();
    root.replaceChildren();
  };
};
