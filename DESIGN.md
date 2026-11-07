# Design notes

This project deliberately treats the game core as a small functional library. There are no classes, no DOM references, and no framework state in `src/core`. Browser code lives in `src/app` and consumes the core through plain functions.

## 1. Data structures

### Secret number: `string`

The secret is a string of digits, for example `"0123"` or `"a1f0"`. A string was chosen over `number` because:

- leading zeroes are valid (`"0123"` must not become `123`);
- hexadecimal digits are naturally represented as characters;
- indexing and iteration are O(1)/O(n) with no conversion overhead;
- `evaluateGuess` can accept either a string or a readonly array through `DigitSequence`.

All characters are normalized to lowercase at the boundary (`toDigits` in `src/core/digits.ts`). The game only generates lowercase secrets, but uppercase hex input is accepted.

### Settings: `GameSettings`

```ts
interface GameSettings {
  readonly length: GameLength; // 2 | 3 | 4 | 5 | 6
  readonly base: Base; // 2 | 8 | 10 | 16
}
```

`Base` and `GameLength` are narrow unions. `isValidSettings`, `isGameLength`, and `isSupportedBase` are type guards, so invalid combinations are rejected at the boundary instead of leaking into game code. Binary length 3 is invalid at the type-and-runtime boundary, and the setup UI also disables it.

### Attempt history: readonly array

```ts
interface Attempt {
  readonly number: number;
  readonly guess: string;
  readonly bulls: number;
  readonly cows: number;
  readonly elapsedMs: number;
}
```

History is `readonly Attempt[]`. A new attempt is appended with a new array:

```ts
history: [...state.history, attempt];
```

The previous state and every previous entry keep their identity. This makes the history append-only and makes React-style state comparisons trivial. The cost of copying an array of `m` attempts is O(m), so building a full history of `m` attempts is O(m²) in the worst case. For this game `m` is small and human-scale; a persistent linked list would add complexity without a practical benefit.

`GameState` itself is a readonly object. `submitGuess` returns a new state rather than mutating the old one. The UI replaces its reference only after a valid state transition.

### Leaderboard: bounded array of records

```ts
interface GameRecord {
  readonly length: GameLength;
  readonly base: Base;
  readonly attempts: number;
  readonly timeMs: number;
  readonly achievedAt: number;
}
```

The project uses the **single general leaderboard** option. Every record carries its length/base badge, which is rendered in `src/app/recordsView.ts`. This is simpler than maintaining a separate table for each of the 4 bases × 5 lengths and still satisfies the requirement.

Records are sorted by:

1. attempts ascending;
2. time ascending;
3. achievement timestamp ascending (older wins a complete tie).

The list is capped at `RECORD_LIMIT = 10`. `addRecord` returns both the new capped list and the record's rank, or `null` when the result did not make the table.

Persistence is a browser concern, not a core concern. `src/app/storage.ts` reads/writes JSON under `bulls-and-cows:records:v1`. `parseRecords` validates every field at runtime, filters malformed entries, sorts, and caps the result. Corrupted storage therefore degrades to an empty table instead of crashing the app.

### Memo cache: `Map`

`countPossibleSecrets` is wrapped by `memoize`, which closes over a `Map<string, Result>`. Keys are built from argument types and values, so `null`, `undefined`, and the string `"null"` do not collide. The cache is private; callers cannot mutate it.

## 2. Algorithms

### `generateSecret(length, base, random)`

`generateSecret` builds the alphabet for the selected base, then recursively picks one digit at a time from a shrinking pool:

1. call the injected `random` source;
2. map it to an index in the current pool;
3. remove the chosen digit from the pool;
4. append it to the prefix and repeat until `length` digits have been chosen.

Removing the chosen digit guarantees uniqueness. The default is `Math.random`, but tests pass a deterministic function. Passing randomness as a parameter is what makes the function testable: no global state is read inside the selection loop.

The random source is validated to return a finite value in `[0, 1)`. Invalid input throws `RangeError` instead of silently producing a biased secret.

### `evaluateGuess(secret, guess)`

The core comparison is intentionally built from array methods:

1. normalize both inputs to arrays of lowercase characters;
2. `filter` by position to count bulls;
3. build a frequency `Map` for the secret and one for the guess;
4. reduce the guess frequencies, summing `min(guessCount, secretCount)` to get common digits;
5. `cows = commonDigits - bulls`.

Using multisets rather than a plain set intersection means the function stays correct even if it is called with repeated characters, which is useful for defensive tests even though valid gameplay forbids repeated digits.

### `isValidGuess(guess, length, base)`

The function checks, in order:

1. settings are supported and `1 <= length <= base`;
2. the number of characters equals `length`;
3. every character passes the validator created by `createDigitValidator(base)`;
4. `new Set(normalizedDigits).size === digits.length`.

The order matters for useful error messages. `getGuessValidationError` returns `'settings' | 'length' | 'digits' | 'repeated' | null`; the UI turns that into a specific human-readable message.

### `createDigitValidator(base)`

This is a curried factory:

```ts
const isDecimalDigit = createDigitValidator(10);
isDecimalDigit('7'); // true
```

Fixing the base once produces a reusable predicate. The predicate lowercases its argument, so `A` and `a` are accepted for hexadecimal. The factory is used in two concrete places:

- inside `isValidGuess` for final validation;
- as the predicate in `filterAllowedDigits`, which runs on every `input` event.

### `countPossibleSecrets(length, base)`

For a length-`l` secret from a base with `b` digits, the count is the number of ordered selections without repetition:

```text
P(b, l) = b! / (b - l)!
```

The implementation uses the recurrence:

```text
P(b, 0) = 1
P(b, l) = b * P(b - 1, l - 1)   when 1 <= l <= b
P(b, l) = 0                     when l > b
```

It is recursive, and the exported function is wrapped in `memoize`. The recursive calls go through the memoized function, so subproblems such as `countPossibleSecrets(3, 9)` are reused during a session. Invalid negative or fractional dimensions return `0`; a length of zero returns `1`.

### Game state transitions

`startGame` creates a playing state. `submitGuess` is a pure transition function with four outcomes:

- `invalid` — validation failed, state is returned unchanged;
- `duplicate` — the exact normalized guess is already in history, state is returned unchanged;
- `accepted` — a new attempt is appended;
- `won` — a new attempt is appended, `status` becomes `"won"`, and `finishedAt` is set;
- `finished` — the round was already over.

Duplicate detection normalizes both sides to lowercase, so `FE` and `fe` are one attempt in a hexadecimal round. Re-rendering after a duplicate does not add a second row.

`getElapsedMs` uses `startedAt` and either `finishedAt` or the supplied current time. Time is passed in as a number at the boundary, keeping the core deterministic in tests.

## 3. Big O

Let `n` be the secret length (at most 6), `b` the base alphabet size (at most 16), and `m` the number of attempts.

| Function                            | Time                                            | Space    | Reasoning                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateSecret(n, b)`              | O(n · b)                                        | O(b + n) | Each of the `n` picks filters the current pool, and the pool starts at `b` characters. The pool shrinks each step, so the exact work is `b + (b−1) + … + (b−n+1)`, bounded by `n · b`. Recursion depth is `n`. Since `b <= 16`, this is O(n) for this game.                        |
| `evaluateGuess(secret, guess)`      | O(n)                                            | O(n)     | `filter` is one pass. Each frequency map is built by one `reduce`, and the final reduce visits at most `n` distinct guess digits. Map operations are average O(1).                                                                                                                 |
| `isValidGuess(guess, length, base)` | O(n · b)                                        | O(n)     | The character check runs `n` times and each alphabet `includes` scans up to `b` characters. Set construction is O(n). With `b <= 16`, this is O(n).                                                                                                                                |
| `countPossibleSecrets(n, b)`        | O(n) first call, O(1) on an exact repeated pair | O(n)     | The recurrence makes one recursive call per length unit, so first evaluation is O(n); each distinct `(length, base)` pair is stored once, and a repeated top-level call is an average O(1) `Map` lookup. The cache size is O(n) for the chain of subproblems touched by this call. |
| `addRecord(records, record)`        | O(k log k)                                      | O(k)     | Copies and sorts at most `k = 10` existing records, then slices.                                                                                                                                                                                                                   |
| history append in `submitGuess`     | O(m)                                            | O(m)     | A new array is allocated for `m + 1` attempts; old entries are shared by reference.                                                                                                                                                                                                |

The constants matter more than the asymptotics here: every core loop is bounded by 16 digits and 6 positions. The important engineering property is that no hidden repeated work happens in the UI, and `countPossibleSecrets` is not recalculated from scratch every time the settings panel opens.

## 4. Functional programming

- **Pure functions.** `src/core/*` has no DOM, storage, clock, or randomness access except through explicit parameters. `generateSecret` takes `random`; `startGame` takes `random` and `startedAt`; `submitGuess` takes `at`.
- **Immutability.** Settings are frozen; state updates use object spread; history uses `[...history, entry]`; records are copied before sorting. No `push`, `splice`, or field assignment mutates an existing public structure.
- **Higher-order functions.** `evaluateGuess` uses `filter`, `reduce`, `map`, and spread; validation uses `every`; base/length availability uses `filter` and `some`; memoization accepts a function and returns a function.
- **Currying.** `createDigitValidator(base)` returns `(char) => boolean`; the result is reused in two consumers.
- **Recursion.** `generateSecret` recursively chooses unique digits; `countPossibleSecrets` follows the permutation recurrence.
- **Memoization.** `memoize` is a generic HOF; `countPossibleSecrets` is its production use, and its tests also cover `memoize` directly.
- **Function composition at the seams.** UI builders compose small DOM helpers; the controller composes core transitions with storage and view functions. No game rule lives in the UI.

## 5. Clean code decisions

### Small, intention-revealing functions

- `src/core/digits.ts`: `normalizeDigit`, `toDigits`, `getAlphabet`, `isSupportedBase` — each answers one question.
- `src/core/evaluateGuess.ts`: `countDigits` is a named helper for the multiset step instead of an inline nested loop.
- `src/core/game.ts`: `submitGuess`, `getElapsedMs`, and `createIdleGame` have one responsibility each.
- `src/app/recordsView.ts`: `createRoundBadge` and `formatRecordDate` keep the table builder readable.

### Explicit boundaries and validation

- `generateSecret` throws for impossible lengths and bad random values.
- `createSettings` throws for impossible length/base pairs.
- `parseRecords` never throws on corrupted JSON; it returns an empty list.
- `loadRecords`/`saveRecords` treat unavailable or quota-blocked storage as a normal condition and return `false`/`[]`.
- `getGuessValidationError` returns a discriminated reason instead of a boolean plus a stringly-typed message.

### No duplicated rules

- The available-length rule is in `isLengthAvailable`, used by the settings type guard, the UI buttons, and `createSettings`.
- The hex case-insensitivity rule is centralized in `normalizeDigit`/`toDigits` and the validator.
- The digit alphabet lives only in `digits.ts`.
- The leaderboard comparator is a single pure function used by `sortRecords`, `parseRecords`, and `addRecord`.

### UI separated from game rules

`src/app/controller.ts` owns the mutable UI state object, timers, and storage side effects. It calls pure core functions and renders the returned state. `src/app/*View.ts` only builds DOM; it does not decide whether a guess is valid, whether the game is won, or what a record ranks.

### No unsafe HTML

`src/app/dom.ts` is the only element factory. It uses `document.createElement`, `textContent`, and `append`. Dynamic content never passes through `innerHTML` or `insertAdjacentHTML`. That removes an entire class of injection issues and forces content to be represented as text nodes.

### Accessibility and feedback

- Form controls are labelled; fieldsets have legends.
- Disabled lengths use the native `disabled` attribute, not just a CSS class.
- The feedback line is a polite live region.
- The timer has a stable text node, so screen readers are not spammed with a rebuilt page every 250 ms.
- The winning row and the new leaderboard row are visually highlighted.

## 6. Testing strategy

Tests live in `tests/` and are unit-level. They are fast, independent, repeatable, self-validating, and written before the corresponding implementation.

Coverage by module:

- `tests/generateSecret.test.ts` — deterministic random sources, uniqueness, leading zero, all bases, invalid inputs, exact random-call count.
- `tests/evaluateGuess.test.ts` — bulls, cows, mixed results, leading zeroes, hex case, array inputs, duplicate counts, no mutation.
- `tests/isValidGuess.test.ts` — length, alphabet, repeats, hex case, impossible base/length combinations, error reasons.
- `tests/createDigitValidator.test.ts` — curried predicate behavior and live input filtering.
- `tests/countPossibleSecrets.test.ts` — permutations, edge cases, and memoized repeatability.
- `tests/memoize.test.ts` — caching, key distinctions, undefined results, independent caches.
- `tests/game.test.ts` — state transitions, immutable history, duplicate handling, win/time behavior.
- `tests/records.test.ts` — ranking, top-10 cap, rank reporting, parsing malformed storage.
- `tests/format.test.ts` — duration/base formatting edge cases.
- `tests/storage.test.ts` — persistence adapter with storage errors and corrupted data.

The suite uses no browser environment. Core tests exercise plain strings, numbers, arrays, and fake random/storage objects. That is only possible because the core is free of DOM dependencies.

## 7. Deliberate trade-offs

- **String secret instead of digits array:** simpler to display and serialize, and preserves leading zeroes. `evaluateGuess` converts to arrays internally for HOF-based comparison.
- **Single leaderboard instead of per-setting tables:** one list, one storage key, and an explicit badge on each row. Simpler to reason about and satisfies the requirement.
- **Full re-render on state changes:** the app is small; rebuilding the screen keeps the controller simple. The timer is the exception: it updates one text node so the page is not rebuilt four times per second.
- **`filter`-based pool removal in `generateSecret`:** O(n · b) worst case, but `b <= 16`. It keeps the recursion readable. An in-place Fisher–Yates shuffle would be faster asymptotically but would mutate a local working array and obscure the “pick unique digit” intent.
- **Memoization does not change the first-call Big O:** it removes repeated work across calls. The settings screen and any future validation screen can call `countPossibleSecrets` freely.
