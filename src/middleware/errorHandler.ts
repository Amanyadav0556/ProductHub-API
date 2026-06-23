/**
 * Global Error Handler Middleware
 *
 * Express catches errors thrown in route handlers (or passed via next(err))
 * and routes them here. This centralised handler ensures:
 *   - Consistent JSON error responses.
 *   - No stack traces leaked in production.
 *   - Proper HTTP status codes.
 */

import { Request, Response, NextFunction } from "express";

/** Custom application error — add a statusCode to any Error */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Central error-handling middleware (must have 4 args for Express to recognise it) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
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
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}

/** Async wrapper — catches promise rejections and passes them to next(err) */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
