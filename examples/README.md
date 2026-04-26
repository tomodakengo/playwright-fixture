# `examples/` — the bundled demo

Everything in this directory exists **only** so that `git clone && npm test`
shows a working repo. None of it is required by the framework. When you adopt
this template for your own project, **delete this entire directory** and you're
left with a clean Playwright + POM + Fixtures scaffold ready for your code.

## What's in here

| Path | Purpose |
|---|---|
| `sample-app/` | The Hono web server that the demo specs test against. |
| `pages/` | Demo PageObjects (`LoginPage`, `ProductsPage`, etc.) plus a `components/` widget. |
| `test-data/` | Demo user + product data (`users.ts`, `products.ts`). |
| `fixtures/app.ts` | A `DemoApp` that extends the framework's base `App` with the demo's PageObject methods. |
| `fixtures/auth.ts` | A typed wrapper around `@fixtures/auth` that uses the demo user table. |
| `tests/auth.setup.ts` | Generates `tests/.auth/<role>.json` for the demo roles. |
| `tests/specs/` | Six worked examples (login, purchase flow, storageState, API login, multi-role, beforeAll-via-workerApp). |

## How to delete it

1. Delete this whole directory:

   ```bash
   rm -rf examples/
   ```

2. Edit `tsconfig.json` and change the `@app-impl` path so it no longer points
   here. The simplest swap is to point it at the framework's empty base:

   ```diff
     "paths": {
   -   "@app-impl": ["examples/fixtures/app.ts"],
   +   "@app-impl": ["fixtures/app.ts"],
       "@fixtures/*": ["fixtures/*"],
       ...
     }
   ```

   Then add your own PageObject methods to `fixtures/app.ts` (or write a fresh
   `App` class somewhere else and point the alias at it).

3. Edit `playwright.config.ts` and remove `examples/` from `testMatch`:

   ```diff
   - testMatch: ['tests/**/*.spec.ts', 'examples/tests/**/*.spec.ts'],
   + testMatch: ['tests/**/*.spec.ts'],
   ```

4. Edit `package.json` and remove the demo's app scripts (you no longer have a
   bundled SUT):

   ```diff
   - "dev:app": "tsx watch examples/sample-app/index.ts",
   - "start:app": "tsx examples/sample-app/index.ts",
   ```

5. Edit `playwright.config.ts` `webServer` block to start your own app, or
   remove it entirely if your app runs separately. Set `BASE_URL` (env or in
   the config) to your app's URL.

6. If you're using the Docker setup: edit `.docker/app.Dockerfile` and
   `docker-compose.yml` to build your real app instead of the Hono demo, OR
   delete those Docker files if your app runs outside the compose stack.

7. Optionally clean up generated demo state:

   ```bash
   rm -rf playwright-report test-results tests/.auth/*.json
   ```

After these edits, `npm run typecheck && npm run lint` should pass. You're now
on a blank Playwright POM+Fixtures template with no demo cruft. Add your own
PageObjects under `pages/`, register them on your `App`, and write specs in
`tests/`.

## Why is this set up as a separate dir?

So you can answer the question "is this file part of the framework or part of
the demo?" without thinking. If a file is under `examples/`, it's the demo.
Everything else is the reusable scaffold.
