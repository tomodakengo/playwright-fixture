# Playwright Fixture Template

Playwright E2E template using **Page Object Model + Fixtures Pattern**, designed so QA engineers (and Claude Code) can write robust tests without falling into the `beforeAll`/`afterAll` fixture-scope pitfall.

The pattern follows yuden's article ([Zenn: テストコードに集中するための工夫(fixtures設計)](https://zenn.dev/yuden/articles/4d0965b2ced877)) and adds:

- A worker-scope escape hatch (`workerApp` / `workerPage`) so `beforeAll` is still possible when truly needed
- ESLint rules that catch the most common mistakes before runtime
- A small bundled Hono demo app under `src/app/` so `git clone && npm install && npm test` works out of the box
- Six Claude Code Skills (under `.claude/skills/`) that let Claude Code add page objects, write tests, set up auth, and debug flakes — without violating the project conventions

## Quick start — pick one

You have two ways to run the tests. Both produce the same result; pick based on
what's already on your machine.

### A. Docker only — zero host pollution (recommended for QA engineers)

Requires only a Docker-compatible engine + Compose v2. Any of these works:
**Docker Engine, Docker Desktop, [OrbStack](https://orbstack.dev/) (macOS),
[Podman Desktop](https://podman-desktop.io/), [Rancher Desktop](https://rancherdesktop.io/)**.
You do NOT need Node or Playwright installed.

```bash
git clone <this-repo>
cd playwright-fixture
docker compose --profile test run --rm tests
```

That's it. The first run pulls the Playwright image (~2 GB, cached) and builds the
Hono app image (~150 MB, cached). Subsequent runs take seconds.

The HTML report is written to `./playwright-report/` on your host:

```bash
# Open the report (uses your host browser)
xdg-open playwright-report/index.html      # Linux
open playwright-report/index.html          # macOS
start playwright-report/index.html         # Windows
```

Or use the bundled scripts:

```bash
npm run test:docker         # all tests (handles compose up/down)
npm run docker:up           # start the Hono app only (browse http://localhost:3000)
npm run docker:down         # stop everything, remove volumes
```

### B. Host Node — fastest iteration, supports UI mode

Use this if you want `npm run test:ui` (Playwright's interactive runner — not
supported in containers).

```bash
git clone <this-repo>
cd playwright-fixture
nvm use                      # uses .nvmrc → Node 20 LTS
npm install
npm run install:browsers     # installs Playwright browsers (~110 MB to global cache)
npm test                     # runs the bundled examples on chromium
```

### C. VS Code Dev Container — best of both

If you use VS Code (or Cursor / JetBrains with the Dev Containers plugin):

1. Install Docker engine + the **Dev Containers** extension.
2. Open the repo → command palette → **"Dev Containers: Reopen in Container"**.
3. In the integrated terminal: `npm test`.

The same `devcontainer.json` works in **GitHub Codespaces** with no changes —
zero install on your laptop.

You should see 10 tests passing (2 setup + 8 examples). Open the HTML report
with `npm run test:report` (host) or by opening `playwright-report/index.html`.

## What's in the box

```
== framework (keep) ===========================================================
.claude/skills/             Six Claude Code Skills (PageObject, test, fixture, auth, beforeAll, debug)
.devcontainer/              VS Code / Codespaces dev container config
.docker/                    Dockerfiles for `app` (Hono demo) and `tests` (Playwright)
.github/workflows/          GitHub Actions CI (PR + nightly cross-browser)
docker-compose.yml          Compose: app (SUT) + tests services
docs/                       Hand-written guides for QA engineers
fixtures/                   Fixture system (the heart of the template — generic)
  ├── store.ts              Page singleton; routes everything through currentPage()
  ├── app.ts                Empty BaseApp — extend this for your own project
  ├── worker-fixtures.ts    workerApp / workerPage / setupOnce (beforeAll escape hatch)
  ├── auth.ts               Generic storageState / API-login / switchUser helpers
  ├── fixtures.ts           mergeTests(appTest, workerTest) — the only thing tests import
  └── types.ts
pages/                      Page Objects (only base-page.ts ships; you add your own)
tests/                      Where YOUR tests go. Empty out of the box.
playwright.config.ts        Single config — webServer, projects, devices

== bundled demo (delete to start clean) =======================================
examples/
  ├── README.md             How to delete this directory
  ├── sample-app/           The Hono web app the demo specs test against
  ├── pages/                Demo PageObjects (LoginPage, ProductsPage, etc.) + components/
  ├── test-data/            Demo users and products
  ├── fixtures/
  │   ├── app.ts            DemoApp extends BaseApp with PageObject methods
  │   └── auth.ts           Type-safe wrappers around @fixtures/auth
  └── tests/
      ├── auth.setup.ts     Generates examples/tests/.auth/<role>.json
      └── specs/            Six worked example specs
```

## Adopting this template for your own app

1. **Strip the demo:**
   ```bash
   rm -rf examples/
   ```
   See `examples/README.md` (before deleting!) for the exact follow-up edits —
   they boil down to one tsconfig path swap and pruning a few config blocks.

2. **Build your PageObjects** under `pages/` (extending `pages/base-page.ts`).

3. **Extend the App** in `fixtures/app.ts` with one method per area.

4. **Write tests** under `tests/<feature>/<scenario>.spec.ts`.

5. **Point Playwright at your real app:** edit `playwright.config.ts` (`webServer`
   command, or set `BASE_URL` to a separately-running service).

## Key rules (also enforced by ESLint)

1. Tests import `test`/`expect` from `@fixtures/fixtures` — never `@playwright/test`.
2. Never use `page`/`app`/`context`/`request` inside `test.beforeAll`/`afterAll` — they are test-scoped. See `docs/beforeAll-afterAll-guide.md`.
3. Locators use `getByRole`/`getByLabel`/`getByTestId` — never raw CSS or XPath strings.
4. Never use `page.waitForTimeout()` — use locator-based waits and web-first assertions.
5. PageObjects don't assert. Assertions live in tests.

## Where to read

| Topic | File |
|---|---|
| The fixture model (most important) | [`docs/fixtures-explained.md`](docs/fixtures-explained.md) |
| Why `beforeAll` doesn't take `page` here | [`docs/beforeAll-afterAll-guide.md`](docs/beforeAll-afterAll-guide.md) |
| Test scope vs worker scope | [`docs/worker-vs-test-scope.md`](docs/worker-vs-test-scope.md) |
| Auth patterns (4 of them) | [`docs/multi-role-auth.md`](docs/multi-role-auth.md) |
| Add a Page Object | [`docs/how-to-add-page-object.md`](docs/how-to-add-page-object.md) |
| Add a test | [`docs/how-to-write-test.md`](docs/how-to-write-test.md) |
| Things break, how to diagnose | [`docs/troubleshooting.md`](docs/troubleshooting.md) |
| Claude Code rules for this repo | [`CLAUDE.md`](CLAUDE.md) |

## Commands cheat sheet

```bash
npm test                # all tests, chromium
npm run test:ui         # Playwright UI runner (interactive)
npm run test:headed     # run with visible browser
npm run test:debug      # PWDEBUG=1, step-by-step
npm run test:nightly    # chromium + firefox + webkit
npm run test:report     # open the last HTML report

npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run format          # Prettier write

npm run dev:app         # start the demo Hono app on :3000 (manual debugging, host)

# Docker
npm run test:docker     # run all tests inside docker-compose
npm run docker:up       # start the app container only (browse http://localhost:3000)
npm run docker:down     # stop and remove everything, including volumes
npm run docker:build    # rebuild images after a Dockerfile change
```

## Acknowledgements

The core fixture design comes from [yuden's Zenn article](https://zenn.dev/yuden/articles/4d0965b2ced877). The `App` facade idea originates from the [freee QA Advent Calendar 2024 day 11](https://developers.freee.co.jp/entry/freee-qa-advent-calendar2024-day11) article referenced there.
