import { getDB } from '../../infra/dbClient';
import { OrderSummary, CreateOrderInput, IOrdersRepository } from '../../core/ports/IordersRepository';
import { ProductsRepository } from './ProductsRepository'


export class OrdersRepository implements IOrdersRepository {
  
    private products = new ProductsRepository()

    async createOrder(input: CreateOrderInput): Promise<OrderSummary> {
        
        const db = await getDB()
        const conn = await db.getConnection()

        try {
            await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
            await conn.beginTransaction()

            const [ordRes]: any = await conn.query(
                "INSERT INTO orders (customer_id, status, total_cents) VALUES (?, 'CREATED', 0)",
                [input.customer_id]
            )
            const orderId = ordRes.insertId

            let total = 0

            for (const it of input.items) {
                const price = await this.products.getUnitPriceCents(it.product_id, conn)
                const ok = await this.products.hasStock(it.product_id, it.qty, conn)
               
                if (!ok) throw new Error(`Insufficient stock: product ${it.product_id}`)

                const subtotal = price * it.qty
                total += subtotal

                await conn.query(
                    'INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents) VALUES (?, ?, ?, ?, ?)',
                    [orderId, it.product_id, it.qty, price, subtotal]
                )
                
               await this.products.decStock(it.product_id, it.qty, conn)
            }

            await conn.query('UPDATE orders SET total_cents = ? WHERE id = ?', [total, orderId])
            
            await conn.commit()

            return { 
                id: orderId,
                status: 'CREATED',
                total_cents: total,
                created_at: new Date().toISOString(),                
            }
        
        } catch (e) {
            await conn.rollback()
            console.error('❌ Transaction rolled back due to: ', e)
            throw e
        } finally {
            conn.release()
        }
    }

    async confirmOrder(orderId: number) {
        const db = await getDB()
        await db.query("UPDATE orders SET status = 'CONFIRMED' WHERE id = ? AND status = 'CREATED'", [orderId])
        const [rows]: any = await db.query('SELECT id, status, total_cents FROM orders WHERE id = ?', [orderId])
        if (!rows[0]) throw new Error('Order not found')
        return rows[0]
    }

    async getOrderByIdWithItems(orderId: number): Promise<any> {
        const db = await getDB();
        const [o]: any = await db.query("SELECT id, status, total_cents, created_at FROM orders WHERE id = ?", [orderId]);
        const order = o[0];
        if (!order) return null;
        const [items]: any = await db.query(
            "SELECT product_id, qty, unit_price_cents, subtotal_cents FROM order_items WHERE order_id = ?",
            [orderId]
        );
        return { ...order, items };
    }

    async listOrders(params: { status?: string; from?: string; to?: string; cursor?: number; limit?: number }): Promise<any[]> {
        const db = await getDB()
        const where: string[] = []
        const args: any[] = []

        if (params.status) { 
            where.push("status = ?")
            args.push(params.status)
        }
        if (params.from) {
            where.push("created_at >= ?")
            args.push(params.from) 
        }

        if (params.to) {
            where.push("created_at <= ?")
            args.push(params.to)
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const cursor = params.cursor ?? 0;
        const limit  = params.limit ?? 10;

        const [rows]: any = await db.query(
            `SELECT id, status, total_cents, created_at
            FROM orders ${whereSql}
            ORDER BY id ASC
            LIMIT ?, ?`,
            [...args, cursor, limit]
        );
        return rows;
    }

    async cancelOrder(orderId: number): Promise<any> {
        const db = await getDB();
        const conn = await db.getConnection();
        try {
            await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
            await conn.beginTransaction();

            const [ordRows]: any = await conn.query("SELECT id, status, created_at FROM orders WHERE id = ? FOR UPDATE", [orderId]);
            const order = ordRows[0];
            if (!order) throw new Error("Order not found");

            if (order.status === "CANCELED") {
                await conn.commit();
                return order;
            }

            if (order.status === "CREATED") {
                const [items]: any = await conn.query("SELECT product_id, qty FROM order_items WHERE order_id = ?", [orderId]);
                for (const it of items) {
                    await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [it.qty, it.product_id]);
                }
                await conn.query("UPDATE orders SET status = 'CANCELED' WHERE id = ?", [orderId]);

            } else if (order.status === "CONFIRMED") {
                const diffMin = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60);
                if (diffMin > 10) throw new Error("Too late to cancel a confirmed order");
                await conn.query("UPDATE orders SET status = 'CANCELED' WHERE id = ?", [orderId]);
            }

            const [out]: any = await conn.query("SELECT id, status, total_cents, created_at FROM orders WHERE id = ?", [orderId]);
            await conn.commit();
            return out[0];
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

}
