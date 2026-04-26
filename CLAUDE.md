# Claude Code Instructions for This Repository

This is a Playwright E2E test template using **Page Object Model + Fixtures Pattern**.

## Repo structure

- **Root** = the framework. Keep as-is for any project: `fixtures/`, `pages/base-page.ts`, `tests/` (where the user's tests live), `playwright.config.ts`, etc.
- **`examples/`** = the bundled demo. Contains a small Hono SUT (`examples/sample-app/`), demo PageObjects (`examples/pages/`), demo data (`examples/test-data/`), the demo's extended App (`examples/fixtures/app.ts`), and worked example specs (`examples/tests/specs/`).

When the user adopts this template they **delete `examples/` entirely** and re-point one tsconfig path. The framework knows about the demo via ONE indirection: the `@app-impl` tsconfig alias in `tsconfig.json`. Default: `["examples/fixtures/app.ts"]`. After deletion: `["fixtures/app.ts"]` (the framework's empty base App, ready to extend) or wherever they put their own App.

See `examples/README.md` for the exact deletion steps.

**Implication for you (Claude):** when the user asks you to add a PageObject or test for THEIR app (not the demo), the file goes in the root `pages/` and root `tests/`, NOT under `examples/`. Treat `examples/` as read-only demo content unless the user explicitly says they're extending the demo.

## Hard Rules (NEVER violate)

1. **NEVER import `test` or `expect` from `@playwright/test`** in `tests/` or `pages/`. Always:

   ```ts
   import { test, expect } from '@fixtures/fixtures';
   ```

   Type-only imports (`import type { Page, Locator } from '@playwright/test'`) are allowed everywhere.
   ESLint enforces this; the only directory exempt from the value-import ban is `fixtures/`.

2. **NEVER use `page`, `context`, `request`, or `app` inside `test.beforeAll` / `test.afterAll`.**
   They are **test-scoped** fixtures and will throw at runtime.

   - Per-test setup → `test.beforeEach`
   - Worker-once setup that needs a Page/App → the worker-scoped `workerApp` / `workerPage` fixtures
   - Suite-once setup → `globalSetup` in `playwright.config.ts`

   ESLint blocks the wrong shape. See `docs/beforeAll-afterAll-guide.md`.

3. **NEVER write raw selector strings** like `page.locator('.btn-primary')` or `page.locator('xpath=...')`.
   Use `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, or `getByTestId` instead.

4. **NEVER use `page.waitForTimeout(ms)`.** Use locator-based waits / web-first assertions
   (`expect(locator).toBeVisible()`, `expect(locator).toHaveText(...)`).

5. **NEVER add a new dependency** (`npm install <pkg>`) without confirming with the user first.

6. **NEVER edit files under `examples/`** when the user asks for "test changes." `examples/` is
   the deletable demo bundle — the user will throw it away when they adopt the template. Real
   PageObjects go in root `pages/`, real specs in root `tests/`, real test data in a directory
   the user chooses (`test-data/` is a fine convention).

## File Placement

| Kind | Location | Notes |
|---|---|---|
| New PageObject (user's project) | `pages/<kebab-case>-page.ts` | Class `PascalCase + Page`, extends `BasePage` |
| Reusable widget (header/modal/etc.) | `pages/components/` | Not a page; lives outside `pages/` root |
| New test-scope fixture | `fixtures/fixtures.ts` | Add to the `appTest = base.extend<...>` block |
| New worker-scope fixture | `fixtures/worker-fixtures.ts` | Use `{ scope: 'worker' }` |
| Shared test data | `test-data/` (or your project's convention) | Never `import` from `examples/` outside the demo |
| Test spec | `tests/<feature>/<scenario>.spec.ts` | Real tests, not demos |
| Auth state file | `tests/.auth/<role>.json` | gitignored; produced by your own `auth.setup.ts` |
| Demo PageObject (extending the bundled demo) | `examples/pages/` | Only when explicitly extending the demo |
| Demo spec (extending the bundled demo) | `examples/tests/specs/` | Only when explicitly extending the demo |

After adding a new PageObject, register it on the App (`fixtures/app.ts` for user projects after the alias swap, or `examples/fixtures/app.ts` while the demo is in place) so tests reach it via `app.<area>()`.

## Naming

- PageObject class: `PascalCase + Page` (e.g. `LoginPage`)
- File name: `kebab-case` matching the class (e.g. `login-page.ts`)
- Test name: `should <expected behavior> when <condition>` (lowercase, no period at end)
- Fixture name: `camelCase`. If a worker-scope fixture has a test-scope sibling, prefix it `worker` (e.g. `workerPage`, `workerApp`).

## When the User Asks for a Test

1. Check whether the necessary PageObject exists. If not, invoke the `add-page-object` skill first.
2. Make sure the PageObject is registered on the `App` facade (`fixtures/app.ts`).
3. Write the spec, importing `test` and `expect` from `@fixtures/fixtures`.
4. Use `test.beforeEach` for setup that needs `page`/`app`. Never `test.beforeAll`.
5. After writing, mentally run `npm run lint && npm run typecheck && npx playwright test <new-spec>` and resolve any issues before reporting done.

## Commands

- `npm test` — run all tests (chromium project)
- `npm run test:ui` — Playwright UI mode (interactive)
- `npm run test:headed` — run with visible browser
- `npm run test:nightly` — run on chromium + firefox + webkit
- `npm run lint` — ESLint
- `npm run lint:fix` — ESLint with auto-fix
- `npm run typecheck` — `tsc --noEmit`
- `npm run dev:app` — start the Hono app standalone (for manual debugging on http://localhost:3000)

## Docker / Dev Container

This template ships with a Dev Container (`.devcontainer/`) and a Docker Compose
setup (`docker-compose.yml` + `.docker/`) so QA engineers can run tests without
installing Node or Playwright on their host.

When working **inside the container**:

- The Hono app is reachable at `http://app.test:3000` — **not** `localhost:3000`. The
  `BASE_URL` env var is set automatically by the entrypoint.
  - Why `app.test` and not `app`? Chromium 127+ auto-upgrades single-label hostnames
    (like `http://app`) to HTTPS, which breaks an HTTP-only SUT. The dotted alias
    bypasses that upgrade.
- The `webServer` block in `playwright.config.ts` is **auto-disabled** when
  `PLAYWRIGHT_DISABLE_WEBSERVER=1` (which the entrypoint sets). Compose owns
  the SUT lifecycle via the `app` service's healthcheck.
- `npm run test:ui` is **NOT supported** inside the container — run it on the
  host if you need the Playwright UI runner.
- `node_modules` lives in a named volume to avoid Win/Mac bind-mount native
  binary issues. Don't `rm -rf node_modules` on the host expecting the container
  to pick it up; rebuild with `npm run docker:build`.

Commands:

- `npm run test:docker` — one-shot: build (if needed), bring up `app`, run tests, tear down.
- `npm run docker:up` / `npm run docker:down` — start/stop just the app for manual browsing.
- `npm run docker:build` — rebuild images after a Dockerfile change.

## When in Doubt

- `docs/fixtures-explained.md` — how `App`, `store`, and worker fixtures fit together
- `docs/beforeAll-afterAll-guide.md` — the lifecycle pitfall and its workarounds
- `docs/multi-role-auth.md` — the four supported auth patterns
- `docs/how-to-add-page-object.md` — step-by-step PageObject recipe
- `docs/how-to-write-test.md` — canonical test shape
- `docs/troubleshooting.md` — common failures and fixes
