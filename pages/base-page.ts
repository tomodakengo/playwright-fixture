import type { Page } from '@playwright/test';

/**
 * Base class for every PageObject.
 *
 * Conventions enforced by example:
 * - constructor takes a single `Page` and stores it as `protected readonly page`
 * - every concrete page implements `goto()` so tests can land on it cleanly
 * - locators are exposed as `readonly` getters using role/label/test-id, never
 *   raw CSS/XPath selector strings
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  abstract goto(): Promise<void>;
}
