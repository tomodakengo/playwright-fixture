---
name: add-fixture
description: Add a new Playwright test fixture or worker fixture. Invoke when the user asks to "add a fixture for X", "create a shared helper that's available in every test", "make Y available across tests", or wants to inject something (a logger, an API client, seeded test data) into specs.
---

# Add a Fixture

Use this skill when a test needs a shared, declarative dependency that should be available across multiple specs.

## Steps

1. **Decide the scope FIRST**

   | Question | Scope | File |
   |---|---|---|
   | Should it be created fresh for every test? | **test** | `fixtures/fixtures.ts` |
   | Should it be created once per worker (and reused across the worker's tests)? | **worker** | `fixtures/worker-fixtures.ts` |
   | Should it run once for the entire test suite? | Use **`globalSetup`** in `playwright.config.ts`, not a fixture |

   When in doubt, default to **test scope** — isolation is safer than performance.

2. **Add the type**
   - Edit `fixtures/types.ts` if you want the type publicly available, or add the type inline next to the fixture.

3. **Implement the fixture**

   For a test-scoped fixture (in `fixtures/fixtures.ts`):

   ```ts
   type TestFixtures = { app: App; myThing: MyThing };

   const appTest = base.extend<TestFixtures>({
     app: [ /* existing */ ],
     myThing: async ({ page }, use) => {
       const thing = new MyThing(page);
       await use(thing);
       await thing.dispose();   // teardown after use()
     },
   });
   ```

   For a worker-scoped fixture (in `fixtures/worker-fixtures.ts`):

   ```ts
   export const workerTest = base.extend<object, WorkerFixtures>({
     myWorkerThing: [
       async ({ browser }, use) => {
         const thing = await build(browser);
         await use(thing);
         await thing.close();
       },
       { scope: 'worker' },
     ],
   });
   ```

4. **Decide on `auto`**
   - `auto: true` — runs whether or not the test asks for it. Use only when the side effect is genuinely needed by every test.
   - omit (default) — only runs when a test names it in its destructured arg. **Default to this.**

5. **`mergeTests` is already wired**
   - You do NOT have to change `fixtures/fixtures.ts`'s `mergeTests(...)` call. Tests import from `@fixtures/fixtures` and the new fixture is available automatically.

6. **Document**
   - Add a one-line entry to the table in `docs/fixtures-explained.md`.

7. **Verify**
   - Run `npm run typecheck && npm run lint && npx playwright test`. All three must pass.

## Things to AVOID

- Mutating `store.ts` from a worker-scope fixture — `store` is for the per-test `app` only. Mixing scopes corrupts state across tests.
- Skipping the `await use(...)` — the fixture must yield with `use` so Playwright knows when teardown begins.
- Creating expensive resources in test scope when worker scope would do — but isolation wins ties.
- Forgetting teardown for resources that hold sockets, files, or external state.
