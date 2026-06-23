/**
 * Prisma Client Singleton
 *
 * In development, Next.js / ts-node-dev hot-reloads modules frequently.
 * Without this singleton pattern, each reload would create a new PrismaClient
 * instance and exhaust the DB connection pool quickly.
 *
 * Solution: cache the client on the `global` object in development.
 */

import { PrismaClient } from "@prisma/client";
import * as dns from "dns";

// Force IPv4 DNS resolution globally — Neon's hostnames return both IPv6 and IPv4.
// Without this, Node.js 18+ may try IPv6 first, which is blocked on some networks.
dns.setDefaultResultOrder("ipv4first");

// Extend the NodeJS global type to hold our cached client
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;
