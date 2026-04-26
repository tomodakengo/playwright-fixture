import type { APIRequestContext, BrowserContext } from '@playwright/test';
import {
  loginViaApi as baseLoginViaApi,
  switchUser as baseSwitchUser,
  storageStatePath as baseStorageStatePath,
} from '@fixtures/auth';
import { users, type RoleName } from '@examples/test-data/users';

export type { RoleName };

export function storageStatePath(role: RoleName): string {
  return baseStorageStatePath(role);
}

/** Type-safe demo wrapper — pulls credentials from the demo user table. */
export async function loginViaApi(
  request: APIRequestContext,
  context: BrowserContext,
  role: RoleName,
): Promise<void> {
  const { username, password } = users[role];
  await baseLoginViaApi(request, context, { username, password });
}

/** Type-safe demo wrapper. */
export async function switchUser(context: BrowserContext, role: RoleName): Promise<void> {
  await baseSwitchUser(context, role);
}
