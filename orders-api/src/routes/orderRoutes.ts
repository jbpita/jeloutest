import { Router } from 'express'
import { fetchCustomerOrThrow } from '../infra/customersClient'
import { OrdersRepository } from '../adapters/repositories/OrdersRepository'
import { ProductsAdminRepository } from '../adapters/repositories/ProductsAdminRepository'
import { CreateOrderUseCase } from '../core/useCases/CreateOrderUseCase'
import { ConfirmOrderUseCase } from '../core/useCases/ConfirmOrderUseCase'

const router = Router()
const repo = new OrdersRepository()
const productsAdmin = new ProductsAdminRepository()
const createUC = new CreateOrderUseCase(repo)
const confirmUC = new ConfirmOrderUseCase(repo)

// -------- orders --------

router.post('/orders/:id/confirm', async (req, res, next) => {
    try {
        const id = Number(req.params.id)
        const result = await confirmUC.execute(id)
        res.json(result)
    } catch (e) { 
        next(e) 
    }
})

router.post("/orders/:id/cancel", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const out = await repo.cancelOrder(id);
        res.json(out);
    } catch (e: any) {
        if (e.message === "Too late to cancel a confirmed order")
        return res.status(400).json({ error: e.message });
        next(e);
    }
})

router.get("/orders/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const o = await repo.getOrderByIdWithItems(id);
        if (!o) return res.status(404).json({ error: "Order not found" });
        res.json(o);
    } catch (e) { next(e); }
})

router.get("/orders", async (req, res, next) => {
    try {
        const { status, from, to, cursor, limit } = req.query

        const list = await repo.listOrders({
            status: status as string | undefined,
            from: from as string | undefined,
            to: to as string | undefined,
            cursor: cursor ? Number(cursor) : 0,
            limit: limit ? Number(limit) : 10
        })

        res.json(list)
    } catch (e) { next(e); }
})

router.post("/orders", async (req, res, next) => {
    try {
        const { customer_id, items } = req.body || {};
        if (!customer_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid payload: customer_id and items[]" });
        }

        await fetchCustomerOrThrow(Number(customer_id));

        const created = await createUC.execute({ customer_id, items });
        return res.status(201).json(created);
    } catch (e) { next(e); }
})

// -------- products (admin) --------

router.post("/products", async (req, res, next) => {
  try {
    const { sku, name, price_cents, stock } = req.body || {};
    if (!sku || !name || typeof price_cents !== "number") {
      return res.status(400).json({ error: "sku, name, price_cents required" });
    }
    const p = await productsAdmin.create({ sku, name, price_cents, stock });
    res.status(201).json(p);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "sku must be unique" });
    next(e);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { price_cents, stock, name } = req.body || {};
    const p = await productsAdmin.update(id, { price_cents, stock, name });
    res.json(p);
  } catch (e) { next(e); }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const p = await productsAdmin.getById(id);
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json(p);
  } catch (e) { next(e); }
});

router.get("/products", async (req, res, next) => {
  try {
    const { search, cursor, limit } = req.query;
    const list = await productsAdmin.list(search as string, Number(cursor) || 0, Number(limit) || 10);
    res.json(list);
  } catch (e) { next(e); }
});


export default router
