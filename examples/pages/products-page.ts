import { BasePage } from '@pages/base-page';
import { HeaderComponent } from './components/header-component';

export class ProductsPage extends BasePage {
  readonly header = new HeaderComponent(this.page);
  readonly title = this.page.getByRole('heading', { name: 'Products' });
  readonly productList = this.page.getByTestId('product-list');

  async goto(): Promise<void> {
    await this.page.goto('/products');
  }

  product(productId: string) {
    return this.page.getByTestId(`product-${productId}`);
  }

  priceOf(productId: string) {
    return this.page.getByTestId(`price-${productId}`);
  }

  async addToCart(productName: string): Promise<void> {
    await this.page.getByRole('button', { name: `Add ${productName} to cart` }).click();
  }
}
