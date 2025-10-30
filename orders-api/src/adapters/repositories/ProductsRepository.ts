import { getDB } from '../../infra/dbClient'
import { IProductsRepository } from '../../core/ports/IProductsRepository'
import { PoolConnection } from 'mysql2/promise'

export class ProductsRepository implements IProductsRepository {
  
    async getUnitPriceCents(productId: number, conn?: PoolConnection): Promise<number> {
        const db = conn || (await getDB())
        const [rows]: any = await db.query('SELECT price_cents FROM products WHERE id = ? FOR UPDATE', [productId])
        if (!rows[0]) throw new Error('Product not found')
        return rows[0].price_cents
    }
    
    async hasStock(productId: number, qty: number, conn?: PoolConnection): Promise<boolean> {
        const db = conn || (await getDB())
        const [rows]: any = await db.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [productId])
        if (!rows[0]) throw new Error('Product not found')
        return rows[0].stock >= qty
    }
    
    async decStock(productId: number, qty: number, conn?: PoolConnection): Promise<void> {
        const db = conn || (await getDB())
        const [res]: any = await db.query(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [qty, productId, qty]
        )
        if (res.affectedRows !== 1) throw new Error('Insufficient stock or product not found')
    }

}
