# How to Add a Page Object

A 5-minute recipe to add a new screen to the test framework.

## Step 1 — Create the file

Path: `pages/<kebab-case>-page.ts`. For a "Wishlist" page:

```ts
// pages/wishlist-page.ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { HeaderComponent } from './components/header-component';

export class WishlistPage extends BasePage {
  readonly header = new HeaderComponent(this.page);
  readonly title = this.page.getByRole('heading', { name: 'Wishlist' });
  readonly emptyMessage = this.page.getByTestId('empty-wishlist');

  async goto(): Promise<void> {
    await this.page.goto('/wishlist');
  }

  itemFor(productId: string): Locator {
    return this.page.getByTestId(`wishlist-item-${productId}`);
  }

  async remove(productId: string): Promise<void> {
    await this.itemFor(productId).getByRole('button', { name: 'Remove' }).click();
  }
}
```

## Step 2 — Register on the App facade

Edit `fixtures/app.ts`:

```ts
import { WishlistPage } from '@pages/wishlist-page';

export class App {
  /* ... */
  wishlist = () => new WishlistPage(this.getPage());
}
```

## Step 3 — Use it from a test

```ts
test('removes an item from the wishlist', async ({ app }) => {
  await app.wishlist().goto();
  await app.wishlist().remove('backpack');
  await expect(app.wishlist().itemFor('backpack')).toBeHidden();
});
```

## Step 4 — Verify

```bash
npm run typecheck
npm run lint
npx playwright test tests/<your-spec>
```

## Conventions to follow

- Class name: `<PascalCase>Page`. File name: `<kebab-case>-page.ts`. Both must match.
- **Always extend `BasePage`** (it enforces the `goto()` signature).
- **Locators are `readonly` fields**, exposed by name. Use `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, or `getByTestId`. **Never** use raw CSS or XPath strings.
- **Methods are async actions** that combine multiple locator interactions. Keep them at the right level of abstraction — `signIn(username, password)` good; `clickUsernameInput()` bad (the test could just call `usernameInput.click()`).
- **No assertions inside PageObjects.** Assertions live in tests, so the failure messages point at the right place.

## Adding a hierarchical sub-page

If your app has `/admin` with `/admin/users` and `/admin/settings`:

```ts
// fixtures/app.ts
admin = Object.assign(() => new AdminPage(this.getPage()), {
  users: () => new AdminUsersPage(this.getPage()),
  settings: () => new AdminSettingsPage(this.getPage()),
});
```

Tests then read like the URL hierarchy:

```ts
await app.admin().goto();             // /admin
await app.admin.users().goto();        // /admin/users
await app.admin.settings().goto();     // /admin/settings
```

## Adding a reusable widget (header, modal, banner)

Path: `pages/components/<kebab-case>-component.ts`. Components do **not** extend `BasePage` and do not need `goto()`. Use **getters** (not field initializers) to avoid the TS "property used before initialization" issue:

```ts
import type { Locator, Page } from '@playwright/test';

export class ConfirmModalComponent {
  constructor(private readonly page: Page) {}

  get root(): Locator     { return this.page.getByRole('dialog'); }
  get confirm(): Locator  { return this.root.getByRole('button', { name: 'Confirm' }); }
  get cancel(): Locator   { return this.root.getByRole('button', { name: 'Cancel' }); }

  async accept(): Promise<void> { await this.confirm.click(); }
  async dismiss(): Promise<void> { await this.cancel.click(); }
}
```

Use it from any PageObject:

```ts
readonly deleteConfirm = new ConfirmModalComponent(this.page);
```
