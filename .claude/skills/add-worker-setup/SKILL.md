---
name: add-worker-setup
description: Add one-time setup that runs before tests, as a replacement for `beforeAll` (which cannot use `page` or `app` in this project). Invoke when the user says things like "I need to set this up once before all tests", "run this in beforeAll", "warm up X for the whole suite", "seed the database before tests run", or similar.
---

# Add Worker / Suite Setup

The Fixtures pattern in this repo makes `page`, `context`, `request`, and `app` **test-scoped**. They are NOT available inside `test.beforeAll` / `test.afterAll`. This skill picks the right replacement.

## Decision tree

1. **Does the setup need to run only once for the entire test suite (across all workers)?**
   - YES → use **`globalSetup`** in `playwright.config.ts`. Do NOT use a fixture.
   - Example: seed a database, pre-create test users, generate `storageState` files (via a setup project — see Pattern A below).

2. **Does it need to run once per worker?**
   - YES → add a worker-scope auto fixture in `fixtures/worker-fixtures.ts`. See Pattern B.

3. **Is the user really asking for per-test setup but said "beforeAll" by accident?**
   - YES → use `test.beforeEach`. See Pattern C.

4. **Does it need to run once per file/describe block AND require a real Page?**
   - Use the `workerApp` fixture inside `test.beforeAll`. See Pattern D. (This is the rare one.)

## Patterns

### Pattern A — `globalSetup` (suite-once, no Page needed)

```ts
// scripts/global-setup.ts
import type { FullConfig } from '@playwright/test';
export default async function globalSetup(_config: FullConfig) {
  // seed DB, warm caches, etc.
}
```

```ts
// playwright.config.ts
export default defineConfig({
  globalSetup: './scripts/global-setup.ts',
  /* ... */
});
```

### Pattern A' — Setup project (suite-once, Page needed for storageState)

The repo already uses this for auth: see `examples/tests/auth.setup.ts` and the `setup` project entry in `playwright.config.ts`. Add a new role:

```ts
// examples/tests/auth.setup.ts
setup('authenticate as <new-role>', async ({ app, page }) => {
  await app.login().goto();
  await app.login().signIn(/* ... */);
  await page.context().storageState({ path: storageStatePath('<new-role>') });
});
```

### Pattern B — Worker-scope auto fixture (worker-once)

Edit `fixtures/worker-fixtures.ts`:

```ts
export const workerTest = base.extend<object, WorkerFixtures & { warmCache: void }>({
  // ...existing fixtures...
  warmCache: [
    async ({}, use) => {
      // runs once when this worker starts
      await use();
      // runs once when this worker shuts down
    },
    { scope: 'worker', auto: true },
  ],
});
```

### Pattern C — `beforeEach` (per-test, the user actually wanted this)

```ts
test.beforeEach(async ({ app }) => {
  await app.products().goto();
});
```

### Pattern D — `workerApp` inside `beforeAll` (rare, file-scoped Page-using setup)

```ts
test.describe('Heavy suite', () => {
  test.beforeAll(async ({ workerApp }) => {
    // workerApp is the worker-scope facade; it has its own Page that lives
    // for the lifetime of the worker, distinct from the per-test `app`.
    await workerApp.products().goto();
    // ... preheat something
  });

  test('does the work', async ({ app }) => {
    /* per-test `app` is independent of workerApp */
  });
});
```

## What you must NOT do

- ❌ `test.beforeAll(async ({ page }) => ...)` — `page` is test-scoped, will throw.
- ❌ `test.beforeAll(async ({ app }) => ...)` — `app` wraps `page`, same problem.
- ❌ `test.beforeAll(async ({ context, request }) => ...)` — same.

ESLint blocks all four cases. Do not silence the rule — pick the right pattern.
