export type Role = 'admin' | 'user';

export type User = {
  username: string;
  password: string;
  role: Role;
  locked?: boolean;
};

export const users: Record<string, User> = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  standard: { username: 'standard', password: 'standard123', role: 'user' },
  locked: { username: 'locked', password: 'locked123', role: 'user', locked: true },
};

export function findUser(username: string, password: string): User | null {
  const user = Object.values(users).find(
    (u) => u.username === username && u.password === password,
  );
  return user ?? null;
}
