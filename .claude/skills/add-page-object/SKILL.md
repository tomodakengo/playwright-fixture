---
name: add-page-object
description: Add a new Page Object class for a page in the application under test. Invoke when the user asks to "add a PageObject for X", "create a page object", "add the Y page", or implies that a new screen needs to be modeled before a test can be written. Creates the file under `pages/`, registers it on the `App` facade, and follows project conventions.
---

# Add a Page Object

Use this skill when a test needs to interact with a page/screen that does not yet have a PageObject in `pages/`.

## Steps

1. **Read the conventions**
   - Read `pages/base-page.ts` to confirm the `BasePage` abstract signature.
   - Read `pages/login-page.ts` as the canonical example.

2. **Decide the file path**
   - Page (a top-level screen): `pages/<kebab-case>-page.ts`, class `<PascalCase>Page`.
   - Reusable widget that appears on multiple pages (header, modal, banner): `pages/components/<kebab-case>-component.ts`, class `<PascalCase>Component`.

3. **Write the class**
   - Pages extend `BasePage` and implement `goto()`.
   - Components do NOT extend `BasePage`; they take `page: Page` in their constructor.
   - Locators are `readonly` fields (or getters) using **role/label/test-id**:

     ```ts
     readonly title = this.page.getByRole('heading', { name: 'Cart' });
     readonly checkoutButton = this.page.getByRole('button', { name: 'Checkout' });
     ```

   - **Forbidden:** `page.locator('.css')`, `page.locator('//xpath')`, `page.$(...)`.
   - For components without a superclass, prefer **getters** to avoid the TS "property used before initialization" pitfall:

     ```ts
     get cartLink(): Locator { return this.nav.getByRole('link', { name: 'Cart' }); }
     ```

4. **Register on the `App` facade**
   - Open `fixtures/app.ts` and add a method:

     ```ts
     myArea = () => new MyAreaPage(this.getPage());
     ```

   - For nested URL hierarchies (`/myarea/sub`), use the `Object.assign` pattern:

     ```ts
     myArea = Object.assign(() => new MyAreaPage(this.getPage()), {
       sub: () => new MySubPage(this.getPage()),
     });
     ```

5. **Verify**
   - Run `npm run typecheck`. Fix any errors.
   - Run `npm run lint`. Fix any errors.

## Things to AVOID

- Do NOT instantiate the PageObject directly in tests (`new MyPage(page)`); always go through `app.myArea()`.
- Do NOT add raw selector strings.
- Do NOT add a constructor body that does anything but call `super(page)` — keep PageObjects declarative.
- Do NOT import `test` or `expect` here — PageObjects only import types from `@playwright/test`.
