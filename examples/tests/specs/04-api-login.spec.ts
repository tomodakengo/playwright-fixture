import { test, expect } from '@fixtures/fixtures';
import { loginViaApi } from '@examples/fixtures/auth';

// API login is the fastest way to authenticate when the test is not about
// login UX itself. We POST credentials to /api/login and copy the resulting
// session cookie onto the browser context.
test('should authenticate via API and add a product to the cart', async ({
  app,
  context,
  request,
}) => {
  await loginViaApi(request, context, 'standard');

  await app.products().goto();
  await expect(app.products().title).toBeVisible();
  await app.products().addToCart('Sauce Labs Backpack');
  await app.products().header.goToCart();

  await expect(app.cart().itemFor('backpack')).toBeVisible();
});
