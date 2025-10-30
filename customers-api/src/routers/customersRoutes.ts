import { Router } from "express";
import { CustomersRepository } from "../adapters/repositories/CustomersRepository";
import { CreateCustomerUseCase } from "../core/useCases/CreateCustomerUseCase";
import { GetCustomerUseCase } from "../core/useCases/GetCustomerUseCase";
import { UpdateCustomerUseCase } from "../core/useCases/UpdateCustomerUseCase";
import { DeleteCustomerUseCase } from "../core/useCases/DeleteCustomerUseCase";
import { SearchCustomersUseCase } from "../core/useCases/SearchCustomersUseCase";
import { authJwt } from "../middleware/authJwt";


const router = Router();
const repo = new CustomersRepository();

const createUC = new CreateCustomerUseCase(repo);
const getUC = new GetCustomerUseCase(repo);
const updateUC = new UpdateCustomerUseCase(repo);
const deleteUC = new DeleteCustomerUseCase(repo);
const searchUC = new SearchCustomersUseCase(repo);

router.post("/customers", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: "name and email are required" });
    const created = await createUC.execute({ name, email, phone });
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "email must be unique" });
    }
    next(e);
  }
});

// GET /customers/:id
router.get("/customers/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const customer = await getUC.execute(id);
    res.json(customer);
  } catch (e: any) {
    if (e.message === "Customer not found") return res.status(404).json({ error: e.message });
    next(e);
  }
});

// GET /customers?search=&cursor=&limit=
router.get("/customers", async (req, res, next) => {
  try {
    const { search, cursor, limit } = req.query;
    const result = await searchUC.execute(
      search as string,
      cursor ? Number(cursor) : 0,
      limit ? Number(limit) : 10
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put("/customers/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone } = req.body || {};
    const updated = await updateUC.execute(id, { name, email, phone });
    res.json(updated);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "email must be unique" });
    }
    next(e);
  }
});

router.delete("/customers/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await deleteUC.execute(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get("/internal/customers/:id", authJwt, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const customer = await getUC.execute(id);
    res.json(customer);
  } catch (e: any) {
    if (e.message === "Customer not found") return res.status(404).json({ error: e.message });
    next(e);
  }
});

export default router;
