import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { cartRoutes } from './routes/cart';
import { checkoutRoutes } from './routes/checkout';
import { adminRoutes } from './routes/admin';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

app.get('/', (c) => c.redirect('/products', 302));

app.route('/', authRoutes);
app.route('/', productRoutes);
app.route('/', cartRoutes);
app.route('/', checkoutRoutes);
app.route('/', adminRoutes);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono demo app listening on http://localhost:${info.port}`);
});
