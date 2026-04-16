import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import productRoutes from "./routes/productsRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Static images
app.use(
  "/images",
  express.static(path.resolve(process.cwd(), "public/images"))
);
// Products API
app.use("/api/products", productRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
