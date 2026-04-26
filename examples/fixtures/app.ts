import { App as BaseApp } from '@fixtures/app';
import { LoginPage } from '@examples/pages/login-page';
import { ProductsPage } from '@examples/pages/products-page';
import { CartPage } from '@examples/pages/cart-page';
import { CheckoutPage, CheckoutCompletePage } from '@examples/pages/checkout-page';
import { AdminPage } from '@examples/pages/admin-page';
import { switchUser as switchUserImpl, type RoleName } from '@examples/fixtures/auth';

/**
 * Demo App facade — extends the framework's BaseApp with PageObject methods
 * for the bundled Hono demo app. Wired into the test fixture via the
 * `@app-impl` tsconfig path alias.
 *
 * After deleting `examples/`, repoint `@app-impl` to `fixtures/app.ts` and
 * build your own App from there.
 */
export class App extends BaseApp {
  login = () => new LoginPage(this.getPage());
  products = () => new ProductsPage(this.getPage());
  cart = () => new CartPage(this.getPage());
  checkout = () => new CheckoutPage(this.getPage());
  checkoutComplete = () => new CheckoutCompletePage(this.getPage());
  admin = () => new AdminPage(this.getPage());

  async switchUser(role: RoleName): Promise<void> {
    await switchUserImpl(this.getPage().context(), role);
  }
}
