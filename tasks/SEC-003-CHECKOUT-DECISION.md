# SEC-003 / SEC-004 — Canonical Checkout Decision (OWNER GATE, awaiting approval)

Date: 2026-10-29. Status: BLOCKED on owner decision. No code changed for this task.

## Verified current data flow (evidence)

- Website checkout: `Growplants\src\app\api\orders\route.ts` → website Prisma (SQLite).
  Prices authoritative from static JSON (`src\lib\product-pricing.ts`); stock is
  checked but **never decremented** anywhere; no idempotency key. (Audit GP-002.)
- Admin checkout: `Growplants.Admin\src\app\api\orders\route.ts` + `src\lib\orders\create.ts`
  → Prisma (SQLite, paise) with catalog-authoritative pricing
  (Firestore `adminData/plants|pots` in production), transactional stock decrement
  with conflict-retry + best-effort rollback, server-side COD cap. Mirrors the
  order to Firestore `orders/{id}` for the admin panel.
- Admin Panel reads customers' orders from Firestore + local Prisma mirror.

## Options (smallest-change order)

**Option W — Website-Prisma canonical (recommended):** keep the website's own
checkout as the customer source of truth; port the Admin repo's proven stock
decrement + catalog pricing pattern to the Website, and have the Admin Panel
read website-created orders through Firestore mirrors (already its UI). Website
checkout then needs: stock authority (Prisma product rows — schema addition or
catalog-store read) and an idempotency key + unique order-number constraint.

**Option A — Admin-Firestore canonical:** point the website frontend at the
Admin public checkout (`POST {origin}/api/orders` + GET tracking + cancel).
Code already implements prices/stock/idempot*-lite there; requires
`CORS_ALLOWED_ORIGINS` on the Admin deployment and retiring the Website's
duplicated checkout route. Larger behavioral change, smaller security delta.

## SEC-004 (blocked sub-task)

Whichever option wins, implement: server stock decrement inside one store,
persistent idempotency key (order-number unique constraint or idempotency table),
retry-safety, and isolated concurrency tests. Not started by design.

## What remains safe & true now
Both checkouts already enforce server-authoritative prices and reject client
totals; SEC-001/002/005 are independent of this decision and are implemented.
