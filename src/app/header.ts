import { button, el } from './dom.js';
import type { Theme } from './preferences.js';

export interface HeaderProps {
  readonly theme: Theme;
  readonly musicPlaying: boolean;
  readonly volume: number;
  readonly onToggleTheme: () => void;
  readonly onToggleMusic: () => void;
  readonly onVolumeChange: (volume: number) => void;
}

export const createHeader = ({
  theme,
  musicPlaying,
  volume,
  onToggleTheme,
  onToggleMusic,
  onVolumeChange,
}: HeaderProps): HTMLElement => {
  const volumeSlider = el('input', {
    className: 'volume-slider',
    attrs: {
      type: 'range',
      min: '0',
      max: '1',
      step: '0.05',
      value: String(volume),
      'aria-label': 'Background music volume',
      title: 'Background music volume',
    },
  });

  volumeSlider.addEventListener('input', () => {
    onVolumeChange(Number(volumeSlider.value));
  });

  return el('header', { className: 'site-header' }, [
    el('div', { className: 'brand-lockup' }, [
      el('span', {
        className: 'brand-mark',
        attrs: { 'aria-hidden': 'true' },
      }),
      el('div', { className: 'brand-copy' }, [
        el('p', {
          className: 'eyebrow',
          text: 'A CODEBREAKING GAME',
        }),
        el('h1', { className: 'brand-title' }, [
          el('span', { text: 'BULLS' }),
          el('span', { className: 'brand-amp', text: '&' }),
          el('span', { text: 'COWS' }),
        ]),
      ]),
    ]),

    el('div', { className: 'header-actions' }, [
      el('p', {
        className: 'header-note',
        text: 'Deduce the secret. One digit at a time.',
      }),

      el('div', { className: 'header-controls' }, [
        button(theme === 'dark' ? '☀' : '☾', {
          className: 'icon-button theme-toggle',
          attrs: {
            'aria-label': 'Dark theme',
            'aria-pressed': theme === 'dark' ? 'true' : 'false',
            title: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
          },
          onClick: onToggleTheme,
        }),

        el('div', { className: 'music-control' }, [
          button(musicPlaying ? '❚❚' : '▶', {
            className: 'icon-button music-toggle',
            attrs: {
              'aria-label': 'Background music',
              'aria-pressed': musicPlaying ? 'true' : 'false',
              title: musicPlaying ? 'Pause background music' : 'Play background music',
            },
            onClick: onToggleMusic,
          }),
          el('span', {
            className: 'music-symbol',
            text: '♫',
            attrs: { 'aria-hidden': 'true' },
          }),
          volumeSlider,
        ]),
      ]),
    ]),
  ]);
};

export const createFooter = (year: number = new Date().getFullYear()): HTMLElement =>
  el('footer', { className: 'site-footer' }, [
    el('div', { className: 'footer-about' }, [
      el('p', { className: 'eyebrow', text: 'ABOUT THE GAME' }),
      el('p', {
        className: 'footer-copy',
        text: 'Bulls and Cows is a classic number-logic puzzle. A secret code hides a set of unique digits, and every guess reveals bulls — correct digits in the correct place — and cows — correct digits in the wrong place.',
      }),
      el('p', {
        className: 'footer-copy',
        text: 'Deduce the code with as few attempts as possible, then compare your result with the local top ten. There is no attempt limit, but the clock is part of the score.',
      }),
    ]),

    el('div', { className: 'footer-bottom' }, [
      el('p', { className: 'footer-copyright' }, [
        '© ',
        el('time', {
          attrs: { datetime: String(year) },
          text: String(year),
        }),
        ' · Made by Vasyl Krychfalushii',
      ]),

      el(
        'nav',
        {
          className: 'footer-links',
          attrs: { 'aria-label': 'Project links' },
        },
        [
          el('a', {
            className: 'footer-link',
            text: 'Project',
            attrs: {
              href: 'https://github.com/KrychVas/bulls-and-cows',
              target: '_blank',
              rel: 'noreferrer noopener',
            },
          }),
          el('a', {
            className: 'footer-link',
            text: 'RS School',
            attrs: {
              href: 'https://rs.school/',
              target: '_blank',
              rel: 'noreferrer noopener',
            },
          }),
        ],
      ),
    ]),

    el('p', {
      className: 'footer-note',
      text: 'Built with pure functions, TypeScript, and TDD.',
    }),
  ]);
