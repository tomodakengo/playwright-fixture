import { BasePage } from '@pages/base-page';
import { HeaderComponent } from './components/header-component';

export class CartPage extends BasePage {
  readonly header = new HeaderComponent(this.page);
  readonly title = this.page.getByRole('heading', { name: 'Your cart' });
  readonly emptyMessage = this.page.getByTestId('empty-cart');
  readonly items = this.page.getByTestId('cart-items');
  readonly total = this.page.getByTestId('cart-total');
  readonly checkoutButton = this.page.getByRole('button', { name: 'Checkout' });

  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  itemFor(productId: string) {
    return this.page.getByTestId(`cart-item-${productId}`);
  }

  quantityFor(productId: string) {
    return this.page.getByTestId(`quantity-${productId}`);
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
