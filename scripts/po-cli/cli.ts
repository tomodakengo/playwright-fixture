import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { chromium } from '@playwright/test';

import config from '../../playwright.config';
import { catalog, renderCatalog } from './catalog';
import { type HostOptions, runHost } from './host';
import { formatResult, invoke, UnknownCommandError } from './resolver';
import {
  browserTitle,
  DEFAULT_SESSION,
  isAlive,
  logFile,
  readSession,
  REPO_ROOT,
  requireSession,
  stopFile,
} from './session';

const LAUNCHER = path.join(REPO_ROOT, 'scripts', 'po-cli', 'bin', 'po-cli.mjs');
const PLAYWRIGHT_CLI = createRequire(import.meta.url).resolve('@playwright/cli/playwright-cli.js');
const READY_TIMEOUT = 60_000;

const HELP = `po-cli - call your PageObjects from the shell, next to playwright-cli

Usage: po-cli [-s=<session>] <command> [args...]

Session:
  open [url] [--headed]      Launch a browser and attach playwright-cli to it
  close                      Close the browser

PageObjects (dot path + space-separated args):
  page.<area>.<method>       Call a method on the App facade (same as app.<area>().<method>() in a spec)
                               e.g. po-cli page.login.goto
                                    po-cli page.login.signIn standard standard123
  help [prefix]              List what you can call, e.g. po-cli help page.products

  Args that parse as JSON (numbers, true/false/null, [...], {...}) are converted.
  Return values go to stdout (strings as-is, everything else as JSON).

Anything else (snapshot / click / fill / screenshot ...) is passed to playwright-cli,
attached to the same browser. See \`npx playwright-cli --help\`.
`;

class UsageError extends Error {}

function playwrightCli(args: string[], capture: boolean) {
  return spawnSync(process.execPath, [PLAYWRIGHT_CLI, ...args], {
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    windowsHide: true,
  });
}

async function waitUntil(predicate: () => boolean, timeout: number): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return predicate();
}

async function open(session: string, argv: string[]): Promise<void> {
  if (readSession(session)) {
    console.error(`Session '${session}' is already open.`);
    return;
  }
  const options: HostOptions = {
    name: session,
    headed: argv.includes('--headed'),
    // Borrow baseURL from playwright.config.ts so po-cli and the specs hit the same app.
    baseURL: process.env.BASE_URL ?? config.use?.baseURL,
    url: argv.find((arg) => !arg.startsWith('--')),
  };

  const log = logFile(session);
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const out = fs.openSync(log, 'w');
  const host = spawn(process.execPath, [LAUNCHER, '__host', JSON.stringify(options)], {
    detached: true,
    windowsHide: true,
    stdio: ['ignore', out, out],
  });
  host.unref();
  const pid = host.pid ?? -1;

  const ready = await waitUntil(
    () => readSession(session)?.pid === pid || !isAlive(pid),
    READY_TIMEOUT,
  );
  if (!ready || readSession(session)?.pid !== pid) {
    throw new Error(`The browser did not start. Log: ${log}\n${fs.readFileSync(log, 'utf-8')}`);
  }

  const title = browserTitle(session);
  const attached = playwrightCli(['attach', title, `--session=${title}`], true);
  if (attached.status !== 0) {
    await close(session);
    throw new Error(`playwright-cli could not attach:\n${attached.stdout}${attached.stderr}`);
  }
  console.error(`### po-cli session '${session}' opened (baseURL: ${options.baseURL ?? 'none'})`);
}

async function close(session: string): Promise<void> {
  const info = readSession(session);
  if (!info) {
    console.error(`Session '${session}' is not open.`);
    return;
  }
  playwrightCli([`-s=${info.title}`, 'close'], true);
  fs.writeFileSync(stopFile(session), '');
  await waitUntil(() => !isAlive(info.pid), 30_000);
  console.error(`### po-cli session '${session}' closed`);
}

async function runPageCommand(session: string, command: string, args: string[]): Promise<void> {
  const info = requireSession(session);
  const browser = await chromium.connect(info.endpoint);
  try {
    const context = browser.contexts()[0];
    const page = context?.pages()[0];
    if (!page) throw new Error(`Session '${session}' has no open page.`);
    const output = formatResult(await invoke(command, args, page));
    if (output !== undefined) process.stdout.write(`${output}\n`);
  } finally {
    // Disconnects this client only; the host keeps the browser alive.
    await browser.close();
  }
}

async function main(argv: string[]): Promise<number> {
  let session = process.env.PO_CLI_SESSION ?? DEFAULT_SESSION;
  const rest: string[] = [];
  for (const arg of argv) {
    const match = rest.length === 0 ? arg.match(/^(?:-s|--session)=(.*)$/) : null;
    if (match) session = match[1] ?? session;
    else rest.push(arg);
  }
  const [command, ...args] = rest;

  switch (command) {
    case undefined:
    case '--help':
      process.stdout.write(HELP);
      return 0;
    case '__host':
      await runHost(JSON.parse(args[0] ?? '{}') as HostOptions);
      return -1; // keep running
    case 'open':
      await open(session, args);
      return 0;
    case 'close':
      await close(session);
      return 0;
    case 'help':
      process.stdout.write(`${renderCatalog(catalog(args[0] ?? 'page'))}\n`);
      return 0;
  }

  if (command === 'page' || command.startsWith('page.')) {
    await runPageCommand(session, command, args);
    return 0;
  }

  // Everything else goes to playwright-cli, on the same browser.
  const info = requireSession(session);
  const passed = playwrightCli([`-s=${info.title}`, command, ...args], true);
  process.stdout.write(passed.stdout ?? '');
  process.stderr.write(passed.stderr ?? '');
  // playwright-cli exits 0 even when an action fails and only prints "### Error".
  if (/^### Error$/m.test(passed.stdout ?? '')) return 1;
  return passed.status ?? 1;
}

try {
  const code = await main(process.argv.slice(2));
  if (code >= 0) process.exit(code);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`✖ ${message}\n`);
  process.exit(error instanceof UsageError || error instanceof UnknownCommandError ? 2 : 1);
}
