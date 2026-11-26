/**
 * Smoke test for po-cli against the bundled demo app.
 *
 * po-cli leans on two things Playwright may change between releases:
 * `browser.bind()` and playwright-cli's `attach`. Run this after bumping
 * @playwright/test or @playwright/cli:  npm run po-cli:smoke
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';

import { REPO_ROOT } from './session';

const BIN = path.join(REPO_ROOT, 'scripts', 'po-cli', 'bin', 'po-cli.mjs');
const SESSION = 'smoke';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

let failures = 0;

function poCli(...args: string[]) {
  const result = spawnSync(process.execPath, [BIN, `-s=${SESSION}`, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, BASE_URL },
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
  if (!ok) {
    failures++;
    if (detail) console.log(detail);
  }
}

async function appIsUp(): Promise<boolean> {
  try {
    return (await fetch(`${BASE_URL}/health`)).ok;
  } catch {
    return false;
  }
}

async function ensureApp(): Promise<(() => void) | undefined> {
  if (await appIsUp()) return undefined;
  const app = spawn('npm', ['run', 'start:app'], { cwd: REPO_ROOT, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 60 && !(await appIsUp()); i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!(await appIsUp())) throw new Error(`The demo app did not start at ${BASE_URL}`);
  return () => app.kill();
}

const stopApp = await ensureApp();
try {
  const opened = poCli('open');
  check(
    'open launches the browser and attaches playwright-cli',
    opened.status === 0,
    opened.stderr,
  );

  const help = poCli('help', 'page.login');
  check(
    'help lists PageObject methods with parameter names',
    help.stdout.includes('page.login.signIn username password'),
    help.stdout,
  );

  check('page.login.goto', poCli('page.login.goto').status === 0);
  const signIn = poCli('page.login.signIn', 'standard', 'standard123');
  check('page.login.signIn', signIn.status === 0, signIn.stderr);

  const snapshot = poCli('snapshot');
  check(
    'playwright-cli sees the page po-cli navigated to',
    snapshot.stdout.includes('/products'),
    snapshot.stdout,
  );

  const unknown = poCli('page.login.nope');
  check('unknown command exits 2', unknown.status === 2, unknown.stderr);
} finally {
  const closed = poCli('close');
  check('close', closed.status === 0, closed.stderr);
  stopApp?.();
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
