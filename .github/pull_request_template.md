## Task

Bulls and Cows — RS School functional programming / TDD assignment.

## Deployment

<!-- Replace with the published GitHub Pages URL. -->

- Deploy: https://krychvas.github.io/bulls-and-cows/

## What was done

- Functional TypeScript core in `src/core/` (no classes, no DOM).
- Deterministic secret generation with an injected random source.
- Curried digit validator reused for validation and live input filtering.
- Recursive, memoized `countPossibleSecrets`.
- Immutable game state and attempt history.
- Top-10 leaderboard in `localStorage`, with length/base badges.
- Empty `body` in `index.html`; all markup is created with DOM APIs.
- ESLint, Prettier, Vitest, and Husky hooks.

## TDD commit order

<!-- Paste the commit links/hashes in this order. -->

| Function               | Red commit (tests) | Green commit (implementation) |
| ---------------------- | ------------------ | ----------------------------- |
| `generateSecret`       |                    |                               |
| `evaluateGuess`        |                    |                               |
| `isValidGuess`         |                    |                               |
| `createDigitValidator` |                    |                               |
| `countPossibleSecrets` |                    |                               |

## Self-check

- [ ] Length 2–6 and base bin/oct/dec/hex are available before the start and locked after it.
- [ ] With binary selected, all lengths except 2 are disabled.
- [ ] The input rejects characters that are invalid for the selected base.
- [ ] Uppercase hex digits are accepted as lowercase equivalents.
- [ ] Every accepted attempt adds one history row with bulls/cows.
- [ ] Repeating an existing attempt does not add a second history row.
- [ ] A correct secret ends the game and records attempts and time.
- [ ] The result is saved in the leaderboard and survives a page reload.
- [ ] “New game” returns to settings without a page reload.

## Documentation

- [DESIGN.md](./DESIGN.md)
