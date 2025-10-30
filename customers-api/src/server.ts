import express from "express";
import dotenv from "dotenv";
import customersRoutes from "./routers/customersRoutes";
import { mountDocs } from "./doc";
import authRoutes from "./routers/authRoutes";
import testDb from "./routers/testDb";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/api", customersRoutes);
app.use('/api', testDb)
app.use("/api", authRoutes);

mountDocs(app);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(400).json({ error: err?.message || "Bad Request" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () =>
  console.log(`Customers API running on port ${port} — Docs: http://localhost:${port}/docs`)
);
