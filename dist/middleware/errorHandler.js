"use strict";
/**
 * Global Error Handler Middleware
 *
 * Express catches errors thrown in route handlers (or passed via next(err))
 * and routes them here. This centralised handler ensures:
 *   - Consistent JSON error responses.
 *   - No stack traces leaked in production.
 *   - Proper HTTP status codes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
/** Custom application error — add a statusCode to any Error */
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/** Central error-handling middleware (must have 4 args for Express to recognise it) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    // Known application error
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }
    // Unknown / unexpected error
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
    });
}
/** Async wrapper — catches promise rejections and passes them to next(err) */
function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map