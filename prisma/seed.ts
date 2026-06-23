/**
 * Seed Script — inserts 200,000 products using batch insertions.
 *
 * Strategy:
 * - Batch size of 5,000 records per createMany call (40 batches total).
 * - Random names, categories, prices, and timestamps are generated in JS.
 * - Timestamps are spread across the last 5 years for realistic data distribution.
 *
 * Run: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as dns from "dns";

dotenv.config();

// Force IPv4 DNS resolution — Neon hostnames return both IPv6 and IPv4.
// Without this, Node.js may try IPv6 first, which is blocked on some networks.
dns.setDefaultResultOrder("ipv4first");

const prisma = new PrismaClient();

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_PRODUCTS = 200_000;
const BATCH_SIZE = 5_000; // 40 batches total — safe for memory and DB connections

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Sports",
  "Toys",
  "Food & Beverage",
  "Automotive",
  "Health & Beauty",
  "Office Supplies",
];

const ADJECTIVES = [
  "Premium", "Ultra", "Pro", "Basic", "Advanced",
  "Smart", "Classic", "Modern", "Deluxe", "Elite",
  "Compact", "Portable", "Heavy-Duty", "Lightweight", "Eco-Friendly",
];

const NOUNS = [
  "Widget", "Gadget", "Device", "Accessory", "Tool",
  "Kit", "Set", "Bundle", "Pack", "System",
  "Unit", "Module", "Component", "Gear", "Station",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns a random date between two Date objects */
function randomDate(start: Date, end: Date): Date {
  const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(ms);
}

/** Generates a realistic product name */
function randomName(): string {
  const adj = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const suffix = Math.floor(Math.random() * 9_999) + 1;
  return `${adj} ${noun} ${suffix}`;
}

/** Generates a random price between $0.99 and $9,999.99 */
function randomPrice(): number {
  return parseFloat((Math.random() * 9_999 + 0.99).toFixed(2));
}

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌱  Starting database seed...");
  console.log(`   Total records : ${TOTAL_PRODUCTS.toLocaleString()}`);
  console.log(`   Batch size    : ${BATCH_SIZE.toLocaleString()}`);
  console.log(`   Total batches : ${TOTAL_PRODUCTS / BATCH_SIZE}`);
  console.log("");

  // Date range: 5 years ago → now (ensures varied updated_at values for pagination demo)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5);

  let totalInserted = 0;
  const startTime = Date.now();

  while (totalInserted < TOTAL_PRODUCTS) {
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - totalInserted);

    // Build the batch payload
    const batch = Array.from({ length: currentBatchSize }, () => {
      const createdAt = randomDate(startDate, endDate);
      // updated_at is always >= created_at (realistic behaviour)
      const updatedAt = randomDate(createdAt, endDate);

      return {
        name: randomName(),
        category: pick(CATEGORIES),
        price: randomPrice(),
        created_at: createdAt,
        updated_at: updatedAt,
      };
    });

    // Batch insert — much faster than individual inserts
    await prisma.product.createMany({ data: batch });

    totalInserted += currentBatchSize;
    const elapsedSecs = ((Date.now() - startTime) / 1_000).toFixed(1);
    const pct = ((totalInserted / TOTAL_PRODUCTS) * 100).toFixed(1);

    process.stdout.write(
      `\r   ✔  Inserted ${totalInserted.toLocaleString()} / ${TOTAL_PRODUCTS.toLocaleString()} products  [${pct}%]  ${elapsedSecs}s`
    );
  }

  const totalSecs = ((Date.now() - startTime) / 1_000).toFixed(1);
  console.log(`\n\n✅  Seed complete! ${TOTAL_PRODUCTS.toLocaleString()} products inserted in ${totalSecs}s.`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
