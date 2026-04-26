import { test, expect } from '@fixtures/fixtures';
import { storageStatePath } from '@examples/fixtures/auth';

// Start authenticated as `standard`, then swap to `admin` mid-test using the
// store.ts singleton trick. After `switchUser`, the App facade transparently
// returns PageObjects bound to the new (admin-authenticated) page.
test.use({ storageState: storageStatePath('standard') });

test('should access the admin page after switching to the admin role', async ({ app }) => {
  await app.products().goto();
  await expect(app.products().header.currentUser).toContainText('standard');

  await app.switchUser('admin');

  await app.admin().goto();
  await expect(app.admin().title).toBeVisible();
  await expect(app.admin().welcome).toContainText('admin');
});
