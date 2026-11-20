# po-cli: Call PageObjects from the Shell

`po-cli` turns the `App` facade into shell commands. `po-cli page.login.signIn standard standard123`
runs the same code as `await app.login().signIn('standard', 'standard123')` in a spec, on a browser
that [playwright-cli](https://github.com/microsoft/playwright-cli) is attached to as well.

It is meant for checks during development — trying a flow, reproducing a bug, letting an AI agent
verify a change — without writing a spec and without re-exploring screens your PageObjects already
know.

## Quick start

```bash
npm run dev:app                          # in another terminal

npm run -s po-cli -- open --headed
npm run -s po-cli -- page.login.goto
npm run -s po-cli -- page.login.signIn standard standard123
npm run -s po-cli -- snapshot             # playwright-cli: read the current page
npm run -s po-cli -- click e15            # playwright-cli: act on a ref from the snapshot
npm run -s po-cli -- close
```

`npm run -s` keeps npm's banner out of stdout, so return values can be captured:
`TITLE=$(npm run -s po-cli -- page.products.title)`.

## Commands

| Command                          | What it does                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `open [url] [--headed]`          | Launch Chromium, expose it with `browser.bind()`, attach playwright-cli                       |
| `close`                          | Close the browser                                                                             |
| `help [prefix]`                  | List areas / methods with parameter names (`help page.login`)                                 |
| `page.<area>.<method> [args...]` | Call `app.<area>().<method>(...args)`                                                         |
| anything else                    | Passed to playwright-cli on the same browser (`snapshot`, `click`, `fill`, `screenshot`, ...) |

- Arguments that parse as JSON (`42`, `true`, `'["a","b"]'`) are converted; others stay strings.
  Quote numeric strings as JSON: `'"123"'`.
- Return values go to stdout: strings as-is, objects as JSON, Locators as their description.
- `-s=<name>` (or `PO_CLI_SESSION=<name>`) runs a separate browser, e.g. one per role.
- `baseURL` comes from `BASE_URL` or `playwright.config.ts`, so po-cli hits the same app as the specs.

## How it works

```
po-cli open ──spawns──▶ host process (stays alive)
                          chromium.launch() → newContext({ baseURL }) → newPage()
                          browser.bind('po-cli') → endpoint saved to .po-cli/sessions/
                                │
        ┌───────────────────────┴───────────────────────┐
po-cli page.*                                   playwright-cli (attach)
  chromium.connect(endpoint)
  new App(() => page) → walk "login.signIn" → call
```

- There is no command list to maintain. Each command builds `new App(() => page)` outside the test
  runner and resolves the dot path at runtime, so a method you add to a PageObject is a command
  immediately.
- Each command starts a Node process and loads the PageObjects through tsx, so it takes about a
  second. That is fine for checks; keeping a process warm is a later optimization.
- `close` asks the host to stop by writing a file, not by sending a signal. On Windows a signal
  ends the process before it can close the browser.

## Rules

- **Do not add PageObject methods only for po-cli.** A method on `main` must be called by a spec.
  The point of po-cli is that every command is backed by behavior the nightly run keeps verifying;
  a method no spec calls can break silently.
- **Do not turn po-cli checks into specs automatically.** Specs are for behavior you want to lock
  in as a regression test. When a check reveals a flow worth keeping, add it to a PageObject
  together with a spec.

## When Playwright is upgraded

po-cli relies on `browser.bind()` (Playwright 1.60+) and on playwright-cli's `attach`. Both are new
APIs and may change. After bumping `@playwright/test` or `@playwright/cli`, run:

```bash
npm run po-cli:smoke
```

CI runs it on every PR as well.
