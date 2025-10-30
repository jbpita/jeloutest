import { getDB } from "../../infra/dbClient"
import { IProductsService, CreateProductInput, UpdateProductInput, Product } from "../../core/ports/IProductsService"

export class ProductsAdminRepository implements IProductsService {
    
    async create(data: CreateProductInput): Promise<Product> {
        const db = await getDB()
        const [r]: any = await db.query(
            "INSERT INTO products (sku, name, price_cents, stock, created_at) VALUES (?, ?, ?, ?, NOW())",
            [data.sku, data.name, data.price_cents, data.stock ?? 0]
        )
        const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [r.insertId])
        return rows[0]
    }

    async update(id: number, data: UpdateProductInput): Promise<Product> {
        const db = await getDB()
        await db.query(
            `UPDATE products
            SET price_cents = COALESCE(?, price_cents),
                stock = COALESCE(?, stock),
                name = COALESCE(?, name)
            WHERE id = ?`,
            [data.price_cents, data.stock, data.name, id]
        )
        const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [id])
        if (!rows[0]) throw new Error("Product not found")
        return rows[0]
    }

    async getById(id: number): Promise<Product | null> {
        const db = await getDB()
        const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [id])
        return rows[0] || null
    }

    async list(search?: string, cursor: number = 0, limit: number = 10): Promise<Product[]> {
        const db = await getDB()
        const q =
        `SELECT * FROM products
        ${search ? "WHERE (name LIKE ? OR sku LIKE ?)" : ""}
        ORDER BY id ASC LIMIT ?, ?`
        const params = search
        ? [`%${search}%`, `%${search}%`, cursor, limit]
        : [cursor, limit]
        const [rows]: any = await db.query(q, params)
        return rows
    }
}
