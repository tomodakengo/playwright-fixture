import fs from 'node:fs';

import { chromium } from '@playwright/test';

import { browserTitle, removeSession, stopFile, writeSession } from './session';

export interface HostOptions {
  name: string;
  headed: boolean;
  baseURL?: string;
  url?: string;
}

/**
 * Long-lived process that owns the browser for one session.
 *
 * The browser is exposed with `browser.bind()` so that both po-cli commands
 * (via `chromium.connect()`) and playwright-cli (via `attach`) drive the SAME
 * page. Keeping it in its own process is what lets the login state and the
 * current screen survive from one shell command to the next.
 */
export async function runHost(options: HostOptions): Promise<void> {
  const browser = await chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({ baseURL: options.baseURL });
  const page = await context.newPage();
  if (options.url) await page.goto(options.url);

  const title = browserTitle(options.name);
  const { endpoint } = await browser.bind(title);

  let stopping = false;
  const shutdown = async (reason: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`[po-cli host] shutdown: ${reason}`);
    removeSession(options.name);
    await browser.close().catch(() => undefined);
    process.exit(0);
  };

  browser.on('disconnected', () => void shutdown('browser disconnected'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // `close` asks the host to stop by creating a file instead of sending a signal.
  // On Windows a signal kills the process immediately, leaving the browser behind.
  const stop = stopFile(options.name);
  setInterval(() => {
    if (fs.existsSync(stop)) void shutdown('close requested');
  }, 300);

  writeSession({
    name: options.name,
    title,
    endpoint,
    pid: process.pid,
    baseURL: options.baseURL,
  });
  console.log(`[po-cli host] ready: ${endpoint}`);
}
