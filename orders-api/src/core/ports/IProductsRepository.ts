export interface IProductsRepository {
  getUnitPriceCents(productId: number): Promise<number>;
  hasStock(productId: number, qty: number): Promise<boolean>;
  decStock(productId: number, qty: number): Promise<void>;
}
