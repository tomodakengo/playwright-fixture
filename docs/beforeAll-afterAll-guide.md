# `beforeAll` / `afterAll` Guide

> The single most common pitfall when using Playwright's Fixtures Pattern.

## The problem

Playwright's built-in `page`, `context`, and `request` fixtures — and our project's `app` fixture — are **test-scoped**. They are created fresh for each test and destroyed when the test ends.

`test.beforeAll` and `test.afterAll`, however, run at **worker scope** — once per worker, not per test. The test-scoped fixtures simply do not exist when those hooks run.

If you try this:

```ts
test.beforeAll(async ({ page }) => {
  await page.goto('/login');     // ❌ throws at runtime
});
```

…Playwright throws:

> `"page" is a test-scoped fixture and cannot be used in beforeAll/afterAll`

The same applies to `context`, `request`, and our `app`.

## What goes where

| When does it run | Use |
|---|---|
| Once per **suite** (across all workers) | `globalSetup` in `playwright.config.ts` |
| Once per **worker** (multiple tests in the same worker share it) | a worker-scope fixture (`{ scope: 'worker' }`), often `auto: true` |
| Once per **worker**, and you need a Page | the `workerApp` / `workerPage` fixtures provided by this repo |
| Once per **test** | `test.beforeEach` / `test.afterEach` |

## Recipes

### "I need to log in before every test in this file"

❌ Wrong:

```ts
test.beforeAll(async ({ app }) => {
  await app.login().goto();
  await app.login().signIn('standard', 'standard123');
});
```

✅ Right (option A — use saved auth state):

```ts
test.use({ storageState: storageStatePath('standard') });

test('first test', async ({ app }) => { /* already logged in */ });
test('second test', async ({ app }) => { /* already logged in */ });
```

✅ Right (option B — beforeEach):

```ts
test.beforeEach(async ({ app }) => {
  await app.login().goto();
  await app.login().signIn('standard', 'standard123');
});
```

### "I need to seed the database once before any tests run"

✅ Right — `globalSetup`:

```ts
// scripts/global-setup.ts
export default async function globalSetup() {
  await seedDatabase();
}
```

```ts
// playwright.config.ts
export default defineConfig({
  globalSetup: './scripts/global-setup.ts',
  /* ... */
});
```

### "I need to warm a cache once per worker"

✅ Right — auto worker fixture (`fixtures/worker-fixtures.ts`):

```ts
warmCache: [
  async ({}, use) => {
    await callExpensiveWarmupEndpoint();
    await use();
  },
  { scope: 'worker', auto: true },
],
```

### "I really need to use a Page in beforeAll"

This is rare, but supported:

✅ Right — use the worker-scope `workerApp`:

```ts
test.describe('Heavy suite', () => {
  test.beforeAll(async ({ workerApp }) => {
    await workerApp.products().goto();
    // do once-per-worker Page-using setup
  });

  test('does the work', async ({ app }) => {
    /* per-test `app` is independent of workerApp */
  });
});
```

`workerApp` is a separate `App` instance bound to a Page that lives for the whole worker. It does NOT share state with the per-test `app`, so anything you do in `beforeAll` (like logging in) does not affect the per-test page state.

## How we prevent the mistake

This repo's ESLint config catches the bad shape before you ever hit runtime:

```
selector: "CallExpression[callee.object.name='test']
          [callee.property.name=/^(beforeAll|afterAll)$/]
           > ArrowFunctionExpression
           > ObjectPattern
           > Property[key.name=/^(page|app|context|request)$/]"
```

If you write `test.beforeAll(async ({ page }) => ...)`, `npm run lint` errors out with a pointer to this document.

## Summary

- Default to `beforeEach`. It's almost always what you want.
- For suite-once setup, use `globalSetup`.
- For worker-once setup needing a Page, use the `workerApp` fixture (NOT the per-test `app`).
- Never try to use `page`, `app`, `context`, or `request` in `beforeAll`/`afterAll`. ESLint blocks it; runtime would throw anyway.
