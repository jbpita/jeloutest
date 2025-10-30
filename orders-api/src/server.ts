import express from 'express'
import dotenv from 'dotenv'
import { idempotencyDb } from './middleware/idempotencyDb'
import orderRoutes from './routes/orderRoutes'
import testDb from './routes/testDb'
import { mountDocs } from './docs'

dotenv.config()
const app = express()
app.use(express.json())

// idempotencia ANTES de las rutas mutantes
app.use(idempotencyDb)

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api', testDb)
app.use('/api', orderRoutes)

// Swagger UI en /docs
mountDocs(app);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err)
  res.status(400).json({ error: err?.message || 'Bad Request' })
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => console.log(`API Orders listening on ${port}`))
