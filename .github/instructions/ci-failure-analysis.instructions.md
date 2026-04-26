# CI failure analysis — knowledge base for the auto-heal pipeline

This file is the QA knowledge base that the **auto-heal pipeline** (`.github/workflows/_analyze-and-fix.yml`) feeds to Claude Code as part of its prompt. When a nightly E2E run fails, Claude reads this file together with the failing test logs and tries to match the failure to a known pattern before proposing a fix.

> **Why this file exists.** Without an instructions file, an LLM defaults to its training-era best practices (often 2-3 years old) and tends to "fix" tests by extending timeouts or inserting `nth(0)`. This file injects YOUR project's current rules so the agent stays inside guardrails.

> **How to evolve it.** When a real CI failure exposes a pattern that is not yet listed here, add a new row. The file should grow into a 20-30 pattern catalogue over the first 6 months. Treat it as a living QA artifact, not a one-time spec.

---

## How Claude should use this file

1. Read the failing test name, error message, and stack trace from the Playwright JSON report.
2. Match against the **Patterns** section below.
3. **If a match is found**, apply the corresponding fix recipe within the listed scope (`tests/`, `pages/`, `utils/`).
4. **If no match is found**, do NOT guess wildly. Make the smallest possible defensive change OR open the PR with a comment "no matching pattern — possible product bug, please review."
5. Never violate the rules in **Hard bans** below, regardless of pattern match.

---

## Hard bans (NEVER do these, even if a fix appears to work)

- ❌ Insert `page.waitForTimeout(N)` to "fix" a timing failure.
- ❌ Inflate the global `timeout` in `playwright.config.ts`.
- ❌ Use `.nth(N)` to dodge a strict-mode violation. Find a unique locator instead.
- ❌ Replace `getByRole` / `getByLabel` / `getByTestId` with raw CSS / XPath because "the role-based locator is brittle." Roles ARE the contract.
- ❌ Add `try { ... } catch {}` to swallow assertion failures.
- ❌ Edit files outside `tests/`, `pages/`, `utils/`. The product code under `src/` (or `examples/sample-app/` in the demo) is **out of scope**.
- ❌ Change a test's expected value to match the observed value (the test would no longer fail, but you would also no longer be testing anything).

---

## Patterns

### P1 — Locator polling timeout

**Symptom**

```
Error: locator.click: Timeout 5000ms exceeded.
=========================== logs ===========================
waiting for getByRole('button', { name: 'Save' })
```

**Diagnosis**
The element exists in the DOM but isn't actionable yet (covered by overlay, in `disabled` state, mid-animation).

**Fix recipe**
- Tune the per-call retry/timeout for that specific action only:
  ```ts
  await app.products().header.cartLink.click({ timeout: 10_000 });
  ```
- Do **NOT** change the global `actionTimeout` or `expect.timeout`.
- If the element is consistently covered, identify the overlay (loading spinner, modal) and wait for it to be hidden first:
  ```ts
  await expect(page.getByTestId('loading-overlay')).toBeHidden();
  await app.products().header.cartLink.click();
  ```

---

### P2 — Strict-mode violation (locator resolves to multiple elements)

**Symptom**

```
Error: strict mode violation: getByRole('button', { name: 'Submit' }) resolved to 3 elements
```

**Diagnosis**
The locator name is not unique on the page.

**Fix recipe**
- Add `{ exact: true }` if the matched names are substring matches:
  ```ts
  page.getByRole('button', { name: 'Submit', exact: true })
  ```
- Or scope the locator to a parent container:
  ```ts
  app.cart().items.getByRole('button', { name: 'Remove' })
  ```
- Or scope to a dialog if the duplicate is in a modal:
  ```ts
  page.getByRole('dialog').getByRole('button', { name: 'Confirm' })
  ```
- ❌ Forbidden: `.nth(0)` to silently pick the first match.

---

### P3 — Rowspan / colspan table row resolution

**Symptom**

```
Error: locator.click: Timeout exceeded.
waiting for getByText('カテゴリA').locator('xpath=ancestor::tr')
                .filter({ hasText: '更新' })
```

**Diagnosis**
The table uses `rowspan` on the category column. When you start from the operation row (the second row of the rowspan group), `ancestor::tr` returns a row that does NOT contain the category text — the category was rendered only in the first row.

**Fix recipe**
Invert the lookup direction. Start from the operation cell and accept either "same row contains category" OR "preceding sibling row contains category":

```ts
locator(`xpath=//tr[
  td[normalize-space(.)="${operation}"]
  and (
    td[normalize-space(.)="${category}"]
    or preceding-sibling::tr[1][td[normalize-space(.)="${category}"]]
  )
]`)
```

This handles the rowspan source row and the rowspan continuation row uniformly.

---

### P4 — Post-navigation flake (assertion runs before page settles)

**Symptom**

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Products' })
Element not found
```

The previous step was a `click()` that triggered navigation.

**Diagnosis**
You're trying to assert on the destination page before navigation has completed. Playwright's auto-wait usually handles this, but a flake can occur if the element name is part of a re-rendering hydration cycle.

**Fix recipe**
- Trust auto-wait first. If the assertion is web-first (`expect(locator).toBe...`), it already retries.
- If still flaky, anchor on URL first, then assert on the element:
  ```ts
  await page.waitForURL('**/products');
  await expect(app.products().title).toBeVisible();
  ```
- ❌ Forbidden: `await page.waitForTimeout(1000)` before the assertion.

---

### P5 — Modal / dialog strict-mode violation

**Symptom**

```
Error: strict mode violation: getByRole('button', { name: 'Cancel' }) resolved to 2 elements
  - <button>Cancel</button>  (in main content)
  - <button>Cancel</button>  (in dialog)
```

**Diagnosis**
A `Cancel` button exists both on the page and inside a newly-opened dialog.

**Fix recipe**
Scope to the dialog:

```ts
const dialog = page.getByRole('dialog');
await dialog.getByRole('button', { name: 'Cancel' }).click();
```

If your PageObject doesn't yet expose the dialog scope, add a getter to it (e.g. `app.checkout().confirmModal`) and route the action through the getter — do NOT inline the `getByRole('dialog')` in the spec.

---

### P6 — `expect(...).toHaveText` race with re-render

**Symptom**

```
Error: expect(locator).toHaveText() failed
Expected: "Total: $29.99"
Received: ""
```

The element exists but its text was empty at the moment of assertion.

**Diagnosis**
Async state hydration. The element is rendered by the framework before the data is bound.

**Fix recipe**
- Use a regex that tolerates progressive rendering:
  ```ts
  await expect(app.cart().total).toHaveText(/\$\d+\.\d{2}/);
  ```
- Or assert on a stable wrapper element first, then on text:
  ```ts
  await expect(app.cart().items).toBeVisible();
  await expect(app.cart().total).toHaveText('Total: $29.99');
  ```
- ❌ Forbidden: `await page.waitForTimeout(500)` to let the binding settle.

---

### P7 — `storageState` expired or invalid

**Symptom**

```
Error: page.goto: net::ERR_TOO_MANY_REDIRECTS at /products
```

The test was supposed to start authenticated but ended up bouncing between `/login` and `/products` redirect loops.

**Diagnosis**
The `tests/.auth/<role>.json` cookie has expired or its session was invalidated server-side.

**Fix recipe**
This is **NOT** a test code bug. Do NOT edit the spec. Instead:
1. Verify the `setup` project ran successfully in this CI run.
2. If the setup itself failed, address the failure (often product-side: login API broken, credentials rotated).
3. If setup ran fine, the failure may be test isolation (one spec is calling logout and invalidating the shared state). File a Draft PR with a comment, do not auto-fix.

---

### P8 — `webServer` startup race

**Symptom**

```
Error: Timed out waiting 30000ms from config.webServer
```

**Diagnosis**
The Playwright `webServer` block tried to start the SUT but the readiness probe never returned 200 before the timeout.

**Fix recipe**
This is **NOT** a test code bug. Do NOT edit specs. Instead:
1. Check whether the SUT's startup time has regressed (look at the app build step in the same CI run).
2. If startup is genuinely slow, propose extending `webServer.timeout` in `playwright.config.ts` only (not the test timeout). Open as a Draft PR with a comment explaining why.

---

## Adding a new pattern (template)

When you encounter a CI failure that doesn't match any of the above, add an entry like this:

```markdown
### P<N> — <one-line title>

**Symptom**
\`\`\`
<paste the error message verbatim>
\`\`\`

**Diagnosis**
<1-3 sentences explaining the underlying cause>

**Fix recipe**
- <step 1>
- <step 2>
- ❌ Forbidden: <anti-pattern that LLMs often try here>
```

Keep entries small and specific. One pattern per concrete failure shape. Do NOT generalize patterns prematurely — if two patterns share a fix recipe but have different symptoms, list them separately so Claude can match either.
