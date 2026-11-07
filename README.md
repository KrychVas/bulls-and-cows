# Bulls & Cows

A codebreaking game built as a study in functional TypeScript. The computer picks a secret sequence of unique digits, and every guess returns two numbers:

- **bulls** — correct digits in the correct position;
- **cows** — correct digits in the wrong position.

The game has no attempt limit. Fewer attempts win; an equal number of attempts is settled by the round timer. The best ten results are stored in `localStorage` and survive a page reload.

## Live demo

After GitHub Pages is enabled for the repository:

<https://krychvas.github.io/bulls-and-cows/>

## Features

- Bases `bin`, `oct`, `dec`, and `hex`; lengths from 2 to 6.
- Binary rounds expose only length 2 because there are only two binary digits.
- Live input filtering via the same curried digit validator used by the core validation.
- Hexadecimal input is case-insensitive.
- Immutable attempt history with bulls and cows for every accepted guess.
- Duplicate guesses are rejected without adding a second history row.
- Timer starts when the round starts and stops on a win.
- General top-10 leaderboard with a visible length/base badge for every record.
- “New game” returns to settings without a page reload.
- No DOM access in the game core; no `innerHTML` or `insertAdjacentHTML` in the UI.

## Stack

- TypeScript (strict, ES modules, compiled by `tsc`)
- Vitest
- ESLint + Prettier
- Husky + lint-staged
- Plain HTML, CSS, and DOM APIs — no UI framework

## Scripts

```bash
npm install       # install dependencies and Husky hooks
npm test          # run the Vitest suite once
npm run test:watch
npm run test:coverage
npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run build     # compile src/ to dist/ as ES modules
```

Node 20 or newer is required.

## Run locally

```bash
npm install
npm run build
npx serve .
```

Open the printed local URL. `index.html` loads `dist/main.js` as a module, so the project must be served over HTTP; opening the file directly will not work because of browser module restrictions.

## Project structure

```text
.
├── src
│   ├── core          # pure game logic, no DOM
│   │   ├── createDigitValidator.ts
│   │   ├── countPossibleSecrets.ts
│   │   ├── evaluateGuess.ts
│   │   ├── game.ts
│   │   ├── generateSecret.ts
│   │   ├── isValidGuess.ts
│   │   ├── memoize.ts
│   │   ├── records.ts
│   │   └── settings.ts
│   ├── app           # DOM rendering and browser adapters
│   └── main.ts
├── tests             # Vitest unit tests, one focused file per core module
├── DESIGN.md         # data structures, algorithms, Big O, clean-code notes
├── index.html
└── styles.css
```

## TDD workflow

Each core function has a focused test file under `tests/`. The workflow is red → green:

1. add a failing test commit for one function;
2. add the smallest implementation that makes it green;
3. repeat for the next function;
4. commit UI, tooling, and documentation separately.

The Husky hooks enforce the practical side of that workflow:

- `pre-commit` runs `lint-staged` only. It deliberately does **not** run tests, so a red-test commit can be created.
- `pre-push` runs `npm test` and blocks a push while any test is failing.

## Deployment

The workflow in `.github/workflows/deploy.yml` builds and publishes the site to GitHub Pages when `main` or `bulls-and-cows` is pushed. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Documentation

See [DESIGN.md](./DESIGN.md) for the data structures, algorithms, Big O analysis, and the clean-code decisions behind the implementation.
