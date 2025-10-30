import { Router } from "express";
import jwt, { SignOptions } from "jsonwebtoken";

const router = Router();

router.post("/token", (req, res) => {
  const { service } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
  const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as any) || "1h"; 

  if (!service) {
    return res.status(400).json({ error: "Missing service name" });
  }

  try {
    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    const token = jwt.sign({ service }, JWT_SECRET, signOptions);
    res.json({ token });
  } catch (err) {
    console.error("Error generating JWT:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
