import { test, expect } from '@fixtures/fixtures';
import { users } from '@examples/test-data/users';
import { productNames } from '@examples/test-data/products';

test('should complete a purchase end-to-end', async ({ app }) => {
  const { username, password } = users.standard;

  // Sign in
  await app.login().goto();
  await app.login().signIn(username, password);
  await expect(app.products().title).toBeVisible();

  // Add an item, then go to the cart
  await app.products().addToCart(productNames.backpack);
  await app.products().header.goToCart();
  await expect(app.cart().itemFor('backpack')).toBeVisible();
  await expect(app.cart().quantityFor('backpack')).toHaveText('1');

  // Checkout
  await app.cart().checkout();
  await app.checkout().fillAddress({
    firstName: 'QA',
    lastName: 'Engineer',
    postalCode: '00000',
  });
  await app.checkout().placeOrder();

  // Confirmation
  await expect(app.checkoutComplete().confirmation).toBeVisible();
});
