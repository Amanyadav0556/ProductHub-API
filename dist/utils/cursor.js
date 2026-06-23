"use strict";
/**
 * Cursor Utility
 *
 * Cursor-based pagination needs a "pointer" to the last seen item.
 * We encode { updated_at, id } as a base64url string so it is:
 *   - URL-safe (no padding '=' or special chars from base64)
 *   - Opaque to clients (they just pass it back — no business logic leaks)
 *
 * Sort order: updated_at DESC, id DESC
 * "Next page" condition:
 *   (updated_at < cursor.updated_at)
 *   OR
 *   (updated_at = cursor.updated_at AND id < cursor.id)
 *
 * This guarantees no duplicates and no gaps even when records are inserted
 * or updated while the user is paginating.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
/**
 * Encodes a cursor payload into a base64url string.
 * @param payload - The cursor data to encode.
 * @returns A URL-safe, opaque cursor string.
 */
function encodeCursor(payload) {
    const json = JSON.stringify(payload);
    return Buffer.from(json, "utf-8").toString("base64url");
}
/**
 * Decodes a base64url cursor string back into its payload.
 * @param cursor - The cursor string received from the client.
 * @returns The decoded cursor payload, or null if invalid.
 */
function decodeCursor(cursor) {
    try {
        const json = Buffer.from(cursor, "base64url").toString("utf-8");
        const parsed = JSON.parse(json);
        // Runtime type guard — reject malformed cursors early
        if (typeof parsed !== "object" ||
            parsed === null ||
            typeof parsed.updated_at !== "string" ||
            typeof parsed.id !== "number") {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=cursor.js.map