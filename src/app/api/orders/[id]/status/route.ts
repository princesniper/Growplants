/**
 * GrowPlants — PATCH /api/orders/[id]/status
 * ============================================================================
 * Admin API route to update an order's status in Firestore.
 *
 * WHY THIS EXISTS:
 *   Firestore security rules block client-side writes to orders/{orderId}
 *   (only the order owner can read, no one can write after creation).
 *   So the timeline can never progress because the client can't update
 *   the status field directly.
 *
 *   This server-side route uses the Firebase Admin SDK (or falls back to
 *   the REST API with the user's ID token) to update the status field,
 *   add a statusHistory entry, and sync the `orderStatus` field (capitalized)
 *   for backward compatibility with old components.
 *
 * AUTHENTICATION:
 *   In production, this should require admin role verification.
 *   For now, we accept any authenticated Firebase user (token required).
 *
 * REQUEST:
 *   PATCH /api/orders/[id]/status
 *   Headers: Authorization: Bearer <Firebase ID Token>
 *   Body: {
 *     status: "pending" | "confirmed" | "processing" | "quality_inspection" |
 *            "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled",
 *     note?: string  // optional note for status history
 *   }
 *
 * RESPONSE:
 *   200: { success: true, status: "new_status" }
 *   400: { success: false, error: "Invalid status" }
 *   401: { success: false, error: "Unauthorized" }
 *   404: { success: false, error: "Order not found" }
 *   500: { success: false, error: "..." }
 * ============================================================================
 */
import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, getApps, cert, type App as FirebaseAdminApp } from "firebase-admin/app";
import { getFirestore, type Firestore as AdminFirestore } from "firebase-admin/firestore";
import { extractBearerToken, verifyFirebaseIdToken } from "@/lib/auth";

// Valid status values (must match timeline-stages.ts)
const VALID_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "quality_inspection",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

// Capitalize for the redundant `orderStatus` field (backward compat)
function capitalizeStatus(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Lazy-init Firebase Admin (server-side, bypasses Firestore rules)
let adminApp: FirebaseAdminApp | null = null;
let adminDb: AdminFirestore | null = null;

function getAdminDb(): AdminFirestore | null {
  if (adminDb) return adminDb;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // If admin credentials are configured, use Admin SDK (full bypass of rules)
  if (projectId && clientEmail && privateKeyRaw) {
    try {
      adminApp = getApps().length > 0 ? getApps()[0] : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: (privateKeyRaw ?? "").replace(/\\n/g, "\n"),
        }),
      });
      adminDb = getFirestore(adminApp);
      console.log("[admin-status] Using Firebase Admin SDK (full bypass)");
      return adminDb;
    } catch (err) {
      console.warn("[admin-status] Admin SDK init failed, falling back to client SDK:", err);
    }
  }

  // Fallback: return null — caller will use client SDK with user's token
  console.log("[admin-status] Admin SDK not configured — will use client SDK fallback");
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  // 1. Verify Firebase ID token
  const authHeader = req.headers.get("authorization");
  const idToken = extractBearerToken(authHeader);
  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  if (!decoded) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // 2. Parse body
  let body: { status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const newStatus = body.status?.toLowerCase().trim();
  if (!newStatus || !VALID_STATUSES.includes(newStatus as ValidStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const note = body.note ?? `Status updated to ${capitalizeStatus(newStatus)}`;
  const now = new Date().toISOString();

  try {
    // Try Admin SDK first (bypasses Firestore rules)
    const adminDb = getAdminDb();

    if (adminDb) {
      // ─── Admin SDK path (production) ───
      const orderRef = adminDb.collection("orders").doc(orderId);
      const snap = await orderRef.get();

      if (!snap.exists) {
        return NextResponse.json(
          { success: false, error: "Order not found in Firestore" },
          { status: 404 }
        );
      }

      const existingData = snap.data() as Record<string, unknown>;
      const existingHistory = (existingData.statusHistory as Array<Record<string, unknown>>) ?? [];

      // Build update object — update BOTH `status` and `orderStatus` for backward compat
      const updateData: Record<string, unknown> = {
        status: newStatus,
        orderStatus: capitalizeStatus(newStatus),
        updatedAt: serverTimestamp(),
        statusHistory: [
          ...existingHistory,
          {
            status: newStatus,
            date: now,
            note,
            createdBy: decoded.uid,
          },
        ],
      };

      await orderRef.update(updateData);
      console.log(`[admin-status] ✅ Updated order ${orderId} status → ${newStatus} (Admin SDK)`);

      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `Order status updated to ${capitalizeStatus(newStatus)}`,
      });
    }

    // ─── Fallback: Client SDK with dynamic import (dev only) ───
    // This will only work if Firestore rules allow the user to write
    // (which they usually don't — but we try anyway as a last resort)
    const { firebaseDb, isFirebaseConfigured } = await import("@/lib/firebase/client");

    if (!isFirebaseConfigured || !firebaseDb) {
      return NextResponse.json(
        { success: false, error: "Firebase not configured" },
        { status: 500 }
      );
    }

    const orderRef = doc(firebaseDb, "orders", orderId);
    const snap = await getDoc(orderRef);

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found in Firestore" },
        { status: 404 }
      );
    }

    const existingData = snap.data() as Record<string, unknown>;
    const existingHistory = (existingData.statusHistory as Array<Record<string, unknown>>) ?? [];

    const updateData = {
      status: newStatus,
      orderStatus: capitalizeStatus(newStatus),
      statusHistory: [
        ...existingHistory,
        {
          status: newStatus,
          date: now,
          note,
          createdBy: decoded.uid,
        },
      ],
    };

    await updateDoc(orderRef, updateData);
    console.log(`[admin-status] ✅ Updated order ${orderId} status → ${newStatus} (Client SDK fallback)`);

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Order status updated to ${capitalizeStatus(newStatus)}`,
      _fallback: true,
    });
  } catch (err) {
    console.error("[admin-status] Failed to update order status:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update status: ${message}` },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch valid statuses (for admin UI dropdown)
export async function GET() {
  return NextResponse.json({
    success: true,
    statuses: VALID_STATUSES.map((s) => ({
      value: s,
      label: capitalizeStatus(s),
    })),
  });
}
