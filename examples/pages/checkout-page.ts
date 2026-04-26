import { BasePage } from '@pages/base-page';
import { HeaderComponent } from './components/header-component';

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

export class CheckoutPage extends BasePage {
  readonly header = new HeaderComponent(this.page);
  readonly title = this.page.getByRole('heading', { name: 'Checkout' });
  readonly total = this.page.getByTestId('checkout-total');
  readonly firstNameInput = this.page.getByLabel('First name');
  readonly lastNameInput = this.page.getByLabel('Last name');
  readonly postalCodeInput = this.page.getByLabel('Postal code');
  readonly placeOrderButton = this.page.getByRole('button', { name: 'Place order' });

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async fillAddress(address: CheckoutAddress): Promise<void> {
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.postalCodeInput.fill(address.postalCode);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}

export class CheckoutCompletePage extends BasePage {
  readonly header = new HeaderComponent(this.page);
  readonly confirmation = this.page.getByTestId('order-confirmation');

  async goto(): Promise<void> {
    // No direct URL — reached only by completing checkout.
    throw new Error('CheckoutCompletePage is reached by submitting checkout, not by direct goto.');
  }
}
