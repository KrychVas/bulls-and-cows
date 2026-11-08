import { countPossibleSecrets } from '../core/countPossibleSecrets.js';
import {
  ALL_LENGTHS,
  BASE_OPTIONS,
  createSettings,
  getMaxLengthForBase,
  isLengthAvailable,
  type BaseOption,
} from '../core/settings.js';
import type { GameLength, GameSettings } from '../core/types.js';
import type { GameRecord } from '../core/records.js';
import { button, el } from './dom.js';
import { createRecordsPanel } from './recordsView.js';

export interface SetupViewProps {
  readonly settings: GameSettings;
  readonly records: readonly GameRecord[];
  readonly onSettingsChange: (settings: GameSettings) => void;
  readonly onStart: () => void;
}

const createBaseButton = (
  option: BaseOption,
  selected: boolean,
  onSelect: (option: BaseOption) => void,
): HTMLButtonElement => {
  const node = el(
    'button',
    {
      className: selected ? 'base-option is-selected' : 'base-option',
      attrs: {
        type: 'button',
        'aria-pressed': selected ? 'true' : 'false',
        title: option.description,
      },
    },
    [
      el('span', { className: 'base-code', text: option.code }),
      el('span', { className: 'base-label', text: option.label }),
      el('span', { className: 'base-digits', text: option.digits }),
    ],
  );

  node.addEventListener('click', () => {
    onSelect(option);
  });

  return node;
};

const createLengthButton = (
  length: GameLength,
  selected: boolean,
  available: boolean,
  onSelect: (length: GameLength) => void,
): HTMLButtonElement => {
  const node = el(
    'button',
    {
      className: selected ? 'length-option is-selected' : 'length-option',
      attrs: {
        type: 'button',
        'aria-pressed': selected ? 'true' : 'false',
        disabled: !available,
        title: available
          ? `Use ${length} digits`
          : 'This length is unavailable for the selected base',
      },
    },
    [el('span', { text: String(length) })],
  );

  if (available) {
    node.addEventListener('click', () => {
      onSelect(length);
    });
  }

  return node;
};

export const createSetupView = ({
  settings,
  records,
  onSettingsChange,
  onStart,
}: SetupViewProps): HTMLElement => {
  const possibleSecrets = countPossibleSecrets(settings.length, settings.base);

  const handleBaseSelect = (option: BaseOption): void => {
    const nextLength = isLengthAvailable(settings.length, option.base)
      ? settings.length
      : Math.min(settings.length, getMaxLengthForBase(option.base));

    onSettingsChange(createSettings(nextLength, option.base));
  };

  const handleLengthSelect = (length: GameLength): void => {
    onSettingsChange(createSettings(length, settings.base));
  };

  const form = el(
    'form',
    {
      className: 'panel config-panel',
      attrs: {
        'aria-labelledby': 'setup-title',
        novalidate: '',
      },
    },
    [
      el('div', { className: 'panel-heading' }, [
        el('div', {}, [
          el('p', { className: 'eyebrow', text: 'NEW ROUND' }),
          el('h2', {
            id: 'setup-title',
            className: 'panel-title',
            text: 'Choose your code.',
          }),
        ]),
        el('span', { className: 'step-marker', text: '01' }),
      ]),

      el('p', {
        className: 'panel-intro',
        text: 'Pick an alphabet and a code length. The secret is generated locally; nothing leaves this browser.',
      }),

      el('fieldset', { className: 'control-group' }, [
        el('legend', { className: 'control-label', text: 'Number base' }),
        el(
          'div',
          { className: 'base-grid' },
          BASE_OPTIONS.map((option) =>
            createBaseButton(option, option.base === settings.base, handleBaseSelect),
          ),
        ),
      ]),

      el('fieldset', { className: 'control-group' }, [
        el('legend', { className: 'control-label', text: 'Code length' }),
        el(
          'div',
          { className: 'length-row' },
          ALL_LENGTHS.map((length) =>
            createLengthButton(
              length,
              length === settings.length,
              isLengthAvailable(length, settings.base),
              handleLengthSelect,
            ),
          ),
        ),
        el('p', {
          className: 'control-hint',
          text:
            settings.base === 2
              ? 'Binary has only two digits, so only length 2 is available.'
              : 'Digits never repeat, and a leading zero is allowed.',
        }),
      ]),

      el('div', { className: 'round-summary' }, [
        el('div', { className: 'summary-copy' }, [
          el('span', {
            className: 'summary-number',
            text: possibleSecrets.toLocaleString('en-US'),
          }),
          el('span', {
            className: 'summary-label',
            text: 'possible secrets',
          }),
        ]),
        button('Start round', {
          className: 'primary-button',
          attrs: { type: 'submit' },
        }),
      ]),

      el('p', {
        className: 'lock-note',
        text: 'Settings lock as soon as the round begins.',
      }),
    ],
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onStart();
  });

  return el('section', { className: 'setup-screen' }, [
    el('div', { className: 'screen-intro' }, [
      el('p', { className: 'eyebrow', text: 'CRACK THE CODE' }),
      el('h2', {
        className: 'screen-title',
        text: 'A small game of careful deduction.',
      }),
      el('p', {
        className: 'screen-lede',
        text: 'Guess the hidden number. Every attempt tells you how many digits are perfect bulls and how many are wandering cows.',
      }),
    ]),

    el('div', { className: 'setup-layout' }, [form, createRecordsPanel(records)]),

    el(
      'section',
      {
        className: 'how-to',
        attrs: { 'aria-labelledby': 'how-title' },
      },
      [
        el('div', { className: 'how-heading' }, [
          el('p', { className: 'eyebrow', text: 'THE RULES' }),
          el('h2', {
            id: 'how-title',
            className: 'how-title',
            text: 'Three things to remember.',
          }),
        ]),
        el('ol', { className: 'how-list' }, [
          el('li', {}, [
            el('span', { className: 'how-number', text: '01' }),
            el('div', {}, [
              el('h3', { text: 'Bulls are exact' }),
              el('p', {
                text: 'A bull is a correct digit in the correct position.',
              }),
            ]),
          ]),
          el('li', {}, [
            el('span', { className: 'how-number', text: '02' }),
            el('div', {}, [
              el('h3', { text: 'Cows are close' }),
              el('p', {
                text: 'A cow is a correct digit in the wrong position.',
              }),
            ]),
          ]),
          el('li', {}, [
            el('span', { className: 'how-number', text: '03' }),
            el('div', {}, [
              el('h3', { text: 'Beat your best' }),
              el('p', {
                text: 'Fewer tries wins; an equal score is settled by time.',
              }),
            ]),
          ]),
        ]),
      ],
    ),
  ]);
};
