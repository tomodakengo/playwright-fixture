import { Hono } from 'hono';
import { ProductsPage } from '../views/products';
import { products } from '../data/products';
import { getSession } from '../session';

export const productRoutes = new Hono();

productRoutes.get('/products', (c) => {
  const session = getSession(c);
  if (!session) return c.redirect('/login', 302);
  return c.html(<ProductsPage username={session.username} products={products} />);
});
