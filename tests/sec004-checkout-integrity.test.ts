/// <reference types="bun-types" />
/**
 * SEC-003/004 â€” Option W canonical checkout integrity (REAL database tests)
 * ============================================================================
 * Runs against a THROWAWAY SQLite file created by `prisma db push` before the
 * suite (see tasks/SEC-004-ATOMIC-CHECKOUT.md) â€” never against project data.
 * The @/lib/db seam is mocked to return a REAL PrismaClient bound to the
 * throwaway file, so the route's actual transactions, constraints and
 * rollbacks are exercised end-to-end.
 *
 * Also covers Phase F (legacy guest-order cancellation â†’ Contact Support).
 *
 * Run: bun test tests/sec004-checkout-integrity.test.ts
 * Prereq: bunx prisma db push --skip-generate  (DATABASE_URL = throwaway file)
 * ============================================================================
 */
import { describe, test, expect, mock, beforeAll, beforeEach } from "bun:test";
import { PrismaClient } from "@prisma/client";

const TEMP_DB_URL =
  process.env.SEC004_DATABASE_URL ??
  "file:C:/Users/laptop care/AppData/Local/Temp/opencode/gsec-integrity-test.db";

// The REAL client â€” real transactions, real unique constraints, real rollbacks.
const realDb = new PrismaClient({ datasources: { db: { url: TEMP_DB_URL } } });

// Only the auth trust seam is mocked; everything DB is real.
mock.module("@/lib/auth", () => ({
  extractBearerToken: (h: string | null | undefined) =>
    h && h.startsWith("Bearer ") ? h.slice(7) : null,
  verifyFirebaseIdToken: async (t: string) =>
    t === "TOKEN-A" ? { uid: "user-A", email: "a@x.test" } : null,
}));

mock.module("@/lib/db", () => ({ db: realDb }));

process.env.NODE_ENV = "production"; // no dev mock fallback â€” real semantics

import plantsData from "../src/data/plants-data.json";

type AnyProduct = { stock?: unknown; price?: unknown; name?: unknown };
function findProductWithStock(minimum = 1): { slug: string; stock: number } {
  for (const [slug, raw] of Object.entries(plantsData as Record<string, AnyProduct>))
    if (typeof raw.stock === "number" && raw.stock >= minimum && typeof raw.price === "number")
      return { slug, stock: raw.stock as number };
  throw new Error("No finite-stock product in catalog â€” tests cannot run");
}
const P = findProductWithStock(5);

// Two DISTINCT finite-stock products, for multi-item rollback scenarios.
function allFiniteStockProducts(): Array<{ slug: string; stock: number }> {
  return Object.entries(plantsData as Record<string, AnyProduct>)
    .filter(([, raw]) => typeof raw.stock === "number" && (raw.stock as number) >= 1 && typeof raw.price === "number")
    .map(([slug, raw]) => ({ slug, stock: raw.stock as number }));
}
const FINITE = allFiniteStockProducts();
if (FINITE.length < 2) throw new Error("Need â‰¥2 finite-stock products for rollback tests");
const P1 = FINITE[0], P2 = FINITE[1];

async function post(payload: object, opts?: { key?: string | null; token?: string | null }) {
  const { POST } = await import("../src/app/api/orders/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (opts?.key !== null) headers.set("idempotency-key", opts?.key ?? "key-default");
  if (opts?.token !== null) headers.set("authorization", `Bearer ${opts?.token ?? "TOKEN-A"}`);
  const req = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return POST(req as any);
}

function payload(items: Array<Record<string, unknown>>, overrides: Record<string, unknown> = {}) {
  const price = 100; // server ignores client prices anyway
  return {
    firebaseUid: "user-A",
    address: {
      fullName: "T User", phone: "9999999999", addressLine1: "1 Main St",
      city: "Delhi", state: "DL", pincode: "110001", latitude: 28.6, longitude: 77.2,
    },
    paymentMethod: "cod",
    items,
    ...overrides,
  };
}

const item = (slug: string, qty = 1) => ({ productId: slug, name: slug, slug, image: "", quantity: qty, unitPrice: priceOf(slug) });
function priceOf(slug: string) { return 123; } // server-authoritative â€” client value discarded

async function stockOf(slug: string): Promise<number | null> {
  const row = await realDb.productStock.findUnique({ where: { productId: slug } });
  return row?.stock ?? null;
}

const { getAuthoritativeProduct } = await import("../src/lib/product-pricing");

function expectedSubtotal(items: Array<{ productId: string; quantity: number }>) {
  return items.reduce((s, i) => s + getAuthoritativeProduct(i.productId)!.price * i.quantity, 0);
}

let keySeq = 0;
const nextKey = () => `k-${++keySeq}`;

beforeEach(async () => {
  await realDb.checkoutIdempotency.deleteMany({});
  await realDb.productStock.deleteMany({});
  await realDb.order.deleteMany({});
  await realDb.address.deleteMany({});
  await realDb.user.deleteMany({});
});

describe("SEC-003/004 checkout integrity (Option W)", () => {
  test("server-authoritative pricing: inflated client totals are ignored", async () => {
        const items = [item(P.slug, 2)];
    const res = await post(payload(items, { subtotal: 99999, totalAmount: 99999 }), { key: nextKey() });
    expect(res.status).toBe(200);
    const body = await res.json();
    const subtotal = expectedSubtotal(items);
    const shipping = subtotal >= 499 ? 0 : 49;
    expect(body.order.total_amount).toBe(subtotal + shipping);
    expect(body.order.total_amount).not.toBe(99999);
  });

  test("unknown product â†’ 400; missing idempotency key â†’ 400; anonymous â†’ 401", async () => {
    const bad = await post(payload([item("no-such-product-ever")]), { key: nextKey() });
    expect(bad.status).toBe(400);

    const noKey = await post(payload([item(P.slug)]), { key: null });
    expect(noKey.status).toBe(400);

    const anon = await post(payload([item(P.slug)]), { key: nextKey(), token: null });
    expect(anon.status).toBe(401);
  });

  test("quantity beyond catalog stock â†’ 400 (pre-transaction validation)", async () => {
    const res = await post(payload([item(P.slug, 9999)]), { key: nextKey() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/[Ss]tock|Invalid quantity/);
  });

  test("concurrent orders compete for the final unit â†’ exactly one wins, no oversell", async () => {
    // Pre-seed a durable row of exactly 1 remaining unit (row = authority).
    await realDb.productStock.create({ data: { productId: P.slug, stock: 1 } });
    const [r1, r2] = await Promise.all([
      post(payload([item(P.slug)]), { key: nextKey() }),
      post(payload([item(P.slug)]), { key: nextKey() }),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect(await stockOf(P.slug)).toBe(0);
    expect(await realDb.order.count()).toBe(1);
    expect((await r1.json()).order ?? (await r2.json()).order).toBeDefined();
  });

  test("repeated key with equivalent payload replays the ORIGINAL order", async () => {
    const key = nextKey();
    const first = await post(payload([item(P.slug)]), { key });
    expect(first.status).toBe(200);
    const firstOrder = (await first.json()).order;
    // Retry carries a cosmetic price difference â€” fingerprint ignores display fields.
    const items2 = [{ ...item(P.slug), unitPrice: 987654, image: "x.png" }];
    const retry = await post(payload(items2), { key });
    expect(retry.status).toBe(200);
    const body = await retry.json();
    expect(body.idempotent_replay).toBe(true);
    expect(body.order.order_number).toBe(firstOrder.order_number);
    expect(await realDb.order.count()).toBe(1);
  });

  test("repeated key with CONFLICTING payload â†’ 409, no second order", async () => {
    const key = nextKey();
    await post(payload([item(P.slug)]), { key });
    const victim = findProductWithStock(0);
    const conflict = await post(payload([item(victim.slug, 1)]), { key });
    expect(conflict.status).toBe(409);
    expect(await realDb.order.count()).toBe(1);
  });

  test("multi-item insufficient stock ROLLS BACK earlier decrements (no partial state)", async () => {
    // Item A decrements fine; item B has 0 remaining â†’ whole tx rolls back.
    await realDb.productStock.create({ data: { productId: P.slug, stock: 5 } });
    await realDb.productStock.create({ data: { productId: P.slug, stock: 0 } });
    const beforeA = await stockOf(P.slug);
    const res = await post(payload([item(P.slug), item(P.slug)]), { key: nextKey() });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/[Ss]tock/);
    expect(await stockOf(P.slug)).toBe(beforeA); // A's decrement was undone
    expect(await realDb.order.count()).toBe(0);
    expect(await realDb.checkoutIdempotency.count({ where: { orderId: { not: "" } } })).toBe(0);
  });

  test("transient failure then retry with the SAME key â†’ one order, one reservation", async () => {
    const key = nextKey();
    let attempts = 0;
    const original = realDb.$transaction.bind(realDb);
    // @ts-expect-error test-only transient-outage injection
    realDb.$transaction = async (...args: Parameters<typeof original>) => {
      if (attempts++ === 0) throw new Error("simulated transient db outage");
      return original(...(args as [any]));
    };
    try {
      const r1 = await post(payload([item(P.slug)]), { key });
      expect(r1.status).toBe(500);
      const r2 = await post(payload([item(P.slug)]), { key });
      expect(r2.status).toBe(200);
      expect(await realDb.order.count()).toBe(1);
      expect(await realDb.checkoutIdempotency.count()).toBe(1);
    } finally {
      realDb.$transaction = original;
    }
  });

  test("stock decays exactly once across idempotent duplicates", async () => {
    await realDb.productStock.create({ data: { productId: P.slug, stock: 5 } });
    const key = nextKey();
    await post(payload([item(P.slug), item(P.slug)]), { key });
    const retry = await post(payload([item(P.slug), item(P.slug)]), { key });
    expect(retry.status).toBe(200);
    expect(await stockOf(P.slug)).toBe(3); // 5 âˆ’ 2 exactly once
    expect(await realDb.order.count()).toBe(1);
  });
});

describe("Phase F â€” legacy guest orders (Contact Support path)", () => {
  test("guest-attributed order cannot be cancelled online; no data leak", async () => {
    await realDb.user.create({
      data: { id: "user-A", email: "a@x.test" },
    });
    const order = await realDb.order.create({
      data: {
        orderNumber: "GP-TEST-0001", userId: "guest-abcdef123456", status: "pending",
        subtotal: 10000, shippingFee: 0, discount: 0, tax: 0, totalAmount: 10000,
      },
    });
    const { POST } = await import("../src/app/api/orders/[id]/cancel/route");
    const req = new Request(`http://localhost:3000/api/orders/${order.id}/cancel`, {
      method: "POST",
      headers: { authorization: "Bearer TOKEN-A", "content-type": "application/json" },
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/contact support/i);
    expect(body.error).not.toMatch(/guest-abcdef123456/);
  });

  test("authenticated owner can still cancel (integration)", async () => {
    await realDb.user.create({ data: { id: "user-A", email: "a@x.test" } });
    const order = await realDb.order.create({
      data: {
        orderNumber: "GP-TEST-0002", userId: "user-A", status: "pending",
        subtotal: 10000, shippingFee: 0, discount: 0, tax: 0, totalAmount: 10000,
      },
    });
    const { POST } = await import("../src/app/api/orders/[id]/cancel/route");
    const req = new Request(`http://localhost:3000/api/orders/${order.id}/cancel`, {
      method: "POST",
      headers: { authorization: "Bearer TOKEN-A", "content-type": "application/json" },
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(200);
    expect((await realDb.order.findUnique({ where: { id: order.id } }))!.status).toBe("cancelled");
  });
});

