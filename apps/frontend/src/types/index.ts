export interface SizeOption {
  name: string;
  priceDelta: number;
}

export interface ToppingOption {
  name: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
  inStock: boolean;
  version: number;
}

export interface ProductsResponse {
  items: Product[];
  options: {
    sizes: SizeOption[];
    toppings: ToppingOption[];
  };
}

export interface CartItem {
  id: string; // Hash: `${productId}_${size}_${toppings.sort().join('_')}`
  productId: string;
  name: string;
  imageUrl: string;
  size: string;
  toppings: string[];
  unitPrice: number;
  qty: number;
  lineTotal: number;
}
