# 🚀 Product API — Internship Assignment

A production-ready REST API built with **Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL** that serves 200,000 products with **cursor-based pagination**.

---

## 📁 Folder Structure

```
intern/
├── prisma/
│   ├── schema.prisma       # DB schema + indexes
│   └── seed.ts             # Seeds 200,000 products (batch insert)
│
├── src/
│   ├── config/
│   │   └── database.ts     # Prisma client singleton
│   ├── controllers/
│   │   └── productController.ts  # Handles HTTP request/response
│   ├── middleware/
│   │   ├── errorHandler.ts       # Global error handling
│   │   └── validateRequest.ts    # Zod request validation
│   ├── routes/
│   │   └── productRoutes.ts      # Route definitions
│   ├── services/
│   │   └── productService.ts     # Business logic + DB queries
│   ├── utils/
│   │   └── cursor.ts             # Base64url cursor encode/decode
│   └── server.ts           # Express app entry point
│
├── frontend/
│   └── index.html          # Bonus React frontend (CDN, no build step)
│
├── .env.example            # Environment variable template
├── .env                    # Your local config (do not commit!)
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Setup Steps

### 1. Prerequisites

| Tool       | Version  |
|------------|----------|
| Node.js    | ≥ 18.0   |
| PostgreSQL | ≥ 14.0   |
| npm        | ≥ 9.0    |

### 2. Install Dependencies

```bash
cd intern
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/intern_products?schema=public"
PORT=3000
NODE_ENV=development
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:5500"
```

> **Tip:** Create the database first: `createdb intern_products`

---

## 🗄️ Database Migration

Run Prisma migrations to create the `Product` table and all indexes:

```bash
npm run db:migrate
```

Or push the schema directly (no migration history):

```bash
npm run db:push
```

Generate the Prisma client (required after schema changes):

```bash
npm run db:generate
```

---

## 🌱 Seed Command

Insert **200,000 products** using batch insertions of 5,000 records each:

```bash
npm run seed
```

Expected output:
```
🌱  Starting database seed...
   Total records : 200,000
   Batch size    : 5,000
   Total batches : 40

   ✔  Inserted 200,000 / 200,000 products  [100%]  38.2s

✅  Seed complete! 200,000 products inserted in 38.2s.
```

> **Note:** Actual time depends on your machine and DB location.

---

## ▶️ Run Command

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

Server starts on: `http://localhost:3000`

---

## 🔌 API Reference

### Health Check

```
GET /health
```

```json
{ "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }
```

---

### GET /products

Returns a cursor-paginated list of products sorted by `updated_at DESC, id DESC`.

#### Query Parameters

| Parameter  | Type   | Default | Description                              |
|------------|--------|---------|------------------------------------------|
| `limit`    | number | `20`    | Items per page (1–100)                   |
| `category` | string | —       | Filter by category (optional)            |
| `cursor`   | string | —       | Pagination cursor from previous response |

#### Examples

```bash
# First page — 20 products
GET /products

# First page — 50 products
GET /products?limit=50

# Filter by category
GET /products?category=Electronics

# Filter + custom limit
GET /products?limit=10&category=Books

# Load next page using cursor from previous response
GET /products?cursor=eyJ1cGRhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIiwiaWQiOjEyM30

# All three together
GET /products?limit=20&category=Electronics&cursor=<token>
```

#### Response Format

```json
{
  "data": [
    {
      "id": 12345,
      "name": "Premium Gadget 9012",
      "category": "Electronics",
      "price": "299.99",
      "created_at": "2023-03-14T08:00:00.000Z",
      "updated_at": "2024-01-15T10:25:00.000Z"
    }
  ],
  "nextCursor": "eyJ1cGRhdGVkX2F0IjoiMjAyNC0wMS0xNVQxMDoyNTowMC4wMDBaIiwiaWQiOjEyMzQ1fQ",
  "hasMore": true
}
```

> When `hasMore` is `false`, `nextCursor` is `null` — you've reached the end.

#### Error Responses

```json
// 400 — Invalid query params
{
  "error": "Invalid query parameters",
  "details": { "limit": ["Number must be between 1 and 100"] }
}

// 400 — Tampered cursor
{
  "error": "Invalid or expired cursor."
}

// 500 — Internal error
{
  "error": "Internal server error"
}
```

---

## 🖼️ Frontend (Bonus)

A standalone React app with no build step — just open the file in a browser:

```bash
# Option 1: Open directly
start frontend/index.html

# Option 2: Serve locally (avoids CORS issues)
npx serve frontend
# or
python -m http.server 5500 --directory frontend
```

**Features:**
- 🎨 Dark glassmorphic UI with animated product cards
- 🏷️ Color-coded category filter pills
- 📄 Skeleton loading states
- ↓ **Load More** button using cursor pagination
- ⚠️ Graceful error handling with retry

> Make sure the API server is running on port 3000 before opening the frontend.

---

## 🧠 Why Cursor Pagination Instead of OFFSET?

### The OFFSET Problem

```sql
-- Page 5000 with limit 20
SELECT * FROM products ORDER BY updated_at DESC, id DESC
LIMIT 20 OFFSET 99980;  -- ❌ DB must scan 99,980 rows just to skip them!
```

| Issue | OFFSET Pagination | Cursor Pagination |
|-------|-------------------|-------------------|
| **Performance** | O(N) — degrades with page depth | O(log N) — always fast |
| **Stability** | Duplicates/skips if data changes | Rock solid — no gaps |
| **Scalability** | Falls apart at 100K+ records | Works the same at 200K or 2M |
| **Index use** | Can't fully use index for deep pages | Directly uses the B-tree index |

### How Our Cursor Works

The cursor is a **base64url-encoded** JSON blob: `{ updated_at, id }`.

For each "next page" request, we translate the cursor into this SQL condition:

```sql
WHERE
  (updated_at < :cursor_updated_at)
  OR
  (updated_at = :cursor_updated_at AND id < :cursor_id)
ORDER BY updated_at DESC, id DESC
LIMIT :limit
```

This allows PostgreSQL to **seek directly to the right position in the B-tree index** — no scanning, no skipping.

### The Composite Cursor

`updated_at` alone is **not unique** — multiple products can share the same timestamp. Adding `id` as a tiebreaker makes the cursor:

- **Deterministic** — always the same order for the same data
- **Stable** — safe even if new records are inserted or updated while you browse
- **No duplicates, no gaps** — mathematically guaranteed

### Index Design

```prisma
@@index([updated_at(sort: Desc), id(sort: Desc)])           // General queries
@@index([category, updated_at(sort: Desc), id(sort: Desc)]) // Category-filtered queries
```

PostgreSQL can use these indexes for **index-only scans** (no heap access needed), making pagination effectively free at any depth.

---

## 🗃️ Available Scripts

| Script            | Command                  | Description                         |
|-------------------|--------------------------|-------------------------------------|
| Dev server        | `npm run dev`            | Hot-reload with ts-node-dev         |
| Production build  | `npm run build`          | Compile TypeScript → dist/          |
| Start production  | `npm start`              | Run compiled JS                     |
| Seed DB           | `npm run seed`           | Insert 200,000 products             |
| Run migration     | `npm run db:migrate`     | Apply schema + create indexes       |
| Push schema       | `npm run db:push`        | Apply schema without migration file |
| Generate client   | `npm run db:generate`    | Regenerate Prisma client types      |
| Prisma Studio     | `npm run db:studio`      | GUI to browse the database          |
| Reset DB          | `npm run db:reset`       | Drop + re-migrate (dev only!)       |

---

## 🔮 Future Improvements

| Area              | Improvement                                                                    |
|-------------------|--------------------------------------------------------------------------------|
| **Caching**       | Redis layer in front of Prisma — cache frequent category queries for 60s       |
| **Search**        | Full-text search on `name` using PostgreSQL `tsvector` or Elasticsearch        |
| **Rate limiting** | `express-rate-limit` to protect against API abuse                               |
| **Auth**          | JWT authentication + user-owned products                                        |
| **Filtering**     | Price range filter (`priceMin`, `priceMax`) with additional index               |
| **Sorting**       | Configurable sort fields (e.g., `sort=price&order=asc`)                        |
| **Tests**         | Jest + Supertest integration tests for each endpoint                            |
| **Monitoring**    | OpenTelemetry tracing + Prometheus metrics                                      |
| **Docker**        | Multi-stage Dockerfile + `docker-compose.yml` with PostgreSQL service           |
| **CI/CD**         | GitHub Actions pipeline: lint → test → build → deploy                          |
| **Updated_at**    | PostgreSQL trigger to auto-update `updated_at` on row modification             |

---

## 🧰 Tech Stack

| Layer       | Technology                      |
|-------------|---------------------------------|
| Runtime     | Node.js 18+                     |
| Language    | TypeScript 5                    |
| Framework   | Express 4                       |
| ORM         | Prisma 5                        |
| Database    | PostgreSQL 14+                  |
| Validation  | Zod                             |
| Security    | Helmet + CORS                   |
| Frontend    | React 18 (CDN) + Vanilla CSS    |

---

*Built for internship assignment — demonstrating production-grade backend architecture.*
