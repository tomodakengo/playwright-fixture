import type { Page } from '@playwright/test';

import { App } from '@app-impl';
import { App as BaseApp } from '@fixtures/app';
import { BasePage } from '@pages/base-page';

import { walk } from './resolver';

/**
 * A fake Page used to build PageObjects without a browser. PageObject
 * constructors only chain locator builders (`page.getByRole(...)`), so
 * returning itself for every property access and call is enough.
 */
const STUB: Page = new Proxy(() => undefined, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    if (prop === Symbol.toPrimitive) return () => '';
    return STUB;
  },
  apply: () => STUB,
}) as unknown as Page;

/** Stop at these classes so framework internals do not show up as commands. */
const STOP_PROTOTYPES = new Set<unknown>([
  Object.prototype,
  Function.prototype,
  BasePage.prototype,
  BaseApp.prototype,
]);

/** Constructor plumbing of App / BasePage, not commands. */
const HIDDEN_KEYS = new Set(['page', 'getPage']);

export interface CatalogEntry {
  path: string;
  kind: 'method' | 'group';
  signature?: string;
}

function signatureOf(fn: (...args: unknown[]) => unknown): string {
  const source = Function.prototype.toString.call(fn);
  const bareArrow = source.match(/^(?:async\s+)?([\w$]+)\s*=>/);
  if (bareArrow) return bareArrow[1] ?? '';
  const params = source.match(/^[^(]*\(([^)]*)\)/)?.[1] ?? '';
  return params
    .split(',')
    .map((param) => param.replace(/[:=].*/s, '').trim())
    .filter(Boolean)
    .join(' ');
}

/** `login = () => new LoginPage(page)` — a factory with no parameters. */
function isFactory(fn: (...args: unknown[]) => unknown): boolean {
  return fn.length === 0 && !fn.prototype && fn.constructor.name !== 'AsyncFunction';
}

function prototypeMethods(instance: object): string[] {
  const names = new Set<string>();
  for (let proto = Object.getPrototypeOf(instance); proto; proto = Object.getPrototypeOf(proto)) {
    if (STOP_PROTOTYPES.has(proto)) break;
    for (const name of Object.getOwnPropertyNames(proto)) {
      // Read via the descriptor: evaluating a getter on the prototype would throw.
      const { value } = Object.getOwnPropertyDescriptor(proto, name) ?? {};
      if (name !== 'constructor' && typeof value === 'function') names.add(name);
    }
  }
  return [...names];
}

function childrenOf(node: unknown): CatalogEntry[] {
  let instance = node;
  if (typeof node === 'function') {
    try {
      instance = (node as () => unknown)();
    } catch {
      return [];
    }
  }
  if (instance === null || typeof instance !== 'object') return [];

  const entries: CatalogEntry[] = [];
  for (const [key, value] of Object.entries(instance)) {
    if (HIDDEN_KEYS.has(key) || key.startsWith('_') || value === STUB) continue;
    if (typeof value === 'function') {
      const fn = value as (...a: unknown[]) => unknown;
      entries.push(
        isFactory(fn)
          ? { path: key, kind: 'group' }
          : { path: key, kind: 'method', signature: signatureOf(fn) },
      );
    } else if (typeof value === 'object' && value !== null) {
      entries.push({ path: key, kind: 'group' });
    }
  }
  for (const name of prototypeMethods(instance)) {
    const fn = (instance as Record<string, (...a: unknown[]) => unknown>)[name];
    if (fn) entries.push({ path: name, kind: 'method', signature: signatureOf(fn) });
  }
  return entries;
}

/** List what can be called under `prefix` (e.g. `page`, `page.login`). */
export function catalog(prefix: string): CatalogEntry[] {
  const [namespace, ...segments] = (prefix || 'page').split('.');
  if (namespace !== 'page')
    throw new Error(`Only the 'page' namespace exists (got '${namespace}').`);
  const app = new App(() => STUB);
  const { target } = walk(app, segments);
  const base = ['page', ...segments].join('.');
  return childrenOf(target)
    .map((entry) => ({ ...entry, path: `${base}.${entry.path}` }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function renderCatalog(entries: CatalogEntry[]): string {
  return entries
    .map((entry) =>
      entry.kind === 'group'
        ? `  ${entry.path}.*`
        : `  ${entry.path}${entry.signature ? ` ${entry.signature}` : ''}`,
    )
    .join('\n');
}
