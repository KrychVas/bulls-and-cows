import type { GameState } from '../core/game.js';
import { getElapsedMs } from '../core/game.js';
import { formatDuration, formatSettings } from '../core/format.js';
import { filterAllowedDigits } from '../core/createDigitValidator.js';
import { getAlphabet } from '../core/digits.js';
import type { GameRecord } from '../core/records.js';
import { button, el } from './dom.js';
import { createRecordsPanel } from './recordsView.js';

export type FeedbackTone = 'info' | 'error' | 'success';

export interface GameViewProps {
  readonly game: GameState;
  readonly records: readonly GameRecord[];
  readonly feedback: string | null;
  readonly feedbackTone: FeedbackTone;
  readonly recordRank: number | null;
  readonly onSubmit: (guess: string) => void;
  readonly onNewGame: () => void;
}

export interface GameViewHandle {
  readonly element: HTMLElement;
  readonly updateTimer: (now: number) => void;
  readonly focusGuess: () => void;
}

const pluralize = (count: number, singular: string): string =>
  count === 1 ? singular : `${singular}s`;

const createHintPill = (count: number, kind: 'bull' | 'cow'): HTMLElement => {
  const pluralKind = pluralize(count, kind);

  return el(
    'span',
    {
      className: `hint-pill ${kind}s${count === 0 ? ' is-zero' : ''}`,
      attrs: {
        'aria-label': `${count} ${pluralKind}`,
      },
    },
    [
      el('span', {
        className: 'hint-mark',
        text: kind === 'bull' ? 'B' : 'C',
        attrs: { 'aria-hidden': 'true' },
      }),
      el('span', { className: 'hint-value', text: String(count) }),
      el('span', { className: 'hint-name', text: pluralKind }),
    ],
  );
};

const createSecretDisplay = (game: GameState): HTMLElement => {
  const isRevealed = game.status === 'won';
  const label = isRevealed ? `Secret: ${game.secret}` : 'Secret is hidden';

  return el(
    'div',
    {
      className: isRevealed ? 'secret-display is-revealed' : 'secret-display',
      attrs: { 'aria-label': label },
    },
    Array.from({ length: game.settings.length }, (_, index) =>
      el('span', {
        className: 'secret-slot',
        text: isRevealed ? (game.secret[index] ?? '?') : '?',
        attrs: { 'aria-hidden': 'true' },
      }),
    ),
  );
};

const createStat = (label: string, value: string | HTMLElement, className = ''): HTMLElement =>
  el('div', { className: `stat ${className}`.trim() }, [
    el('span', { className: 'stat-label', text: label }),
    typeof value === 'string' ? el('span', { className: 'stat-value', text: value }) : value,
  ]);

const createGuessForm = (
  game: GameState,
  onSubmit: (guess: string) => void,
): { readonly form: HTMLFormElement; readonly input: HTMLInputElement } => {
  const input = el('input', {
    className: 'guess-input',
    attrs: {
      id: 'guess-input',
      name: 'guess',
      type: 'text',
      inputmode: 'text',
      maxlength: game.settings.length,
      placeholder: getAlphabet(game.settings.base).slice(0, game.settings.length),
      autocomplete: 'off',
      autocapitalize: 'characters',
      spellcheck: 'false',
      'aria-describedby': 'guess-help',
    },
  });
  const form = el(
    'form',
    {
      className: 'guess-form',
      attrs: {
        novalidate: '',
        'aria-label': 'Submit a guess',
      },
    },
    [
      el('label', {
        className: 'visually-hidden',
        text: 'Your guess',
        attrs: { for: 'guess-input' },
      }),
      input,
      button('Try it', {
        className: 'primary-button guess-submit',
        attrs: { type: 'submit' },
      }),
    ],
  );

  input.addEventListener('input', () => {
    const filtered = filterAllowedDigits(input.value, game.settings.length, game.settings.base);

    if (input.value !== filtered) {
      input.value = filtered;
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit(input.value);
  });

  return { form, input };
};

const createAttemptRow = (game: GameState, attemptIndex: number): HTMLElement => {
  const attempt = game.history[attemptIndex];

  if (attempt === undefined) {
    return el('li');
  }

  const isWinningAttempt = game.status === 'won' && attemptIndex === game.history.length - 1;

  return el(
    'li',
    {
      className: isWinningAttempt ? 'history-row is-winning' : 'history-row',
    },
    [
      el('span', {
        className: 'attempt-number',
        text: `#${String(attempt.number).padStart(2, '0')}`,
      }),
      el('div', { className: 'attempt-main' }, [
        el('code', { className: 'attempt-guess', text: attempt.guess }),
        el('span', {
          className: 'attempt-time',
          text: formatDuration(attempt.elapsedMs),
        }),
      ]),
      el('div', { className: 'attempt-hints' }, [
        createHintPill(attempt.bulls, 'bull'),
        createHintPill(attempt.cows, 'cow'),
      ]),
    ],
  );
};

export const createGameView = ({
  game,
  records,
  feedback,
  feedbackTone,
  recordRank,
  onSubmit,
  onNewGame,
}: GameViewProps): GameViewHandle => {
  const timer = el('span', {
    className: 'stat-value timer-value',
    text: formatDuration(getElapsedMs(game, Date.now())),
  });
  const guessForm = game.status === 'playing' ? createGuessForm(game, onSubmit) : null;

  const statusLabel = game.status === 'won' ? 'ROUND COMPLETE' : 'IN PROGRESS';
  const title = game.status === 'won' ? 'You cracked it.' : 'Break the code.';

  const topbar = el('div', { className: 'game-topbar' }, [
    el('div', { className: 'game-round-meta' }, [
      el('span', { className: 'round-badge' }, [
        el('span', { className: 'round-base', text: formatSettings(game.settings) }),
      ]),
      el('span', { className: 'round-status', text: statusLabel }),
    ]),
    button('New game', {
      className: 'ghost-button',
      onClick: onNewGame,
    }),
  ]);

  const playPanel = el(
    'section',
    {
      className: 'panel play-panel',
      attrs: { 'aria-labelledby': 'play-title' },
    },
    [
      el('div', { className: 'panel-heading' }, [
        el('div', {}, [
          el('p', { className: 'eyebrow', text: statusLabel }),
          el('h2', {
            id: 'play-title',
            className: 'panel-title',
            text: title,
          }),
        ]),
        el('span', { className: 'step-marker', text: '02' }),
      ]),

      el('div', { className: 'secret-row' }, [
        createSecretDisplay(game),
        el('p', {
          className: 'secret-caption',
          text:
            game.status === 'won'
              ? 'The hidden sequence, revealed.'
              : game.settings.base === 16
                ? 'Hex letters work in either case.'
                : 'Digits never repeat; leading zeroes are allowed.',
        }),
      ]),

      el('div', { className: 'stat-grid' }, [
        createStat('Attempts', String(game.history.length), 'attempt-stat'),
        createStat('Time', timer, 'timer-stat'),
        createStat('Base', formatSettings(game.settings), 'base-stat'),
      ]),

      el('div', { className: 'guess-area' }, [
        game.status === 'playing' && guessForm !== null
          ? guessForm.form
          : createWinSummary(game, recordRank, onNewGame),
        el('p', {
          className: `feedback feedback-${feedbackTone}`,
          attrs: { role: 'status', 'aria-live': 'polite' },
          text: feedback ?? 'A bull is exact; a cow is the right digit in the wrong place.',
        }),
        game.status === 'playing'
          ? el('p', {
              id: 'guess-help',
              className: 'guess-help',
              text: `Type ${game.settings.length} unique digits. Leading zeroes are allowed.`,
            })
          : null,
      ]),
    ],
  );

  const historyPanel = el(
    'section',
    {
      className: 'panel history-panel',
      attrs: { 'aria-labelledby': 'history-title' },
    },
    [
      el('div', { className: 'panel-heading' }, [
        el('div', {}, [
          el('p', { className: 'eyebrow', text: 'THE PAPER TRAIL' }),
          el('h2', {
            id: 'history-title',
            className: 'panel-title',
            text: 'Attempts',
          }),
        ]),
        el('span', {
          className: 'history-count',
          text: `${game.history.length} total`,
        }),
      ]),

      game.history.length === 0
        ? el('div', { className: 'empty-state compact' }, [
            el('span', {
              className: 'empty-mark',
              attrs: { 'aria-hidden': 'true' },
            }),
            el('p', {
              className: 'empty-title',
              text: 'No guesses yet',
            }),
            el('p', {
              className: 'empty-copy',
              text: 'Your first guess will appear here with its bulls and cows.',
            }),
          ])
        : el(
            'ol',
            {
              className: 'history-list',
              attrs: { reversed: '' },
            },
            game.history.map((_, index) => createAttemptRow(game, index)).reverse(),
          ),
    ],
  );

  const element = el('section', { className: 'game-screen' }, [
    topbar,
    el('div', { className: 'game-layout' }, [playPanel, historyPanel]),
    createRecordsPanel(records, recordRank),
  ]);

  return {
    element,
    updateTimer: (now: number): void => {
      timer.textContent = formatDuration(getElapsedMs(game, now));
    },
    focusGuess: (): void => {
      guessForm?.input.focus({ preventScroll: true });
    },
  };
};

const createWinSummary = (
  game: GameState,
  recordRank: number | null,
  onNewGame: () => void,
): HTMLElement => {
  const rankMessage =
    recordRank === null
      ? 'This round did not reach the top 10.'
      : `Leaderboard position #${recordRank} on this device.`;

  return el('div', { className: 'win-summary' }, [
    el('p', { className: 'win-kicker', text: 'SECRET UNLOCKED' }),
    el('p', {
      className: 'win-copy',
      text: `Solved in ${game.history.length} ${pluralize(game.history.length, 'attempt')} and ${formatDuration(getElapsedMs(game, game.finishedAt ?? Date.now()))}.`,
    }),
    el('p', { className: 'win-rank', text: rankMessage }),
    button('Play another round', {
      className: 'primary-button',
      onClick: onNewGame,
    }),
  ]);
};
