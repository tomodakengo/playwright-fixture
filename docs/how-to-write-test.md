# How to Write a Test

The minimum recipe for adding a new spec.

## The shape

```ts
import { test, expect } from '@fixtures/fixtures';

test.describe('Cart', () => {
  test.beforeEach(async ({ app }) => {
    await app.products().goto();
  });

  test('should show the added product in the cart', async ({ app }) => {
    await app.products().addToCart('Sauce Labs Backpack');
    await app.products().header.goToCart();
    await expect(app.cart().itemFor('backpack')).toBeVisible();
  });
});
```

## Five things every spec gets right

1. **Imports `test` and `expect` from `@fixtures/fixtures`** — never `@playwright/test`.
2. **Uses `app.<area>()`** — never `new XPage(page)`.
3. **Setup goes in `beforeEach`** — never `beforeAll`.
4. **Uses web-first assertions** — `expect(locator).toBeVisible()` not `expect(await locator.isVisible()).toBe(true)`.
5. **Test name is a sentence** — `'should <behavior> when <condition>'`.

## File location

- Real tests: `tests/<feature>/<scenario>.spec.ts`
- Demo tests bundled with the template: `examples/tests/specs/` — don't add new files here unless you're explicitly extending the examples.

## Authenticated tests

If your test needs to start logged in:

```ts
import { test, expect } from '@fixtures/fixtures';
import { storageStatePath } from '@fixtures/auth';

test.use({ storageState: storageStatePath('standard') });

test('does the work', async ({ app }) => {
  await app.products().goto();
  /* ... */
});
```

See `multi-role-auth.md` for the four supported auth patterns.

## Run it

```bash
# Run just your new spec
npx playwright test tests/<your-spec>

# Run interactively
npm run test:ui

# Run with the browser visible
npm run test:headed -- tests/<your-spec>

# Debug step-by-step
npm run test:debug -- tests/<your-spec>

# View the last HTML report
npm run test:report
```

## Common mistakes

- ❌ `import { test } from '@playwright/test'` → ESLint will block.
- ❌ `test.beforeAll(async ({ page }) => ...)` → ESLint will block. Use `beforeEach` or `globalSetup`. See `beforeAll-afterAll-guide.md`.
- ❌ `await page.waitForTimeout(1000)` → use `await expect(locator).toBeVisible()`.
- ❌ `page.locator('.btn-primary')` → use `page.getByRole('button', { name: 'Submit' })`.
- ❌ Hard-coding credentials in the test → import from `@examples/test-data/users`.
- ❌ Asserting inside a PageObject method → assertions belong in the spec.
