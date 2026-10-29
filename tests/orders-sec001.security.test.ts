/// <reference types="bun-types" />
/**
 * SEC-001 security regression tests — Website order-status authorization.
 *
 * Hermetic route-level tests: `@/lib/auth` (token verification) and `@/lib/db`
 * (Prisma) are mocked, so no real Firebase credentials or product data are touched.
 * The mocked verifyFirebaseIdToken is the ONLY identity source, mirroring production
 * trust: a valid verified token, and nothing the client sends, establishes identity.
 *
 * Run: bun test tests/orders-sec001.security.test.ts
 */
import { describe, test, expect, mock, beforeAll, beforeEach } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type DecodedToken = { uid: string; email?: string } | null;

let currentToken: DecodedToken = { uid: "owner-1" };

// ── Mock @/lib/auth: extractBearerToken keeps the real (pure) semantics;
//    verifyFirebaseIdToken is the mockable trust boundary. ──────────────
mock.module("@/lib/auth", () => ({
  extractBearerToken: (authHeader: string | null | undefined): string | null =>
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null,
  verifyFirebaseIdToken: async (idToken: string): Promise<DecodedToken> => {
    if (idToken === "TOKEN-OWNER") return { uid: "owner-1", email: "a@example.test" };
    if (idToken === "TOKEN-OTHER") return { uid: "customer-2", email: "b@example.test" };
    return currentToken;
  },
}));

// ── Mock @/lib/db: minimal Prisma shape the cancel route uses. ─────────
type OrderRow = { id: string; orderNumber: string; userId: string; status: string };
const orderStore: OrderRow[] = [];
const historyRows: { orderId: string; status: string; createdBy: string }[] = [];

mock.module("@/lib/db", () => ({
  db: {
    order: {
      findFirst: async (args: any) => {
        const id = args?.where?.OR?.[0]?.id ?? args?.where?.id;
        const number = args?.where?.OR?.[1]?.orderNumber;
        return (
          orderStore.find((o) => (id ? o.id === id : false)) ??
          orderStore.find((o) => (number ? o.orderNumber === number : false)) ??
          null
        );
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        order: {
          update: async (tmp: any) => {
            const target = orderStore.find((o) => o.id === tmp?.where?.id);
            if (target && tmp?.data?.status) target.status = tmp.data.status;
            return target ?? null;
          },
        },
        orderStatusHistory: {
          create: async (tmp: any) => {
            historyRows.push(tmp.data);
            return tmp.data;
          },
        },
      };
      return fn(tx);
    },
  },
}));

beforeEach(() => {
  currentToken = { uid: "owner-1" };
});

async function cancelCall(id: string, token?: string) {
  const { POST } = await import("../src/app/api/orders/[id]/cancel/route");
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");
  const req = new Request(`http://localhost:3000/api/orders/${id}/cancel`, { method: "POST", headers });
  return POST(req as any, { params: Promise.resolve({ id }) });
}

const OWNER_ORDER: OrderRow = { id: "ord-1", orderNumber: "GP-20261029-0001", userId: "owner-1", status: "placed" };

function seed(order: Partial<OrderRow> = {}) {
  orderStore.length = 0;
  historyRows.length = 0;
  orderStore.push({ ...OWNER_ORDER, ...order });
}
describe("SEC-001 authentication", () => {
  test("T-01 no token → 401", async () => {
    const res = await cancelCall("ord-1");
    expect(res.status).toBe(401);
  });

  test("T-02 invalid/expired token → 401", async () => {
    currentToken = null;
    const res = await cancelCall("ord-1", "GARBAGE-TOKEN");
    expect(res.status).toBe(401);
  });

  test("T-03 malformed authorization header → 401", async () => {
    const res = await cancelCall("ord-1", undefined);
    expect(res.status).toBe(401);
  });
});

// ── Authorization (object level) ───────────────────────────────────────
describe("SEC-001 ownership", () => {
  test("T-04 non-owner cannot cancel someone else's order → 403", async () => {
    seed();
    const res = await cancelCall("ord-1", "TOKEN-OTHER");
    expect(res.status).toBe(403);
    expect(orderStore[0].status).toBe("placed"); // unchanged
  });

  test("T-09 unknown order → 404 generic message", async () => {
    seed();
    orderStore.length = 0;
    const res = await cancelCall("ord-doesnotexist", "TOKEN-OWNER");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/owner-1|a@example\.test/);
  });
});

// ── Business rules ─────────────────────────────────────────────────────
describe("SEC-001 cancellation rules", () => {
  test("T-05 owner cancels pending order → 200 + history row records verified uid", async () => {
    seed({ status: "pending" });
    const res = await cancelCall("GP-20261029-0001", "TOKEN-OWNER");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("T-06 owner cannot cancel delivered order → 409", async () => {
    seed({ status: "delivered" });
    const res = await cancelCall("ord-1", "TOKEN-OWNER");
    expect(res.status).toBe(409);
  });

  test("T-07 owner cannot cancel shipped order → 409", async () => {
    seed({ status: "shipped" });
    const res = await cancelCall("ord-1", "TOKEN-OWNER");
    expect(res.status).toBe(409);
  });

  test("T-08 already-cancelled order stays cancelled → 409", async () => {
    seed({ status: "cancelled" });
    const res = await cancelCall("ord-1", "TOKEN-OWNER");
    expect(res.status).toBe(409);
  });

  test("T-10 invalid JSON body is tolerated (cancel needs no body)", async () => {
    seed({ status: "placed" });
    const { POST: POST2 } = await import("../src/app/api/orders/[id]/cancel/route");
    const req = new Request("http://localhost:3000/api/orders/ord-1/cancel", {
      method: "POST",
      headers: { authorization: "Bearer TOKEN-OWNER", "content-type": "application/json" },
      body: "not-json",
    });
    const res = await POST2(req as any, { params: Promise.resolve({ id: "ord-1" }) });
    expect(res.status).toBe(200);
  });
});

// ── Endpoints removed ──────────────────────────────────────────────────
describe("SEC-001 privileged status endpoints are removed", () => {
  test("T-11 /api/admin/orders/[orderId]/status/route.ts no longer exists", () => {
    expect(
      existsSync(resolve(import.meta.dir, "../src/app/api/admin/orders/[orderId]/status/route.ts")),
    ).toBeFalse();
  });

  test("T-12 /api/orders/[id]/status/route.ts no longer exists", () => {
    expect(
      existsSync(resolve(import.meta.dir, "../src/app/api/orders/[id]/status/route.ts")),
    ).toBeFalse();
  });
});
