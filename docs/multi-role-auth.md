# Multi-Role Authentication

This template supports four ways to handle login state. Pick based on what your test is actually about.

| Pattern | Use when | Cost |
|---|---|---|
| 1. `storageState` | Most "logged-in" tests | Cheap (state generated once per role) |
| 2. API login | Login is incidental, you want to skip the form | Cheapest per test |
| 3. `switchUser` | Same test exercises multiple roles | Costs one extra context per switch |
| 4. Drive the form | Testing the login UX itself | Slowest |

## Pattern 1 — `storageState` (the default)

`examples/tests/auth.setup.ts` runs as the `setup` project and produces one `tests/.auth/<role>.json` per role.

```ts
// examples/tests/auth.setup.ts
const rolesToAuthenticate: RoleName[] = ['admin', 'standard'];
for (const role of rolesToAuthenticate) {
  setup(`authenticate as ${role}`, async ({ app, page }) => {
    const user = users[role];
    await app.login().goto();
    await app.login().signIn(user.username, user.password);
    await page.waitForURL('**/products');
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
```

In a spec:

```ts
import { test, expect } from '@fixtures/fixtures';
import { storageStatePath } from '@fixtures/auth';

test.use({ storageState: storageStatePath('standard') });

test('lands on products when storageState is loaded', async ({ app }) => {
  await app.products().goto();
  await expect(app.products().title).toBeVisible();
});
```

The `chromium` project depends on `setup`, so storageState files are guaranteed to exist before any test runs.

### Adding a new role

1. Add the role to `test-data/users.ts` (and `src/app/data/users.ts` if extending the demo app).
2. Add it to `rolesToAuthenticate` in `examples/tests/auth.setup.ts`.
3. Use `test.use({ storageState: storageStatePath('newRole') })` in your spec.

## Pattern 2 — API login

When the test has nothing to do with login UX, skip the form entirely:

```ts
import { loginViaApi } from '@fixtures/auth';

test('does the post-login work', async ({ app, context, request }) => {
  await loginViaApi(request, context, 'standard');
  await app.products().goto();
  /* ... */
});
```

`loginViaApi` POSTs `/api/login`, extracts the `Set-Cookie`, and calls `context.addCookies(...)`. The browser context is now authenticated; the next `goto()` will succeed.

## Pattern 3 — `switchUser` mid-test

Useful for tests like "user A creates a thing, then user B (admin) approves it":

```ts
test.use({ storageState: storageStatePath('standard') });

test('admin can approve standard user actions', async ({ app }) => {
  await app.products().goto();
  // standard user does stuff...

  await app.switchUser('admin');
  // app now reads through a fresh BrowserContext authenticated as admin
  await app.admin().goto();
  /* ... */
});
```

How it works: `switchUser` opens `browser.newContext({ storageState: storageStatePath(role) })`, creates a new Page, and calls `setPage(newPage)` on the `store.ts` singleton. The `App` facade reads its Page through `currentPage()`, so subsequent `app.<area>()` calls automatically get PageObjects bound to the new page. You don't have to thread a new variable through your test.

The previous context is left open (Playwright tears it down at test end). If you need explicit cleanup, capture and close it yourself.

## Pattern 4 — Drive the login form

Use this only when the login UX itself is what you're testing:

```ts
test('shows error on bad credentials', async ({ app }) => {
  await app.login().goto();
  await app.login().signIn('standard', 'wrong-password');
  await expect(app.login().errorAlert).toContainText(/invalid/i);
});
```

## Anti-patterns

- ❌ Calling `signIn(...)` inside `test.beforeAll` — see `beforeAll-afterAll-guide.md`.
- ❌ Hardcoding credentials inside specs — pull from `@examples/test-data/users`.
- ❌ Generating fresh `storageState` inside every test — that's the slow shape `storageState` was designed to eliminate.
