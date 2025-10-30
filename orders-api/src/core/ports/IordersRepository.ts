export interface OrderItemInput {
  product_id: number;
  qty: number;
}

export interface CreateOrderInput {
  customer_id: number;
  items: OrderItemInput[];
}

export interface OrderSummary {
  id: number;
  status: "CREATED" | "CONFIRMED" | "CANCELED";
  total_cents: number;
  created_at: string;
}

export interface OrderDetail extends OrderSummary {
  items: Array<{ product_id: number; qty: number; unit_price_cents: number; subtotal_cents: number }>;
}

export interface IOrdersRepository {
  createOrder(input: CreateOrderInput): Promise<OrderSummary>;
  confirmOrder(orderId: number): Promise<OrderSummary>;
  cancelOrder(orderId: number): Promise<OrderSummary>;
  getOrderByIdWithItems(orderId: number): Promise<OrderDetail | null>;
  listOrders(params: { status?: string; from?: string; to?: string; cursor?: number; limit?: number }): Promise<OrderSummary[]>;
}