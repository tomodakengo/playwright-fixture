# Fixtures Explained

This document explains the moving parts in `fixtures/` and how they fit together. If you only read one doc in this directory, read this one.

## TL;DR

```
                                            ┌──────────────────────────┐
                                            │  fixtures/fixtures.ts    │
                                            │  (mergeTests)            │
                                            └────────────┬─────────────┘
                                                         │ exports test, expect
                       ┌─────────────────────────────────┴─────────────────────────────────┐
                       │                                                                   │
            ┌──────────▼──────────┐                                          ┌─────────────▼────────────┐
            │  appTest (test     │                                          │ workerTest (worker        │
            │  scope, auto: true) │                                          │ scope, mostly auto)       │
            │                     │                                          │                           │
            │   provides: app     │                                          │ provides: workerContext,  │
            └──────────┬──────────┘                                          │ workerPage, workerApp,    │
                       │                                                     │ setupOnce                 │
                       │                                                     └────────────┬──────────────┘
            ┌──────────▼──────────┐                                                       │
            │  fixtures/app.ts    │                                                       │
            │  class App          │ ← ←  reads  ←  ┌────────────────────────┐ ← ← ← ← ← ←
            │   .login()          │                │   fixtures/store.ts    │
            │   .products()       │                │   page singleton        │
            │   .switchUser(role) │                │   currentPage(), setPage│
            └─────────────────────┘                └────────────────────────┘
                                                              ▲
                                                              │ swap on switchUser
                                                              │
                                                   ┌──────────┴────────────┐
                                                   │  fixtures/auth.ts     │
                                                   │  loginViaApi          │
                                                   │  switchUser           │
                                                   │  storageStatePath     │
                                                   └───────────────────────┘
```

## Files

### `fixtures/store.ts`

A tiny module-level singleton holding the **current Page** and the **current App** for the test that is in progress.

- `setPage(page)` / `setPage(null)` — called by the `app` fixture at the start/end of each test.
- `currentPage()` — used by `App` (and by `switchUser`) to read whichever Page is active *right now*. Throws a clear error if called outside a test.

Why: when `app.switchUser('admin')` is called mid-test, it creates a fresh BrowserContext + Page authenticated as `admin`, and calls `setPage(newPage)`. After that, every `app.<area>()` call returns a PageObject bound to the new page — without you having to thread a new variable through your test.

### `fixtures/app.ts`

The **App facade**. Aggregates every PageObject under one entry point.

- Constructor takes `() => Page` (a getter, not a Page) so calls always pick up the latest page from `store.ts`.
- Each area is a method: `app.login()`, `app.products()`, etc. — these return a *new* PageObject each call (so their internal locators bind to the current page).
- For nested URL hierarchies, use the `Object.assign` pattern:

  ```ts
  myArea = Object.assign(() => new MyAreaPage(this.getPage()), {
    sub: () => new MySubPage(this.getPage()),
  });
  // app.myArea()    → MyAreaPage
  // app.myArea.sub() → MySubPage
  ```

- `app.switchUser(role)` is a thin wrapper around `fixtures/auth.ts`'s `switchUser`.

### `fixtures/worker-fixtures.ts`

Worker-scoped fixtures for the cases where you genuinely need a Page in `test.beforeAll` or once-per-worker setup. **These live separately from the test-scope `app` on purpose** — mixing them would corrupt state across tests.

| Fixture | Scope | Auto? | Use it for |
|---|---|---|---|
| `workerContext` | worker | no | A BrowserContext that lives for the lifetime of one worker |
| `workerPage` | worker | no | A Page on top of `workerContext` |
| `workerApp` | worker | no | An `App` facade bound to `workerPage`. Use this in `test.beforeAll`. |
| `setupOnce` | worker | yes | A hook for "run this once when the worker starts." Edit the body in `worker-fixtures.ts`. |

### `fixtures/fixtures.ts`

Glues it all together with `mergeTests`:

```ts
const appTest = base.extend<TestFixtures>({ app: [...] });
export const test = mergeTests(appTest, workerTest);
export { expect } from '@playwright/test';
```

Tests **only** import from `@fixtures/fixtures` — never `@playwright/test` directly. ESLint enforces this.

### `fixtures/auth.ts`

Authentication helpers shared by setup project and tests:

- `storageStatePath(role)` — returns `tests/.auth/<role>.json`.
- `loginViaApi(request, context, role)` — POST `/api/login`, copies the resulting cookie onto the browser context.
- `switchUser(context, role)` — opens a new BrowserContext with the role's `storageState`, makes its Page the current one in `store.ts`.

### `fixtures/types.ts`

Re-exports `TestFixtures` and `WorkerFixtures` for convenience.

## Cheat sheet — what to use, when

| You want to... | Use |
|---|---|
| Write a test | `import { test, expect } from '@fixtures/fixtures'` |
| Use a PageObject | `app.<area>()` (never `new XPage(page)` directly) |
| Run setup that needs `app` per test | `test.beforeEach(async ({ app }) => ...)` |
| Run setup once per suite | `globalSetup` in `playwright.config.ts` |
| Run setup once per worker, with a Page | `test.beforeAll(async ({ workerApp }) => ...)` |
| Add a new fixture | See `.claude/skills/add-fixture/SKILL.md` |
| Switch user mid-test | `await app.switchUser('admin')` |
| Skip the login form | `loginViaApi(request, context, role)` |
| Start tests already logged in | `test.use({ storageState: storageStatePath('standard') })` |
