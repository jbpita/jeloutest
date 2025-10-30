import { getDB } from "../../infra/dbClient";
import {
  ICustomersRepository,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../../core/ports/ICustomersRepository";


export class CustomersRepository implements ICustomersRepository {
  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    const db = await getDB();
    const [result]: any = await db.query(
      "INSERT INTO customers (name, email, phone, created_at) VALUES (?, ?, ?, NOW())",
      [data.name, data.email, data.phone]
    );
    const [rows]: any = await db.query("SELECT * FROM customers WHERE id = ?", [result.insertId]);
    return rows[0];
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const db = await getDB();
    const [rows]: any = await db.query("SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] || null;
  }

  async updateCustomer(id: number, data: UpdateCustomerInput): Promise<Customer> {
    const db = await getDB();
    await db.query(
      "UPDATE customers SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ? AND deleted_at IS NULL",
      [data.name, data.email, data.phone, id]
    );
    const [rows]: any = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteCustomer(id: number): Promise<void> {
    const db = await getDB();
    await db.query("UPDATE customers SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async searchCustomers(search?: string, cursor: number = 0, limit: number = 10): Promise<Customer[]> {
    const db = await getDB();
    const query = `
      SELECT * FROM customers
      WHERE deleted_at IS NULL
      ${search ? "AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)" : ""}
      ORDER BY id ASC
      LIMIT ?, ?;
    `;
    const params = search
      ? [`%${search}%`, `%${search}%`, `%${search}%`, cursor, limit]
      : [cursor, limit];
    const [rows]: any = await db.query(query, params);
    return rows;
  }
}
