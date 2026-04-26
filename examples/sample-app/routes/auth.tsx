import { Hono } from 'hono';
import { LoginPage } from '../views/login';
import { findUser } from '../data/users';
import { startSession, endSession, getSession, newSessionId } from '../session';
import { clearCart } from '../data/cart';

export const authRoutes = new Hono();

authRoutes.get('/login', (c) => {
  if (getSession(c)) return c.redirect('/products', 302);
  return c.html(<LoginPage />);
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const username = String(body['username'] ?? '');
  const password = String(body['password'] ?? '');
  const user = findUser(username, password);
  if (!user) {
    c.status(401);
    return c.html(<LoginPage error="Invalid username or password." />);
  }
  if (user.locked) {
    c.status(403);
    return c.html(<LoginPage error="This account has been locked." />);
  }
  startSession(c, { sid: newSessionId(), username: user.username, role: user.role });
  return c.redirect('/products', 302);
});

authRoutes.post('/api/login', async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { username?: unknown; password?: unknown }
    | null;
  const username = String(body?.username ?? '');
  const password = String(body?.password ?? '');
  const user = findUser(username, password);
  if (!user) {
    return c.json({ ok: false, error: 'invalid credentials' }, 401);
  }
  if (user.locked) {
    return c.json({ ok: false, error: 'account locked' }, 403);
  }
  startSession(c, { sid: newSessionId(), username: user.username, role: user.role });
  return c.json({ ok: true, username: user.username, role: user.role });
});

authRoutes.post('/logout', (c) => {
  const session = getSession(c);
  if (session) clearCart(session.sid);
  endSession(c);
  return c.redirect('/login', 302);
});

authRoutes.post('/api/logout', (c) => {
  const session = getSession(c);
  if (session) clearCart(session.sid);
  endSession(c);
  return c.json({ ok: true });
});
