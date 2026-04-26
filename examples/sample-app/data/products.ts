export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export const products: Product[] = [
  {
    id: 'backpack',
    name: 'Sauce Labs Backpack',
    price: 29.99,
    description: 'Carry-all backpack for daily use.',
  },
  {
    id: 'bike-light',
    name: 'Sauce Labs Bike Light',
    price: 9.99,
    description: 'Bright LED light for night rides.',
  },
  {
    id: 't-shirt',
    name: 'Sauce Labs T-Shirt',
    price: 15.99,
    description: 'Soft cotton tee, gender-neutral.',
  },
];

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
