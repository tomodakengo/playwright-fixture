import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HOME = path.join(REPO_ROOT, '.po-cli');
export const DEFAULT_SESSION = 'default';

/** What `open` writes so that every later command can find the same browser. */
export interface SessionInfo {
  name: string;
  /** Title passed to `browser.bind()`. playwright-cli attaches to the browser by this title. */
  title: string;
  /** Endpoint returned by `browser.bind()`. po-cli commands connect here with `chromium.connect()`. */
  endpoint: string;
  /** PID of the host process that owns the browser. */
  pid: number;
  baseURL?: string;
}

export function browserTitle(name: string): string {
  return name === DEFAULT_SESSION ? 'po-cli' : `po-cli-${name}`;
}

export function sessionFile(name: string): string {
  return path.join(HOME, 'sessions', `${name}.json`);
}

/** The host polls for this file and shuts the browser down cleanly when it appears. */
export function stopFile(name: string): string {
  return path.join(HOME, 'sessions', `${name}.stop`);
}

export function logFile(name: string): string {
  return path.join(HOME, 'logs', `${name}.log`);
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function readSession(name: string): SessionInfo | undefined {
  const file = sessionFile(name);
  if (!fs.existsSync(file)) return undefined;
  const info = JSON.parse(fs.readFileSync(file, 'utf-8')) as SessionInfo;
  if (!isAlive(info.pid)) {
    removeSession(name);
    return undefined;
  }
  return info;
}

export function writeSession(info: SessionInfo): void {
  fs.mkdirSync(path.dirname(sessionFile(info.name)), { recursive: true });
  fs.writeFileSync(sessionFile(info.name), JSON.stringify(info, null, 2));
}

export function removeSession(name: string): void {
  fs.rmSync(sessionFile(name), { force: true });
  fs.rmSync(stopFile(name), { force: true });
}

export function requireSession(name: string): SessionInfo {
  const info = readSession(name);
  if (!info) {
    const flag = name === DEFAULT_SESSION ? '' : ` -s=${name}`;
    throw new Error(`Session '${name}' is not open. Run \`po-cli${flag} open\` first.`);
  }
  return info;
}
