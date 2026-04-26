import type { FC } from 'hono/jsx';
import { Layout } from './layout';
import type { Product } from '../data/products';

type CartItem = { product: Product; quantity: number };

type CartProps = {
  username: string;
  items: CartItem[];
};

export const CartPage: FC<CartProps> = ({ username, items }) => {
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return (
    <Layout title="Cart" username={username}>
      <h1>Your cart</h1>
      {items.length === 0 ? (
        <p data-testid="empty-cart">Your cart is empty.</p>
      ) : (
        <div data-testid="cart-items">
          {items.map(({ product, quantity }) => (
            <div class="product" data-testid={`cart-item-${product.id}`}>
              <h3>{product.name}</h3>
              <p>
                Qty: <span data-testid={`quantity-${product.id}`}>{quantity}</span>
              </p>
              <p class="price">${(product.price * quantity).toFixed(2)}</p>
            </div>
          ))}
          <p>
            Total: <strong data-testid="cart-total">${total.toFixed(2)}</strong>
          </p>
          <form method="get" action="/checkout">
            <button type="submit">Checkout</button>
          </form>
        </div>
      )}
    </Layout>
  );
};
