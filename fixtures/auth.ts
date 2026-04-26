import type { APIRequestContext, BrowserContext } from '@playwright/test';
import { setPage } from './store';

/**
 * Generic auth helpers — the framework knows nothing about your roles or your
 * users. Demo wrappers in `examples/fixtures/auth.ts` add the type-safe role
 * names and pull credentials from `examples/test-data/users.ts`.
 *
 * After deleting `examples/`, you can either:
 *  - call these helpers directly from your specs, or
 *  - create your own typed wrappers under `fixtures/` (mirror the demo pattern).
 */

const DEFAULT_BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export type LoginCredentials = { username: string; password: string };

export function storageStatePath(role: string): string {
  return `tests/.auth/${role}.json`;
}

/**
 * POST credentials to the given login endpoint and copy the resulting cookies
 * onto the browser context. Faster than driving a form; useful when the test
 * is not about login UX.
 */
export async function loginViaApi(
  request: APIRequestContext,
  context: BrowserContext,
  credentials: LoginCredentials,
  endpoint = '/api/login',
): Promise<void> {
  const response = await request.post(endpoint, { data: credentials });
  if (!response.ok()) {
    throw new Error(
      `API login failed (${endpoint}): ${response.status()} ${await response.text()}`,
    );
  }

  const setCookieHeaders = response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value);

  const cookies = setCookieHeaders
    .map((header) => {
      const [pair] = header.split(';');
      if (!pair) return null;
      const eq = pair.indexOf('=');
      if (eq < 0) return null;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!name) return null;
      return { name, value, url: DEFAULT_BASE_URL };
    })
    .filter((c): c is { name: string; value: string; url: string } => c !== null);

  await context.addCookies(cookies);
}

/**
 * Open a fresh BrowserContext authenticated by the storageState file
 * `tests/.auth/<role>.json`, and route the test's `app` facade through the
 * new page. Use this when you need to switch user mid-test.
 *
 * The previous context is intentionally left open — Playwright tears it down
 * at test end. If you need explicit cleanup, do it yourself.
 */
export async function switchUser(context: BrowserContext, role: string): Promise<void> {
  const browser = context.browser();
  if (!browser) {
    throw new Error('switchUser requires a Browser instance (none attached to context).');
  }
  const newContext = await browser.newContext({ storageState: storageStatePath(role) });
  const newPage = await newContext.newPage();
  setPage(newPage);
}
