import type { Page } from '@playwright/test';

import { App } from '@app-impl';

export class UnknownCommandError extends Error {}

/**
 * Convert a shell argument into the value passed to a PageObject method.
 * - Anything that parses as JSON (numbers, true/false/null, [...], {...}, "...") is parsed.
 * - Everything else stays a string.
 *
 * To pass a numeric-looking value as a string, quote it as JSON: '"123"'.
 */
export function coerceArg(raw: string): unknown {
  if (/^(-?\d|true$|false$|null$|[[{"])/.test(raw)) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function hasMember(value: unknown, key: string): boolean {
  return value !== null && value !== undefined && key in Object(value);
}

/**
 * Walk `login.signIn` from the App facade.
 *
 * App members are factories (`login = () => new LoginPage(page)`). When the next
 * segment is not a property of the function itself, call the factory and keep
 * walking on the PageObject it returns — the same thing `app.login().signIn()`
 * does inside a spec.
 */
export function walk(app: App, segments: string[]): { owner: unknown; target: unknown } {
  let owner: unknown = undefined;
  let current: unknown = app;
  const walked = ['page'];
  for (const segment of segments) {
    if (typeof current === 'function' && !hasMember(current, segment)) {
      current = (current as (...a: unknown[]) => unknown).call(owner);
    }
    if (!hasMember(current, segment)) {
      throw new UnknownCommandError(
        `'${[...walked, segment].join('.')}' was not found. ` +
          `Run \`po-cli help ${walked.join('.')}\` to see what is available.`,
      );
    }
    owner = current;
    current = (current as Record<string, unknown>)[segment];
    walked.push(segment);
  }
  return { owner, target: current };
}

/** Run `page.<path>` against the given Page and return the method's result. */
export async function invoke(command: string, rawArgs: string[], page: Page): Promise<unknown> {
  const [namespace, ...segments] = command.split('.');
  if (namespace !== 'page' || segments.length === 0) {
    throw new UnknownCommandError(`'${command}' must look like page.<area>.<method>.`);
  }
  // The same App the `app` fixture builds — only the Page comes from the shared browser.
  const app = new App(() => page);
  const { owner, target } = walk(app, segments);
  const args = rawArgs.map(coerceArg);
  if (typeof target === 'function') {
    return await (target as (...a: unknown[]) => unknown).apply(owner, args);
  }
  if (args.length > 0) {
    throw new UnknownCommandError(`'${command}' is not a function and takes no arguments.`);
  }
  return target;
}

/** Locators expose `locator()` and `evaluateAll()`; the class itself is not exported. */
function isLocator(value: unknown): boolean {
  const candidate = value as { locator?: unknown; evaluateAll?: unknown } | null | undefined;
  return typeof candidate?.locator === 'function' && typeof candidate.evaluateAll === 'function';
}

/** Strings print as-is, objects as JSON, so `$(po-cli ...)` can feed the next command. */
export function formatResult(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || value === null) return String(value);
  if (isLocator(value)) return String(value);
  const name = value.constructor?.name;
  if (name && name !== 'Object' && name !== 'Array') return `[${name}]`;
  return JSON.stringify(value);
}
