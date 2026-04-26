import { BasePage } from '@pages/base-page';
import { HeaderComponent } from './components/header-component';

export class AdminPage extends BasePage {
  readonly header = new HeaderComponent(this.page);
  readonly title = this.page.getByRole('heading', { name: 'Admin dashboard' });
  readonly welcome = this.page.getByTestId('admin-welcome');

  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }
}
