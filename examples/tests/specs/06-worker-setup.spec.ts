import { test, expect } from '@fixtures/fixtures';
import { users } from '@examples/test-data/users';

/**
 * THIS FILE EXISTS TO SHOW THE BEFOREALL ESCAPE HATCH.
 *
 * Sometimes you really do need to do something *once per worker* using a real
 * Page (e.g. to warm a heavy cache). The trick: use the worker-scoped
 * `workerApp` / `workerPage` fixtures we provide, NOT the per-test `app` /
 * `page`.
 *
 *   ❌ test.beforeAll(async ({ page })      => ... )  // throws at runtime
 *   ❌ test.beforeAll(async ({ app })       => ... )  // throws at runtime
 *   ✅ test.beforeAll(async ({ workerApp }) => ... )  // OK
 *
 * For most cases, prefer `globalSetup` (suite-once) or `beforeEach`
 * (per-test). Reach for this only when you must.
 */
test.describe('Worker-scoped beforeAll', () => {
  test.beforeAll(async ({ workerApp }) => {
    // Pre-warm: log into the app once for this worker, so the demo cart
    // store has a known session. (Demo only — in real code, prefer
    // globalSetup or storageState.)
    await workerApp.login().goto();
    await workerApp.login().signIn(users.standard.username, users.standard.password);
  });

  test('per-test app is independent of workerApp', async ({ app, page }) => {
    // The per-test `app` got a brand new page; we are NOT logged in here.
    await app.products().goto();
    await expect(page).toHaveURL(/\/login$/);
  });
});
