---
name: debug-flaky-test
description: Diagnose and fix a flaky or intermittently failing Playwright test. Invoke when the user mentions "flaky", "intermittent", "passes locally fails in CI", "timing issue", "race condition", "sometimes the test fails", "this test is unstable", or shares a Playwright failure log.
---

# Debug a Flaky Test

Flakiness is almost always an auto-wait / isolation / timing problem, not a Playwright bug. Walk through these steps in order.

## Steps

1. **Reproduce with trace**

   ```bash
   npx playwright test <path-to-spec> --trace on --repeat-each=5
   ```

   If it fails, open the trace:

   ```bash
   npx playwright show-trace test-results/.../trace.zip
   ```

2. **Check the spec for these anti-patterns** (each is a likely culprit):

   - `await page.waitForTimeout(N)` — **always** replace with a locator-based wait. Find what you were waiting for and use `await expect(locator).toBeVisible()` (or another web-first assertion).
   - `page.locator('.css')` / `page.locator('//xpath')` — replace with `getByRole`/`getByLabel`/`getByTestId`. Brittle selectors break when the DOM changes.
   - Bare boolean assertions: `expect(await locator.isVisible()).toBe(true)` — does NOT auto-wait. Use `await expect(locator).toBeVisible()`.
   - `await Promise.all([page.click(...), page.waitForNavigation()])` — usually unnecessary now; Playwright auto-waits for navigation after `click`.

3. **Test isolation issues**

   - Is the test reading shared server state (cart, DB row) that other tests mutate? In this repo, the demo cart is keyed by **session id**, not username, so parallel logins of the same user are isolated. If you've extended the app and broken that, restore session-scoped state.
   - Is the test relying on a `storageState` that another test logs out of? Logging out invalidates the cookie inside that storageState file's content (server-side session cleared). Either don't log out, or have the spec generate its own state.

4. **Timing-sensitive UI**

   - Animations / transitions: scope to "after settle" by asserting on the final state.
   - Forms with debounced validation: assert on the final visible state, not intermediate ticks.
   - Long-running navigation: use `await page.waitForURL('**/expected-path')` with a generous timeout, or `await expect(page).toHaveURL(/.../)`.

5. **Check for unawaited promises**

   - Grep for `.click(`, `.fill(`, `.goto(` without `await`. Easy mistake.
   - In a PageObject method that wraps multiple actions, make sure every step is `await`ed inside the method.

6. **Consider running serially as a diagnosis (NOT the fix)**

   ```bash
   npx playwright test <spec> --workers=1
   ```

   If serial-run fixes it, the test has a parallelism / isolation problem. Fix the root cause; do NOT ship `--workers=1`.

7. **Last resort: retries**

   - `test.describe.configure({ retries: 2 })` is fine for **truly external** flakiness (network blips). Never use retries to mask a genuine race or selector bug.

## Things you must NOT do

- ❌ Add `page.waitForTimeout(2000)` to "fix" the flake.
- ❌ Replace `getByRole` with `nth-child` CSS as a "more reliable" selector — it's the opposite.
- ❌ Increase global timeout to make the symptom go away.
- ❌ Disable the test (`test.skip`) without filing a follow-up to fix it.

## After fixing

Run `--repeat-each=10` to confirm:

```bash
npx playwright test <spec> --repeat-each=10
```

Ten consecutive passes is the bar before reporting "fixed."
