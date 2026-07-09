/**
 * GrowPlants — PATCH /api/admin/orders/[orderId]/status
 * ============================================================================
 * Admin-only route to update an order's status in Firestore using the
 * Firebase Admin SDK. Client-side Firestore rules block update/delete,
 * so this server-side route is the ONLY way to change order status.
 *
 * Flow:
 *   1. Verify Firebase ID token from Authorization header
 *   2. Validate new status against the 7-step timeline
 *   3. Update Firestore orders/{orderId}:
 *      - status (lowercase) — primary field used by timeline
 *      - orderStatus (capitalized) — sync for backward compat
 *      - statusHistory array — append { status, timestamp, note }
 *      - adminNotes (if provided)
 *      - updatedAt server timestamp
 *   4. Return { success: true, status: newStatus }
 *
 * Timeline steps (exactly 7):
 *   placed → confirmed → processing → packed → shipped → out_for_delivery → delivered
 *   + cancelled (special case)
 * ============================================================================
 */
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App as FirebaseAdminApp } from "firebase-admin/app";
import { getFirestore, type Firestore as AdminFirestore } from "firebase-admin/firestore";
import { extractBearerToken, verifyFirebaseIdToken } from "@/lib/auth";

// ─── 7-step timeline + cancelled ───
const VALID_STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

// Capitalize for the redundant `orderStatus` field
function capitalizeStatus(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Lazy-init Firebase Admin SDK (bypasses Firestore rules) ───
let adminApp: FirebaseAdminApp | null = null;
let adminDb: AdminFirestore | null = null;

function getAdminDb(): AdminFirestore {
  if (adminDb) return adminDb;

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKeyRaw) {
    adminApp =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: (privateKeyRaw ?? "").replace(/\\n/g, "\n"),
            }),
          });
    adminDb = getFirestore(adminApp);
    return adminDb;
  }

  // If Admin SDK not configured, try Application Default Credentials (emulator/local)
  try {
    adminApp = getApps().length > 0 ? getApps()[0] : initializeApp({ projectId });
    adminDb = getFirestore(adminApp);
    return adminDb;
  } catch (err) {
    throw new Error(
      `Firebase Admin SDK not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY env vars. Original error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

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

  // TODO: In production, check admin role here:
  // if (decoded.role !== "admin") return 403
  // For now, any authenticated user can update (testing mode)

  // 2. Parse + validate body
  let body: { status?: string; note?: string; adminNotes?: string };
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
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found in Firestore" },
        { status: 404 }
      );
    }

    const existingData = snap.data() as Record<string, unknown>;
    const existingHistory =
      (existingData.statusHistory as Array<Record<string, unknown>>) ?? [];

    // 3. Build update object — update BOTH `status` and `orderStatus` for consistency
    const updateData: Record<string, unknown> = {
      status: newStatus, // lowercase — primary field used by timeline
      orderStatus: capitalizeStatus(newStatus), // capitalized — sync for backward compat
      updatedAt: new Date(),
      statusHistory: [
        ...existingHistory,
        {
          status: newStatus,
          timestamp: now,
          note,
          updatedBy: decoded.uid,
        },
      ],
    };

    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes;
    }

    await orderRef.update(updateData);
    console.log(
      `[admin-status] ✅ Updated order ${orderId} status → ${newStatus} (by ${decoded.uid})`
    );

    return NextResponse.json({
      success: true,
      status: newStatus,
      orderStatus: capitalizeStatus(newStatus),
      message: `Order status updated to ${capitalizeStatus(newStatus)}`,
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

// GET — list valid statuses for admin UI dropdown
export async function GET() {
  return NextResponse.json({
    success: true,
    statuses: VALID_STATUSES.map((s) => ({
      value: s,
      label: capitalizeStatus(s),
    })),
  });
}
