import { test as base, mergeTests } from '@playwright/test';
// `@app-impl` is a tsconfig path alias pointing to whichever App
// implementation is in use. By default it resolves to `examples/fixtures/app.ts`
// (the demo App). After you delete `examples/`, change the alias to
// `["fixtures/app.ts"]` (or your own implementation).
import { App } from '@app-impl';
import { setPage, currentPage, store } from './store';
import { workerTest } from './worker-fixtures';

export type TestFixtures = {
  app: App;
};

/**
 * The test-scoped `app` fixture.
 *
 * - `auto: true` so every test gets `app` initialized whether or not it asks
 *   for it. This means `App` is always alive inside test bodies.
 * - We register the page in the store BEFORE calling `use`, and clear it
 *   AFTER. This keeps `currentPage()` valid only inside the test body —
 *   accidental access from beforeAll/afterAll throws a clear error.
 */
const appTest = base.extend<TestFixtures>({
  app: [
    async ({ page }, use) => {
      setPage(page);
      const app = new App(currentPage);
      store.app = app;
      await use(app);
      store.app = null;
      setPage(null);
    },
    { auto: true },
  ],
});

export const test = mergeTests(appTest, workerTest);
export { expect } from '@playwright/test';
