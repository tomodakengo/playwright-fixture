import { test as setup } from '@fixtures/fixtures';
import { storageStatePath } from '@examples/fixtures/auth';
import { users, type RoleName } from '@examples/test-data/users';

const rolesToAuthenticate: RoleName[] = ['admin', 'standard'];

for (const role of rolesToAuthenticate) {
  setup(`authenticate as ${role}`, async ({ app, page }) => {
    const user = users[role];
    await app.login().goto();
    await app.login().signIn(user.username, user.password);
    // After successful sign-in we are redirected to /products.
    await page.waitForURL('**/products');
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
