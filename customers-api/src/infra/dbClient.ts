import mysql, { Pool } from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

let pool: Pool | null = null

export async function getDB(): Promise<Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectionLimit: 10
    })
  }
  return pool
}
