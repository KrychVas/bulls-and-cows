import { el } from './dom.js';

export const createHeader = (): HTMLElement =>
  el('header', { className: 'site-header' }, [
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
    el('p', {
      className: 'header-note',
      text: 'Deduce the secret. One digit at a time.',
    }),
  ]);

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

    el(
      'nav',
      {
        className: 'footer-links',
        attrs: { 'aria-label': 'Project links' },
      },
      [
        el('a', {
          className: 'footer-link',
          text: 'GitHub · KrychVas',
          attrs: {
            href: 'https://github.com/KrychVas',
            target: '_blank',
            rel: 'noreferrer noopener',
          },
        }),
        el('a', {
          className: 'footer-link',
          text: 'Source code',
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

    el('div', { className: 'footer-bottom' }, [
      el('p', { className: 'footer-copyright' }, [
        '© ',
        el('time', {
          attrs: { datetime: String(year) },
          text: String(year),
        }),
        ' Vasyl Krychfalushii',
      ]),
      el('p', {
        className: 'footer-note',
        text: 'Built with pure functions, TypeScript, and TDD.',
      }),
    ]),
  ]);
