"use strict";
/**
 * Product Controller
 *
 * Thin layer between routes and the service layer.
 * Responsibilities:
 *   - Extract validated query parameters from the request.
 *   - Call the service function.
 *   - Send the HTTP response.
 *
 * No business logic lives here — that belongs in the service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsHandler = getProductsHandler;
const productService_1 = require("../services/productService");
/**
 * GET /products
 *
 * Query params (validated by middleware before this runs):
 *   - limit    (number, 1–100, default 20)
 *   - category (string, optional)
 *   - cursor   (string, opaque base64url, optional)
 *
 * Response:
 *   { data: Product[], nextCursor: string | null, hasMore: boolean }
 */
async function getProductsHandler(req, res, next) {
    try {
        // req.query is already validated and coerced by validateGetProducts middleware
        const { limit, category, cursor } = req.query;
        const result = await (0, productService_1.getProducts)({ limit, category, cursor });
        res.status(200).json(result);
    }
    catch (err) {
        next(err); // Pass to global error handler
    }
}
//# sourceMappingURL=productController.js.map