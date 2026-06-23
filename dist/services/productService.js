"use strict";
/**
 * Product Service
 *
 * Contains all business logic for the products domain.
 * Controllers call service methods; services call the DB via Prisma.
 *
 * ─── Cursor Pagination Design ────────────────────────────────────────────────
 *
 * Sort order: updated_at DESC, id DESC
 *
 * Why composite cursor?
 *   updated_at alone is NOT unique — many products can share the same timestamp.
 *   Adding `id` as a tiebreaker makes the cursor deterministic and stable.
 *
 * "Next page" WHERE clause:
 *   (updated_at < cursor.updated_at)
 *   OR
 *   (updated_at = cursor.updated_at AND id < cursor.id)
 *
 * This is mathematically equivalent to: "give me all rows that come after
 * (cursor.updated_at, cursor.id) when sorted DESC".
 *
 * Why NOT OFFSET?
 *   OFFSET requires the DB to scan and discard N rows. At large offsets (e.g.,
 *   page 5000 with limit 20 → OFFSET 100000), performance degrades to O(N).
 *   Cursor pagination is always O(log N) thanks to the B-tree index.
 *   Also, OFFSET is unstable: if a row is inserted/deleted while the user is
 *   browsing, they may see duplicates or skip items.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
const database_1 = __importDefault(require("../config/database"));
const cursor_1 = require("../utils/cursor");
const errorHandler_1 = require("../middleware/errorHandler");
// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Builds the Prisma WHERE clause combining optional category filter
 * and the cursor condition.
 */
function buildWhereClause(category, cursorPayload) {
    const conditions = [];
    // Category filter — uses the composite index (category, updated_at DESC, id DESC)
    if (category) {
        conditions.push({ category });
    }
    // Cursor condition — implements "rows after the cursor" for DESC sort
    if (cursorPayload) {
        const cursorDate = new Date(cursorPayload.updated_at);
        conditions.push({
            OR: [
                // Case 1: updated_at is strictly less than cursor's updated_at
                { updated_at: { lt: cursorDate } },
                // Case 2: same updated_at, but id is strictly less (tiebreaker for DESC)
                {
                    updated_at: { equals: cursorDate },
                    id: { lt: cursorPayload.id },
                },
            ],
        });
    }
    // Combine conditions with AND
    if (conditions.length === 0)
        return {};
    if (conditions.length === 1)
        return conditions[0];
    return { AND: conditions };
}
/** Converts a Prisma Product row to a serialized, JSON-safe format */
function serialize(product) {
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price.toFixed(2), // e.g., "19.99"
        created_at: product.created_at.toISOString(),
        updated_at: product.updated_at.toISOString(),
    };
}
// ─── Service Functions ────────────────────────────────────────────────────────
/**
 * Fetches a page of products using cursor-based pagination.
 *
 * @param params - Query parameters (limit, category, cursor).
 * @returns Paginated result with serialized products, nextCursor, and hasMore.
 */
async function getProducts(params) {
    const { limit, category, cursor } = params;
    // Decode the opaque cursor string into { updated_at, id }
    let cursorPayload = null;
    if (cursor) {
        cursorPayload = (0, cursor_1.decodeCursor)(cursor);
        if (!cursorPayload) {
            // Invalid cursor — client sent a tampered or stale token
            throw new errorHandler_1.AppError(400, "Invalid or expired cursor.");
        }
    }
    // Fetch limit + 1 rows: the extra row tells us if there is a next page.
    // We never return the extra row to the client.
    const take = limit + 1;
    const rows = await database_1.default.product.findMany({
        where: buildWhereClause(category, cursorPayload),
        orderBy: [
            { updated_at: "desc" },
            { id: "desc" },
        ],
        take,
        // Select only the fields we need (avoids over-fetching)
        select: {
            id: true,
            name: true,
            category: true,
            price: true,
            created_at: true,
            updated_at: true,
        },
    });
    // Determine whether there is a next page
    const hasMore = rows.length === take;
    // Remove the extra sentinel row before returning
    if (hasMore)
        rows.pop();
    // Build the cursor from the last item in the current page
    const lastRow = rows[rows.length - 1];
    const nextCursor = hasMore && lastRow
        ? (0, cursor_1.encodeCursor)({
            updated_at: lastRow.updated_at.toISOString(),
            id: lastRow.id,
        })
        : null;
    return {
        data: rows.map(serialize),
        nextCursor,
        hasMore,
    };
}
//# sourceMappingURL=productService.js.map