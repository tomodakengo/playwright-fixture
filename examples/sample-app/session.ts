import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Role } from './data/users';

export const SESSION_COOKIE = 'session';

export type SessionData = {
  sid: string;
  username: string;
  role: Role;
};

function encode(data: SessionData): string {
  return Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
}

function decode(value: string): SessionData | null {
  try {
    const json = Buffer.from(value, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as SessionData;
    if (
      typeof parsed.sid === 'string' &&
      typeof parsed.username === 'string' &&
      (parsed.role === 'admin' || parsed.role === 'user')
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function newSessionId(): string {
  return randomUUID();
}

export function getSession(c: Context): SessionData | null {
  const raw = getCookie(c, SESSION_COOKIE);
  if (!raw) return null;
  return decode(raw);
}

export function startSession(c: Context, data: SessionData): void {
  setCookie(c, SESSION_COOKIE, encode(data), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export function endSession(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
