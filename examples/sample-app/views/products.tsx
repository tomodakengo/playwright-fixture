import type { FC } from 'hono/jsx';
import { Layout } from './layout';
import type { Product } from '../data/products';

type ProductsProps = {
  username: string;
  products: Product[];
};

export const ProductsPage: FC<ProductsProps> = ({ username, products }) => {
  return (
    <Layout title="Products" username={username}>
      <h1>Products</h1>
      <div data-testid="product-list">
        {products.map((p) => (
          <div class="product" data-testid={`product-${p.id}`}>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p class="price" data-testid={`price-${p.id}`}>
              ${p.price.toFixed(2)}
            </p>
            <form method="post" action="/cart">
              <input type="hidden" name="productId" value={p.id} />
              <button type="submit" aria-label={`Add ${p.name} to cart`}>
                Add to cart
              </button>
            </form>
          </div>
        ))}
      </div>
    </Layout>
  );
};
