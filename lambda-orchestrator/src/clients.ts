import axios from 'axios'
import jwt from 'jsonwebtoken'

const CUSTOMERS_API_BASE = process.env.CUSTOMERS_API_BASE!
const ORDERS_API_BASE = process.env.ORDERS_API_BASE!
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key'

export interface Customer {
    id: number,
    name: string,
    email: string,
    phone: string,
    created_at?: string,
}

export interface CreateOrderResp {
    id: number,
    status: 'CREATED' | 'CONFIRMED' | 'CANCELED',
    total_cents: number,
    created_at?: string,
}

export interface itemProduct {
    product_id: number;
    qty: number;
}

export interface CreateOrderReq {
    customer_id: number;
    items: Array<itemProduct>
}


export interface OrderDetail extends CreateOrderResp {
    items: Array<{ product_id: number,
    qty: number,
    unit_price_cents: number,
    subtotal_cents: number }>,
}

function internalToken() {
  return jwt.sign({
        service: 'lambda-orchestrator'
    },
    JWT_SECRET,
    {
        expiresIn: '5m' as any
    })
}

export async function fetchCustomerOrThrow(
    customerId: number,
    correlationId?: string
): Promise<Customer> {
    
    const token = internalToken()
    const url = `${CUSTOMERS_API_BASE}/internal/customers/${customerId}`
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (correlationId) headers['X-Correlation-Id'] = correlationId

    try {
        const { data } = await axios.get(
                                    url,
                                    {
                                        headers, timeout: 5000
                                    })
        return data
    } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) throw new Error('Customer not found')
        if (status === 401) throw new Error('Unauthorized to Customers API')
        throw new Error('Customers API unavailable')
    }
}

export async function createOrder(
    input: CreateOrderReq,
    correlationId?: string
): Promise<CreateOrderResp> {
    const url = `${ORDERS_API_BASE}/orders`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    
    if (correlationId) headers['X-Correlation-Id'] = correlationId

    const { data } = await axios.post(url, input, { headers, timeout: 7000 })
    return data
}

export async function getOrderWithItems(
    orderId: number,
    correlationId?: string
): Promise<OrderDetail> {
    const url = `${ORDERS_API_BASE}/orders/${orderId}`
    const headers: Record<string, string> = {}
    if (correlationId) headers['X-Correlation-Id'] = correlationId

    const { data } = await axios.get(url, { headers, timeout: 5000 })
    return data
}

export async function confirmOrder(
    orderId: number,
    idempotencyKey: string,
    correlationId?: string
): Promise<CreateOrderResp> {
    const url = `${ORDERS_API_BASE}/orders/${orderId}/confirm`;
    const headers: Record<string, string> = { 'X-Idempotency-Key': idempotencyKey };
    
    if (correlationId) headers['X-Correlation-Id'] = correlationId;

    const { data } = await axios.post(url, null, { headers, timeout: 7000 });
    return data;
}
