/**
 * GrowPlants — POST /api/orders/[id]/cancel
 * ============================================================================
 * Customer order cancellation (SEC-001 replacement for the removed
 * PATCH /api/orders/[id]/status and /api/admin/orders/[orderId]/status routes).
 *
 * AUTHORIZATION (server-side, enforced in this order):
 *   1. Authentication: Bearer Firebase ID token — verified by the Admin SDK.
 *   2. Ownership: decoded.uid MUST equal the order's userId → else 403.
 *   3. Business rules: only `pending | placed | confirmed` orders are
 *      cancellable; cancelled/delivered/later stages → 409.
 * No client-supplied field can influence the identity, the order selection, or
 * the resulting status.
 *
 * PATCH note: this route intentionally has no administrator path. Order status
 * administration lives exclusively in the Admin Panel's guarded API
 * (Growplants.Admin /api/admin/orders/[id]/status).
 *
 * Prisma is the transactional store; the Firestore orders/{id} mirror is
 * updated best-effort (same convention as the checkout dual-write).
 * ============================================================================
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CANCELLABLE_STATUSES = new Set(["pending", "placed", "confirmed"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authentication
    const { extractBearerToken, verifyFirebaseIdToken } = await import("@/lib/auth");
    const idToken = extractBearerToken(req.headers.get("authorization"));
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 }
      );
    }
    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded || !decoded.uid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Body is optional and never authoritative — the request stream is left unread.

    // 2–3. Resolve, authorize, validate — then mutate
    const { db } = await import("@/lib/db");
    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      select: { id: true, orderNumber: true, userId: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== decoded.uid) {
      // Phase F: legacy guest-attributed orders (userId "guest-<hash>") can
      // never be owned by an authenticated account — they cannot be cancelled
      // online under the token-only policy. Do NOT restore email-proof.
      if (order.userId.startsWith("guest-")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This order cannot be cancelled online. Please contact support with your order number — after ownership verification support can cancel it for you.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: "This order belongs to a different account." },
        { status: 403 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "This order is already cancelled." },
        { status: 409 }
      );
    }
    if (order.status === "delivered") {
      return NextResponse.json(
        { success: false, error: "Delivered orders cannot be cancelled." },
        { status: 409 }
      );
    }
    if (!CANCELLABLE_STATUSES.has(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Orders in "${order.status}" can no longer be cancelled by customers — contact support.`,
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();
    const updated = await db.$transaction(async (tx) => {
      const row = await tx.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
        select: { id: true, orderNumber: true, status: true },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "cancelled",
          remarks: "Cancelled by customer.",
          createdBy: decoded.uid,
        },
      });
      return row;
    });

    // Best-effort Firestore mirror (owner-scoped; skips when Admin SDK is absent)
    await mirrorCancelToFirestore(order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        order_number: updated.orderNumber,
        status: updated.status,
        cancelled_at: nowIso,
      },
    });
  } catch (err) {
    console.error("[api/orders/cancel] Uncaught error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown server error during order cancellation.";
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        success: false,
        error: isProd ? "Order cancellation failed. Please try again." : message,
      },
      { status: 500 }
    );
  }
}

/* ============================================================================
 * Firestore mirror — same lazy Admin SDK init as the replaced status routes,
 * restricted to owner-scoped cancellation data. Fail-soft by design.
 * ============================================================================ */
async function mirrorCancelToFirestore(orderId: string): Promise<void> {
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKeyRaw) return; // not configured — skip

    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
            }),
          });

    const db = getFirestore(app);
    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return;

    const existingHistory =
      ((snap.data() as Record<string, unknown>).statusHistory as Array<
        Record<string, unknown>
      >) ?? [];
    await orderRef.update({
      status: "cancelled",
      orderStatus: "Cancelled",
      updatedAt: new Date(),
      statusHistory: [
        ...existingHistory,
        {
          status: "cancelled",
          date: new Date().toISOString(),
          note: "Cancelled by customer.",
          createdBy: "customer",
        },
      ],
    });
  } catch (err) {
    // Mirror is best-effort — Prisma remains the source of truth.
    console.warn("[api/orders/cancel] Firestore mirror skipped/failed:", err);
  }
}
