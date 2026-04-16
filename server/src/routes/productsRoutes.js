import express from "express";
import products from "../data/products.js";

const router = express.Router();

/**
 * GET /api/products
 * Get all products
 */
router.get("/", (req, res) => {
  res.status(200).json(products);
});

/**
 * GET /api/products/category/:category
 * Get products by category (tshirts | shorts)
 */
router.get("/category/:category", (req, res) => {
  const { category } = req.params;

  const filteredProducts = products.filter(
    product => product.category === category
  );

  if (filteredProducts.length === 0) {
    return res.status(404).json({
      message: `No products found for category: ${category}`
    });
  }

  res.status(200).json(filteredProducts);
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const product = products.find(
    product => product.id === Number(id)
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.status(200).json(product);
});

/**
 * GET /api/products/:id/availability
 * Check available sizes and stock
 */
router.get("/:id/availability", (req, res) => {
  const { id } = req.params;

  const product = products.find(
    product => product.id === Number(id)
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.status(200).json({
    sizes: product.sizes,
    stock: product.stock
  });
});

export default router;