import { chmodSync } from 'node:fs';

const hooks = ['.husky/pre-commit', '.husky/pre-push'];

for (const hook of hooks) {
  try {
    chmodSync(hook, 0o755);
  } catch {
    // A source checkout without Git metadata is still installable.
  }
}
