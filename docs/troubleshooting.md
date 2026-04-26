# Troubleshooting

## "page is a test-scoped fixture and cannot be used in beforeAll/afterAll"

You're trying to destructure `page`/`app`/`context`/`request` in a `beforeAll` or `afterAll` hook. See `beforeAll-afterAll-guide.md` for the four right ways to express what you wanted.

## ESLint: "Do not import test/expect from `@playwright/test` here"

Change the import:

```ts
// before
import { test, expect } from '@playwright/test';

// after
import { test, expect } from '@fixtures/fixtures';
```

Type-only imports from `@playwright/test` are allowed: `import type { Page, Locator } from '@playwright/test'`.

## "Page is not initialized..."

You're calling `currentPage()` (or some PageObject method that does) outside a test body — most commonly from a top-level `console.log`, a `beforeAll` hook, or a setup script. The `app` fixture only populates `store` for the duration of a single test. Use `beforeEach`, `globalSetup`, or `workerApp` instead.

## storageState file not found

```
Error: ENOENT: no such file or directory, open 'tests/.auth/standard.json'
```

The `setup` project has not run yet. Make sure your spec's project has `dependencies: ['setup']` in `playwright.config.ts` (the `chromium` project does, by default). If you ran a single spec with `--project=chromium-no-setup` or similar, run the setup project first:

```bash
npx playwright test --project=setup
```

## Test passes locally, fails in CI

Usually one of:

1. **Timing** — local machine is faster, masking a race. Fix: replace any `waitForTimeout` with locator-based waits; double-check `await` on every action; use `expect(locator).toBeVisible()` rather than `isVisible()`.
2. **Isolation** — tests share state and the parallelism is different in CI. Check that you're not relying on a global counter, file, or DB row mutated by another test.
3. **Browser deps** — only relevant on bare runners. Make sure the workflow runs `npx playwright install --with-deps`.
4. **storageState stale** — the `setup` project should regenerate it every CI run, but check that `tests/.auth/` is in `.gitignore` and not committed.

Trace artifacts in the GitHub Actions run will tell you exactly where it failed: open the HTML report artifact, find the failing test, view the trace.

## Tests pass but they're way slower than they should be

- Are you logging in via the form when API login or storageState would do? See `multi-role-auth.md`.
- Are you using `--workers=1`? Drop the flag (Playwright defaults to half the CPU cores).
- Is `webServer.reuseExistingServer` set to `true` locally? Speeds up local iteration.
- Is `trace: 'on'` enabled globally? Switch to `'on-first-retry'` (the project default).

## "Element is not visible" but it's clearly there

The locator is matching the wrong element, or the element is covered. Open the trace and inspect the resolved selector. Common fixes:

- Use a more specific role: `getByRole('button', { name: 'Save', exact: true })`.
- Scope: `app.cart().itemFor('backpack').getByRole('button', { name: 'Remove' })` instead of a page-wide locator.
- Wait for the right state: `await expect(app.cart().items).toBeVisible()` first.

## hot to run only one project / one test

```bash
# Only the chromium project
npx playwright test --project=chromium

# A single file
npx playwright test examples/tests/specs/01-login.spec.ts

# A single test by title (substring match)
npx playwright test -g "should land on the products page"
```

## Stuck? Open the HTML report

```bash
npm run test:report
```

The trace viewer shows DOM snapshots, network calls, console output, and the exact action+wait timeline.
