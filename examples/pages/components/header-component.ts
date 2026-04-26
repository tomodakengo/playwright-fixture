import type { Locator, Page } from '@playwright/test';

/**
 * Reusable widget that appears across multiple pages. Lives under
 * `pages/components/` to make it explicit that it is not a page itself.
 *
 * Implementation note: locators are exposed as getters (not field
 * initializers) so the class works whether or not the holder uses parameter
 * properties. This avoids the TS "property used before initialization"
 * pitfall in classes without a superclass.
 */
export class HeaderComponent {
  constructor(private readonly page: Page) {}

  get nav(): Locator {
    return this.page.getByTestId('main-nav');
  }
  get currentUser(): Locator {
    return this.page.getByTestId('current-user');
  }
  get signOutButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign out' });
  }
  get cartLink(): Locator {
    return this.nav.getByRole('link', { name: 'Cart' });
  }
  get productsLink(): Locator {
    return this.nav.getByRole('link', { name: 'Products' });
  }
  get adminLink(): Locator {
    return this.nav.getByRole('link', { name: 'Admin' });
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }

  async goToProducts(): Promise<void> {
    await this.productsLink.click();
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }
}
