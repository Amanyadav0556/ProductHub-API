"use strict";
/**
 * Express Server Entry Point
 *
 * Bootstraps the Express application with:
 *   - Security middleware (helmet)
 *   - CORS
 *   - JSON body parsing
 *   - Routes
 *   - Global error handler
 *   - Graceful shutdown
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // Must be first — loads .env before any other import
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
// ─── App Setup ────────────────────────────────────────────────────────────────
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? "3000", 10);
// ─── Middleware (Order Matters!) ──────────────────────────────────────────────
// 1. Helmet — sets secure HTTP headers (XSS, clickjacking protection, etc.)
app.use((0, helmet_1.default)());
// 2. CORS — restrict which origins can call this API
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    methods: ["GET", "OPTIONS"],
}));
// 3. JSON body parsing (for future POST/PUT endpoints)
app.use(express_1.default.json());
// ─── Routes ───────────────────────────────────────────────────────────────────
// Health check — useful for Docker / load-balancer probes
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Products API
app.use("/products", productRoutes_1.default);
// 404 handler — must come AFTER all valid routes
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// ─── Global Error Handler (must be last middleware) ───────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Start Server ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`\n🚀  Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV ?? "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Products API: http://localhost:${PORT}/products\n`);
});
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
        console.log("✅  HTTP server closed.");
        process.exit(0);
    });
    // Force exit after 10 seconds if connections don't drain
    setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
    }, 10000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
exports.default = app;
//# sourceMappingURL=server.js.map