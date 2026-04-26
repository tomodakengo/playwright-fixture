import { findProduct, type Product } from './products';

type CartItem = { product: Product; quantity: number };

const carts = new Map<string, Map<string, number>>();

function getCart(sid: string): Map<string, number> {
  let cart = carts.get(sid);
  if (!cart) {
    cart = new Map();
    carts.set(sid, cart);
  }
  return cart;
}

export function addToCart(sid: string, productId: string): void {
  if (!findProduct(productId)) return;
  const cart = getCart(sid);
  cart.set(productId, (cart.get(productId) ?? 0) + 1);
}

export function listCart(sid: string): CartItem[] {
  const cart = getCart(sid);
  const items: CartItem[] = [];
  for (const [id, quantity] of cart) {
    const product = findProduct(id);
    if (product) items.push({ product, quantity });
  }
  return items;
}

export function clearCart(sid: string): void {
  carts.delete(sid);
}

export function cartTotal(sid: string): number {
  return listCart(sid).reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}
