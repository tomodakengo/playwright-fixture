import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { App } from '@app-impl';

export type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
  workerApp: App;
  setupOnce: void;
};

/**
 * Worker-scoped fixtures.
 *
 * These exist so that `test.beforeAll` / `test.afterAll` have a way to run
 * setup that *needs* a Page or App — without falling into the test-scope
 * pitfall (using the per-test `page` fixture in a worker-scope hook throws
 * at runtime).
 *
 * Important:
 *  - `workerApp` deliberately does NOT use the `store` singleton. The store
 *    is reserved for the per-test `app` fixture; mixing them would cause
 *    `app.switchUser()` calls in one test to leak into other tests.
 *  - Prefer `globalSetup` for one-time-per-suite work. Prefer `beforeEach`
 *    for per-test setup. Reach for these worker fixtures only when you truly
 *    need worker-once Page-using setup.
 */
export const workerTest = base.extend<object, WorkerFixtures>({
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  workerPage: [
    async ({ workerContext }, use) => {
      const page = await workerContext.newPage();
      await use(page);
      // The page closes when workerContext closes.
    },
    { scope: 'worker' },
  ],

  workerApp: [
    async ({ workerPage }, use) => {
      const app = new App(() => workerPage);
      await use(app);
    },
    { scope: 'worker' },
  ],

  /**
   * Auto worker fixture — runs exactly once when each worker starts.
   * Add side effects here (DB seeding, external service warm-up). Cleanup
   * code goes after `use()`.
   */
  setupOnce: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // Place worker-once setup here.
      await use();
      // Place worker-once teardown here.
    },
    { scope: 'worker', auto: true },
  ],
});
