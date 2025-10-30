export interface Product {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
  stock: number;
  created_at: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price_cents: number;
  stock?: number;
}

export interface UpdateProductInput {
  price_cents?: number;
  stock?: number;
  name?: string;
}

export interface IProductsService {
  create(data: CreateProductInput): Promise<Product>;
  update(id: number, data: UpdateProductInput): Promise<Product>;
  getById(id: number): Promise<Product | null>;
  list(search?: string, cursor?: number, limit?: number): Promise<Product[]>;
}
