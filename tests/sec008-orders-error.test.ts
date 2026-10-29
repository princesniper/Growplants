/// <reference types="bun-types" />
/**
 * SEC-008 — production error handling in GET /api/orders.
 * A database failure must surface as 500 (never a fake "success" with an
 * empty orders array); a genuine empty account must remain 200/success.
 * Run: bun test tests/sec008-orders-error.test.ts
 */
import { describe, test, expect, mock, beforeAll, afterAll } from "bun:test";

mock.module("@/lib/auth", () => ({
  extractBearerToken: (h: string | null | undefined) =>
    h && h.startsWith("Bearer ") ? h.slice(7) : null,
  verifyFirebaseIdToken: async (t: string) =>
    t === "TOKEN-OK" ? { uid: "owner-1" } : null,
}));

let simulateDbFailure = true;
mock.module("@/lib/db", () => ({
  db: {
    order: {
      findMany: async () => {
        if (simulateDbFailure) throw new Error("Simulated DB outage (SEC-008 test)");
        return [];
      },
      count: async () => {
        if (simulateDbFailure) throw new Error("Simulated DB outage (SEC-008 test)");
        return 0;
      },
    },
  },
}));

const PREV_NODE_ENV = process.env.NODE_ENV;

beforeAll(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
});
afterAll(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = PREV_NODE_ENV;
});

async function getOrders() {
  const { GET } = await import("../src/app/api/orders/route");
  const req = new Request("http://localhost:3000/api/orders", {
    headers: { authorization: "Bearer TOKEN-OK" },
  });
  return GET(req as any);
}

describe("SEC-008 GET /api/orders error handling", () => {
  test("db outage in production → 500, success:false, generic message", async () => {
    simulateDbFailure = true;
    const res = await getOrders();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Could not load your orders. Please try again later.");
    expect(JSON.stringify(body)).not.toMatch(/outage|ECONNREFUSED|Simulated/);
  });

  test("genuine empty order history → 200, success:true with empty list", async () => {
    simulateDbFailure = false;
    const res = await getOrders();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.orders).toEqual([]);
  });
});
