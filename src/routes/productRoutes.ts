/**
 * Product Routes
 *
 * Registers all /products endpoints.
 * Validation middleware runs before the controller on each route.
 */

import { Router } from "express";
import { validateGetProducts } from "../middleware/validateRequest";
import { getProductsHandler } from "../controllers/productController";

const router = Router();

/**
 * GET /products
 *
 * Returns a paginated list of products (cursor-based).
 *
 * Query parameters:
 *   ?limit=20            — items per page (1–100, default 20)
 *   ?category=Electronics — filter by category (optional)
 *   ?cursor=<token>      — pagination cursor from previous response (optional)
 *
 * Examples:
 *   GET /products
 *   GET /products?limit=50
 *   GET /products?category=Books
 *   GET /products?limit=20&category=Electronics&cursor=eyJ1cGRhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIiwiaWQiOjEyM30
 */
router.get("/", validateGetProducts, getProductsHandler);

export default router;
