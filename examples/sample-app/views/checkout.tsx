import type { FC } from 'hono/jsx';
import { Layout } from './layout';

type CheckoutProps = {
  username: string;
  total: number;
};

export const CheckoutPage: FC<CheckoutProps> = ({ username, total }) => {
  return (
    <Layout title="Checkout" username={username}>
      <h1>Checkout</h1>
      <p>
        Total to charge: <strong data-testid="checkout-total">${total.toFixed(2)}</strong>
      </p>
      <form method="post" action="/checkout">
        <label>
          First name
          <input type="text" name="firstName" required />
        </label>
        <label>
          Last name
          <input type="text" name="lastName" required />
        </label>
        <label>
          Postal code
          <input type="text" name="postalCode" required />
        </label>
        <button type="submit">Place order</button>
      </form>
    </Layout>
  );
};

export const CheckoutCompletePage: FC<{ username: string }> = ({ username }) => {
  return (
    <Layout title="Order complete" username={username}>
      <h1 data-testid="order-confirmation">Thank you for your order!</h1>
      <p>Your order has been placed.</p>
      <a href="/products">Continue shopping</a>
    </Layout>
  );
};
