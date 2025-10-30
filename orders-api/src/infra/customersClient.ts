import axios from 'axios'
import jwt from 'jsonwebtoken'

const CUSTOMERS_API_URL = process.env.CUSTOMERS_API_URL || 'http://customers-api:3000/api'
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key'

function getInternalToken() {
  return jwt.sign({ service: "orders-service" }, JWT_SECRET, { expiresIn: "5m" as any })
}

export async function fetchCustomerOrThrow(customerId: number) {
    const token = getInternalToken()
    const url = `${CUSTOMERS_API_URL}/internal/customers/${customerId}`
    try {
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return data
    } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) throw new Error('Customer not found')
        if (status === 401) throw new Error('Unauthorized to Customers API')
        throw new Error('Customers API unavailable')
    } 
}
