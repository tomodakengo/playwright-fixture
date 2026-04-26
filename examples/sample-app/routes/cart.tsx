import { Hono } from 'hono';
import { CartPage } from '../views/cart';
import { addToCart, listCart } from '../data/cart';
import { getSession } from '../session';

export const cartRoutes = new Hono();

cartRoutes.get('/cart', (c) => {
  const session = getSession(c);
  if (!session) return c.redirect('/login', 302);
  const items = listCart(session.sid);
  return c.html(<CartPage username={session.username} items={items} />);
});

cartRoutes.post('/cart', async (c) => {
  const session = getSession(c);
  if (!session) return c.redirect('/login', 302);
  const body = await c.req.parseBody();
  const productId = String(body['productId'] ?? '');
  if (productId) addToCart(session.sid, productId);
  return c.redirect('/cart', 302);
});
