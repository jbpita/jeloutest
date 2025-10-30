import { Router } from 'express'
import { getDB } from '../infra/dbClient'


const router = Router()

router.get('/db-test', async (req, res, next) => {
    try {
        const db = await getDB()
        const [rows]: any = await db.query("SELECT DATABASE() AS db, NOW() AS now")
        res.json(rows[0]);
    } catch (e) {
        next(e)
    }
})

export default router