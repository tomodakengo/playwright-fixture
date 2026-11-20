---
name: use-po-cli
description: Drive the app in a real browser from the shell by calling PageObjects with po-cli, next to playwright-cli. Invoke when the user asks to "check this in the browser", "try the flow", "reproduce this bug", "verify the change works", or otherwise wants a manual-style check during development instead of a new spec.
---

# Use po-cli for In-Browser Checks

`po-cli` calls the same PageObjects the specs use (`app.<area>().<method>()`) as one-line shell
commands, on a browser that playwright-cli is attached to as well. Known flows (login, navigation,
adding to cart) cost one command each; you only read the DOM for screens no PageObject covers yet.

## Steps

1. **Open a session**

   ```bash
   npm run -s po-cli -- open            # add --headed to watch it
   ```

   The app must be running (`npm run dev:app`, or `BASE_URL` pointing at it).

2. **Look up commands — never guess them**

   ```bash
   npm run -s po-cli -- help                 # areas on the App facade
   npm run -s po-cli -- help page.login      # methods with parameter names
   ```

3. **Use PageObjects for every flow they already cover**

   ```bash
   npm run -s po-cli -- page.login.goto
   npm run -s po-cli -- page.login.signIn standard standard123
   npm run -s po-cli -- page.products.addToCart "Sauce Labs Backpack"
   ```

   Arguments that parse as JSON are converted; quote numeric strings as `'"123"'`.

4. **Read the DOM only where no PageObject exists**

   ```bash
   npm run -s po-cli -- snapshot             # passed through to playwright-cli
   npm run -s po-cli -- click e15
   ```

   Do NOT `snapshot` the login screen or any screen a PageObject already drives.

5. **Close the session when done**

   ```bash
   npm run -s po-cli -- close
   ```

## Rules

- **NEVER add a PageObject method to `pages/` only so po-cli can call it.** Methods on `main` must be
  exercised by a spec; otherwise nothing tells you when they break, and po-cli would hand out stale
  knowledge. If you needed raw selectors during the check, list them in your report as
  "candidates for a PageObject" — the user decides, and they go in together with a spec
  (`add-page-object` + `write-test`).
- **NEVER turn a po-cli check into a spec automatically.** A check for one ticket is temporary;
  specs are for behavior the team wants to lock in as a regression test.
- Use `-s=<name>` (or `PO_CLI_SESSION=<name>`) to run separate browsers, e.g. one per role.
