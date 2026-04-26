---
name: write-test
description: Write a new Playwright E2E test (spec file). Invoke when the user asks to "write a test for X", "add a test that does Y", "create a spec for the Z flow", or any equivalent. Imports test/expect from the project fixtures, uses the `app` facade, places setup in `beforeEach` (never `beforeAll`), and uses web-first assertions.
---

# Write a Test

Use this skill any time a new spec file is needed.

## Steps

1. **Confirm the PageObjects exist**
   - Check `fixtures/app.ts` to see what `app.<area>()` calls are available.
   - If a needed PageObject is missing, run the `add-page-object` skill first, then come back.

2. **Pick the spec path**
   - `tests/<feature>/<scenario>.spec.ts` for real tests.
   - `examples/tests/specs/` is for the bundled demo specs only — do NOT add new files here unless the user is explicitly extending the examples.

3. **Write the spec**

   ```ts
   import { test, expect } from '@fixtures/fixtures';
   import { storageStatePath } from '@fixtures/auth';   // only if using a saved auth state

   test.use({ storageState: storageStatePath('standard') });   // optional, when starting authenticated

   test.describe('Feature name', () => {
     test.beforeEach(async ({ app }) => {
       await app.<area>().goto();
     });

     test('should <behavior> when <condition>', async ({ app }) => {
       await app.<area>().<doSomething>();
       await expect(app.<area>().<locator>).toBeVisible();
     });
   });
   ```

4. **Setup placement (CRITICAL)**

   | Need | Use |
   |---|---|
   | Setup that uses `page`/`app`, runs per-test | `test.beforeEach` |
   | One-time-per-suite setup (DB seed, etc.) | `globalSetup` in `playwright.config.ts` |
   | One-time-per-worker setup that needs a Page | the worker-scope `workerApp` fixture |
   | Authenticated state for many tests | `test.use({ storageState: storageStatePath(role) })` |

   **Never** `test.beforeAll(async ({ page, app, context, request }) => ...)` — it will throw at runtime, and the project ESLint rule blocks it.

5. **Assertions**
   - Prefer web-first assertions: `expect(locator).toBeVisible()`, `toHaveText()`, `toHaveURL()`, `toContainText()`, `toBeChecked()`, etc.
   - Avoid bare boolean checks like `expect(await locator.isVisible()).toBe(true)` — they don't auto-wait.

6. **Verify**
   - Run `npm run typecheck && npm run lint`. Fix any errors.
   - If the user is iterating on the test interactively, suggest `npm run test:ui` for the Playwright UI runner.
   - Otherwise: `npx playwright test tests/<your-new-spec>` and report the result.

## Things to AVOID

- `import { test, expect } from '@playwright/test'` — use `@fixtures/fixtures`.
- `test.beforeAll(async ({ page }) => ...)` — use `test.beforeEach` or `workerApp`.
- `await page.waitForTimeout(1000)` — use locator-based waits.
- Raw CSS/XPath selectors in the spec — they belong in PageObjects, and even there they should be role/label/test-id.
- Hard-coded credentials — pull from `@examples/test-data/users`.
