/**
 * Manual Migration Script
 *
 * This creates the Product table + indexes directly via Prisma Client ($executeRaw).
 * We use this instead of `prisma migrate dev` because the Prisma CLI's Rust schema
 * engine tries IPv6 connections first, which are blocked on this network.
 * The Prisma Client (Node.js) respects --dns-result-order=ipv4first.
 *
 * Run via:  node --dns-result-order=ipv4first node_modules/.bin/ts-node prisma/migrate-manual.ts
 * Or:       npm run db:migrate:manual
 */

import * as dotenv from "dotenv";
dotenv.config();

// Force IPv4 DNS resolution in Node.js (must be called early)
import * as dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});

async function migrate(): Promise<void> {
  console.log("🔧  Running manual migration...");
  console.log(`   Connecting to: ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown host"}`);

  // Step 1: Create the Product table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Product" (
      "id"         SERIAL          NOT NULL,
      "name"       TEXT            NOT NULL,
      "category"   TEXT            NOT NULL,
      "price"      DECIMAL(10,2)   NOT NULL,
      "created_at" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
    )
  `;
  console.log("   ✔  Product table created (or already exists)");

  // Step 2: Index for general sorted queries (updated_at DESC, id DESC)
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "Product_updated_at_id_idx"
      ON "Product" ("updated_at" DESC, "id" DESC)
  `;
  console.log("   ✔  Index (updated_at DESC, id DESC) created");

  // Step 3: Composite index for category-filtered queries
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "Product_category_updated_at_id_idx"
      ON "Product" ("category", "updated_at" DESC, "id" DESC)
  `;
  console.log("   ✔  Index (category, updated_at DESC, id DESC) created");

  console.log("\n✅  Migration complete! Product table and indexes are ready.\n");
}

migrate()
  .catch((err) => {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
