import { test, expect } from '@fixtures/fixtures';
import { storageStatePath } from '@examples/fixtures/auth';

// Reuse the storageState produced by tests/auth.setup.ts so we never have to
// drive the login form here. Each test begins already authenticated.
test.use({ storageState: storageStatePath('standard') });

test('should reach the products page directly when storageState is loaded', async ({ app }) => {
  await app.products().goto();
  await expect(app.products().title).toBeVisible();
  await expect(app.products().header.currentUser).toContainText('standard');
});
