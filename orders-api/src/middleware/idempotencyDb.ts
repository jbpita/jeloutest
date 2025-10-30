import {
    Request,
    Response,
    NextFunction
} from 'express'
import { getDB } from '../infra/dbClient'

const TTL_HOURS = Number(process.env.IDEMPOTENCY_TTL_HOURS || 24)

export async function idempotencyDb(req: Request, res: Response, next: NextFunction) {
    
    const m = req.method.toUpperCase()
    
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(m)) return next()

    const key = req.header("X-Idempotency-Key")
    
    if (!key) return next()

    const db = await getDB()
    
    const [rows]: any = await db.query(
        "SELECT status, response_body FROM idempotency_keys WHERE `key` = ? AND (expires_at IS NULL OR expires_at > NOW())",
        [key]
    )
    
    if (rows[0]) {
        const status = rows[0].status === "SUCCESS" ? 200 : 400
        return res.status(status).json(rows[0].response_body || {})
    }

    const origJson = res.json.bind(res) as (body?: any) => Response

    res.json = function (this: Response, body?: any): Response {
        db.query(
            "INSERT INTO idempotency_keys (`key`, target_type, target_id, status, response_body, created_at, expires_at) VALUES (?, ?, ?, ?, CAST(? AS JSON), NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR))",
            [
                key,
                req.baseUrl || "ORDER",
                (req.params as any)?.id ? Number((req.params as any).id) : null,
                res.statusCode >= 200 && res.statusCode < 300 ? "SUCCESS" : "FAILED",
                JSON.stringify(body ?? {}),
                TTL_HOURS
            ]
        ).catch(() => {})

        return origJson(body)
    }

    next()
}
