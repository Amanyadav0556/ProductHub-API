"use strict";
/**
 * Request Validation Middleware (using Zod)
 *
 * Validates incoming query parameters for GET /products.
 * If validation fails, a 400 response is returned immediately.
 * On success, the coerced/validated values replace req.query.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsQuerySchema = void 0;
exports.validateGetProducts = validateGetProducts;
const zod_1 = require("zod");
// ─── Schema ───────────────────────────────────────────────────────────────────
exports.getProductsQuerySchema = zod_1.z.object({
    /**
     * Number of products to return per page.
     * - Must be a positive integer between 1 and 100.
     * - Defaults to 20 when not provided.
     * - z.coerce converts the string query param to a number automatically.
     */
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    /**
     * Optional category filter.
     * - Must be a non-empty string if provided.
     */
    category: zod_1.z
        .string()
        .trim()
        .min(1, "category must not be empty")
        .optional(),
    /**
     * Opaque cursor string returned by the previous response.
     * - Must be a non-empty string if provided.
     */
    cursor: zod_1.z
        .string()
        .trim()
        .min(1, "cursor must not be empty")
        .optional(),
});
// ─── Middleware ───────────────────────────────────────────────────────────────
function validateGetProducts(req, res, next) {
    const result = exports.getProductsQuerySchema.safeParse(req.query);
    if (!result.success) {
        res.status(400).json({
            error: "Invalid query parameters",
            details: result.error.flatten().fieldErrors,
        });
        return;
    }
    // Replace req.query with validated + coerced values
    // (TypeScript hack: req.query is typed as ParsedQs, not our schema)
    req.query = result.data;
    next();
}
//# sourceMappingURL=validateRequest.js.map