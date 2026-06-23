import type { BrowserContext, Page } from '@playwright/test';

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
  /** Extra BrowserContexts opened mid-test (e.g. by `switchUser`). */
  private readonly switchedContexts: BrowserContext[] = [];

  constructor(protected readonly getPage: () => Page) {}

  get page(): Page {
    return this.getPage();
  }

  /**
   * Register a BrowserContext opened mid-test so the `app` fixture can close it
   * during teardown. Contexts created via `browser.newContext()` are NOT
   * auto-closed by Playwright the way the built-in `context` fixture is — they
   * leak until the whole Browser closes unless you close them yourself.
   */
  protected trackContext(context: BrowserContext): void {
    this.switchedContexts.push(context);
  }

  /** Close every context registered via `trackContext`. Called by the `app` fixture. */
  async closeSwitchedContexts(): Promise<void> {
    while (this.switchedContexts.length > 0) {
      const context = this.switchedContexts.pop();
      await context?.close();
    }
  }
}
