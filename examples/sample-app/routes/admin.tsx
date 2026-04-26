import { Hono } from 'hono';
import { AdminPage } from '../views/admin';
import { getSession } from '../session';

export const adminRoutes = new Hono();

adminRoutes.get('/admin', (c) => {
  const session = getSession(c);
  if (!session) return c.redirect('/login', 302);
  if (session.role !== 'admin') {
    c.status(403);
    return c.text('Forbidden: admin role required', 403);
  }
  return c.html(<AdminPage username={session.username} />);
});
