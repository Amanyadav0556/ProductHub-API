"use strict";
/**
 * Product Routes
 *
 * Registers all /products endpoints.
 * Validation middleware runs before the controller on each route.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateRequest_1 = require("../middleware/validateRequest");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
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
router.get("/", validateRequest_1.validateGetProducts, productController_1.getProductsHandler);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map