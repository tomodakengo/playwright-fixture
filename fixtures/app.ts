import type { Page } from '@playwright/test';

/**
 * Base App facade.
 *
 * This is the framework-level base class. By design it has no PageObject
 * methods — the demo's PageObjects live in `examples/`, and the demo's
 * extended App is in `examples/fixtures/app.ts`.
 *
 * The fixture system reaches the *concrete* App through the `@app-impl`
 * tsconfig path alias. Out of the box that alias points to the demo App. To
 * use this template for your own project:
 *
 *   1. Delete the `examples/` directory.
 *   2. In `tsconfig.json`, change the `@app-impl` path to `["fixtures/app.ts"]`
 *      (or to your own custom App implementation).
 *   3. Add methods to this class for each PageObject you create.
 *
 * Example shape:
 *   ```
 *   import { LoginPage } from '@pages/login-page';
 *   export class App extends BaseApp {
 *     login = () => new LoginPage(this.getPage());
 *   }
 *   ```
 */
export class App {
  constructor(protected readonly getPage: () => Page) {}

  get page(): Page {
    return this.getPage();
  }
}
