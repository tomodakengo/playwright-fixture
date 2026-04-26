import type { Page } from '@playwright/test';
import type { App } from '@app-impl';

type Store = {
  page: Page | null;
  app: App | null;
};

/**
 * Singleton state for the test-scoped page and App facade.
 *
 * Why a singleton: PageObjects are created lazily (`new LoginPage(getPage())`)
 * each time the user calls `app.login()`. By routing every read through
 * `currentPage()`, we can swap the underlying Page (e.g. switch to a different
 * authenticated context via `switchUser`) and all subsequent PageObject
 * instances will pick up the new page automatically.
 *
 * NEVER read `store.page` directly outside fixtures — use `currentPage()` so
 * we get a clear error if it is accessed outside a test (e.g. from beforeAll).
 */
export const store: Store = { page: null, app: null };

export function currentPage(): Page {
  if (!store.page) {
    throw new Error(
      'Page is not initialized. The `app` fixture is test-scoped, so ' +
        '`page`/`app` cannot be used inside test.beforeAll/afterAll. ' +
        'Use test.beforeEach, the worker-scoped `workerApp`, or globalSetup. ' +
        'See docs/beforeAll-afterAll-guide.md',
    );
  }
  return store.page;
}

export function setPage(page: Page | null): void {
  store.page = page;
}
