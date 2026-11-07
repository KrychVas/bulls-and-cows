import { formatBase, formatDuration } from '../core/format.js';
import type { GameRecord } from '../core/records.js';
import { el } from './dom.js';

const formatRecordDate = (timestamp: number): string =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(timestamp));

const createRoundBadge = (record: GameRecord): HTMLElement =>
  el('span', { className: 'round-badge' }, [
    el('span', { className: 'round-base', text: formatBase(record.base) }),
    el('span', { className: 'round-separator', text: '·' }),
    el('span', { text: `${record.length} digits` }),
  ]);

export const createRecordsPanel = (
  records: readonly GameRecord[],
  highlightRank: number | null = null,
): HTMLElement => {
  const panel = el('section', {
    className: 'panel records-panel',
    attrs: { 'aria-labelledby': 'records-title' },
  });

  const heading = el('div', { className: 'panel-heading' }, [
    el('div', {}, [
      el('p', { className: 'eyebrow', text: 'LOCAL LEADERBOARD' }),
      el('h2', {
        id: 'records-title',
        className: 'panel-title',
        text: 'Hall of fame',
      }),
    ]),
    el('p', {
      className: 'panel-caption',
      text: 'Top 10 · fewest tries, then fastest time',
    }),
  ]);

  panel.append(heading);

  if (records.length === 0) {
    panel.append(
      el('div', { className: 'empty-state' }, [
        el('span', {
          className: 'empty-mark',
          attrs: { 'aria-hidden': 'true' },
        }),
        el('p', {
          className: 'empty-title',
          text: 'No records yet',
        }),
        el('p', {
          className: 'empty-copy',
          text: 'Win a round and your best result will be saved here.',
        }),
      ]),
    );

    return panel;
  }

  const body = el('div', { className: 'table-scroll' });
  const table = el('table', { className: 'records-table' }, [
    el('caption', {
      className: 'visually-hidden',
      text: 'Top ten Bulls and Cows results, ordered by attempts and time.',
    }),
    el('thead', {}, [
      el('tr', {}, [
        el('th', { attrs: { scope: 'col' }, text: '#' }),
        el('th', { attrs: { scope: 'col' }, text: 'Round' }),
        el('th', { attrs: { scope: 'col' }, text: 'Tries' }),
        el('th', { attrs: { scope: 'col' }, text: 'Time' }),
        el('th', { attrs: { scope: 'col' }, text: 'Set' }),
      ]),
    ]),
    el(
      'tbody',
      {},
      records.map((record, index) => {
        const rank = index + 1;
        const isHighlighted = rank === highlightRank;

        return el(
          'tr',
          {
            className: isHighlighted ? 'record-row is-highlighted' : 'record-row',
            attrs: isHighlighted ? { 'aria-label': `Your new result, rank ${rank}` } : undefined,
          },
          [
            el('td', {}, [el('span', { className: 'rank', text: String(rank) })]),
            el('td', {}, [createRoundBadge(record)]),
            el('td', {
              className: 'numeric-cell',
              text: String(record.attempts),
            }),
            el('td', {
              className: 'numeric-cell time-cell',
              text: formatDuration(record.timeMs),
            }),
            el('td', {
              className: 'date-cell',
              text: formatRecordDate(record.achievedAt),
            }),
          ],
        );
      }),
    ),
  ]);

  body.append(table);
  panel.append(body);
  return panel;
};
