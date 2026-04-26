# Worker Scope vs Test Scope

A reference for what is available where, in this repo's fixture model.

## What "scope" means in Playwright

- **Test scope**: created before each test, destroyed after each test. Brand new every test.
- **Worker scope**: created once when a worker process starts, destroyed when the worker stops. Shared across every test that runs in that worker (in serial, never in parallel within the worker).

## Built-in fixtures

| Fixture | Scope | Available in test body | Available in `beforeEach`/`afterEach` | Available in `beforeAll`/`afterAll` |
|---|---|---|---|---|
| `browser` | worker | yes | yes | **yes** |
| `browserName` | worker | yes | yes | **yes** |
| `page` | test | yes | yes | ❌ no |
| `context` | test | yes | yes | ❌ no |
| `request` | test | yes | yes | ❌ no |

## This repo's custom fixtures

| Fixture | Scope | Available in test body | Available in `beforeEach`/`afterEach` | Available in `beforeAll`/`afterAll` |
|---|---|---|---|---|
| `app` | test | yes (auto) | yes | ❌ no |
| `workerContext` | worker | yes | yes | **yes** |
| `workerPage` | worker | yes | yes | **yes** |
| `workerApp` | worker | yes | yes | **yes** |
| `setupOnce` | worker (auto) | yes (auto) | yes | yes |

## Quick rules

1. If a fixture is **test-scoped**, you can use it in the test body and in `beforeEach`/`afterEach`. You **cannot** use it in `beforeAll`/`afterAll`.
2. If a fixture is **worker-scoped**, you can use it everywhere — including `beforeAll`/`afterAll`.
3. ESLint catches the most common mistake: destructuring `page`/`app`/`context`/`request` inside `beforeAll`/`afterAll`.

## What about `globalSetup`?

`globalSetup` is even higher-scoped than worker — it runs **once for the entire test suite**, before any worker starts. It receives a `FullConfig`, not fixtures. Use it for:

- Seeding databases
- Warming external services
- Generating shared `storageState` files (though for that, the **setup project** pattern in this repo is usually nicer)

`globalTeardown` mirrors it.

## Concrete examples

### Per-test (test scope)

```ts
test.beforeEach(async ({ app, page }) => {
  // OK — both are test-scoped, runs before each test
  await app.products().goto();
  await page.evaluate(() => window.scrollTo(0, 0));
});
```

### Per-worker (worker scope, no Page needed)

```ts
// fixtures/worker-fixtures.ts
seededData: [
  async ({}, use) => {
    const id = await db.insert({ name: 'test row' });
    await use(id);
    await db.delete(id);
  },
  { scope: 'worker' },
],
```

### Per-worker (worker scope, Page needed)

```ts
test.beforeAll(async ({ workerApp }) => {
  await workerApp.login().goto();
  // workerApp is bound to a Page that lives for this whole worker
});
```

### Per-suite (`globalSetup`)

```ts
// scripts/global-setup.ts
export default async function globalSetup() {
  await fetch('http://localhost:3000/admin/seed', { method: 'POST' });
}
```
