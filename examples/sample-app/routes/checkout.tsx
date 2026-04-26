import { Hono } from 'hono';
import { CheckoutPage, CheckoutCompletePage } from '../views/checkout';
import { cartTotal, clearCart, listCart } from '../data/cart';
import { getSession } from '../session';

export const checkoutRoutes = new Hono();

checkoutRoutes.get('/checkout', (c) => {
  const session = getSession(c);
  if (!session) return c.redirect('/login', 302);
  if (listCart(session.sid).length === 0) return c.redirect('/cart', 302);
  const total = cartTotal(session.sid);
  return c.html(<CheckoutPage username={session.username} total={total} />);
});

checkoutRoutes.post('/checkout', async (c) => {
  const session = getSession(c);
  if (!session) return c.redirect('/login', 302);
  const body = await c.req.parseBody();
  const required = ['firstName', 'lastName', 'postalCode'] as const;
  for (const field of required) {
    if (!String(body[field] ?? '').trim()) {
      return c.redirect('/checkout', 302);
    }
  }
  clearCart(session.sid);
  return c.html(<CheckoutCompletePage username={session.username} />);
});
