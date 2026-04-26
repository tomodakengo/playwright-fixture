/**
 * Test-side user data. Mirrors `examples/sample-app/data/users.ts` but lives in
 * `examples/test-data/` so the test framework does not import from `examples/sample-app/`.
 *
 * If you change credentials here, change them in `examples/sample-app/data/users.ts` too.
 */

export type Role = 'admin' | 'user';

export type TestUser = {
  username: string;
  password: string;
  role: Role;
  locked?: boolean;
};

export const users = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' as Role },
  standard: { username: 'standard', password: 'standard123', role: 'user' as Role },
  locked: { username: 'locked', password: 'locked123', role: 'user' as Role, locked: true },
} satisfies Record<string, TestUser>;

export type RoleName = keyof typeof users;
