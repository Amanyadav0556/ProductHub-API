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

import { Request, Response, NextFunction } from "express";
import { getProducts } from "../services/productService";
import { GetProductsQuery } from "../middleware/validateRequest";

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
export async function getProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.query is already validated and coerced by validateGetProducts middleware
    const { limit, category, cursor } = req.query as unknown as GetProductsQuery;

    const result = await getProducts({ limit, category, cursor });

    res.status(200).json(result);
  } catch (err) {
    next(err); // Pass to global error handler
  }
}
