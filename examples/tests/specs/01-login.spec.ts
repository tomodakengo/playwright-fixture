import { test, expect } from '@fixtures/fixtures';
import { users } from '@examples/test-data/users';

test.describe('Login (the simplest possible spec)', () => {
  test.beforeEach(async ({ app }) => {
    // Per-test setup belongs in beforeEach, NOT beforeAll. The `app` fixture
    // is test-scoped and would not be available in a beforeAll hook.
    await app.login().goto();
  });

  test('should land on the products page when valid credentials are submitted', async ({
    app,
    page,
  }) => {
    const { username, password } = users.standard;
    await app.login().signIn(username, password);
    await expect(page).toHaveURL(/\/products$/);
    await expect(app.products().title).toBeVisible();
  });

  test('should show an error when credentials are invalid', async ({ app }) => {
    await app.login().signIn('standard', 'wrong-password');
    await expect(app.login().errorAlert).toContainText(/invalid/i);
  });

  test('should refuse a locked account', async ({ app }) => {
    await app.login().signIn('locked', 'locked123');
    await expect(app.login().errorAlert).toContainText(/locked/i);
  });
});
