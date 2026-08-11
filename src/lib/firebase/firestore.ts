/**
 * GrowPlants — Firestore CRUD Helpers
 * Source: 03_database_design.md §2, 05_recreation_prompts.md Prompt 3
 *
 * Manages the `users` collection documents that hold real-time client state:
 * addresses, cart, wishlist, preferences. Also the `orders` collection for
 * client-side order writes.
 *
 * Firestore schema reference (03_database_design.md):
 *   users/{uid} → { uid, firstName, lastName, email, phone, profileImage,
 *                   memberSince, preferences, addresses[], wishlist[], cart[],
 *                   orders[] (embedded mirror for client convenience) }
 *   orders/{orderId} → { orderId, orderNumber, userId, orderPlacedAt, status,
 *                        paymentMethod, paymentStatus, name, phone, address,
 *                        addressDetails, products[], subtotal, shippingFee,
 *                        totalAmount, discount, statusHistory[] }
 */
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
  type Timestamp,
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type {
  FirestoreUser,
  FirestoreAddress,
  FirestoreCartItem,
  FirestoreWishlistItem,
  FirestoreOrder,
  FirestoreOrderProduct,
  FirestoreOrderAddressDetails,
  FirestoreOrderStatusEvent,
} from "@/types/firebase";

const USERS_COLLECTION = "users";
const ORDERS_COLLECTION = "orders";

/* ---------- User Document ---------- */

export async function getFirestoreUser(
  uid: string
): Promise<FirestoreUser | null> {
  if (!isFirebaseConfigured || !firebaseDb) return null;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as FirestoreUser;
}

export async function createFirestoreUser(
  uid: string,
  data: Partial<FirestoreUser>
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  // B9 FIX: Use merge: true so existing user data (addresses, cart, wishlist)
  // is NOT overwritten on re-login. Only sets fields that don't exist yet.
  await setDoc(ref, {
    uid,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    profileImage: data.profileImage ?? null,
    memberSince: data.memberSince ?? serverTimestamp(),
    preferences: data.preferences ?? {
      notifications: { email: true, sms: false, push: true },
      darkMode: false,
      language: "en",
    },
    addresses: data.addresses ?? [],
    wishlist: data.wishlist ?? [],
    cart: data.cart ?? [],
  } satisfies FirestoreUser, { merge: true });
}

export async function updateFirestoreUser(
  uid: string,
  patch: Partial<FirestoreUser>
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  await updateDoc(ref, patch as Record<string, unknown>);
}

export async function watchFirestoreUser(
  uid: string,
  callback: (user: FirestoreUser | null) => void
): Promise<Unsubscribe> {
  if (!isFirebaseConfigured || !firebaseDb) {
    callback(null);
    return () => {};
  }
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? (snap.data() as FirestoreUser) : null),
    () => callback(null)
  );
}

/* ---------- Addresses ---------- */

export async function addFirestoreAddress(
  uid: string,
  address: FirestoreAddress
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  const user = await getFirestoreUser(uid);
  if (!user) return;
  const addresses = [...(user.addresses ?? []), address];
  await updateDoc(ref, { addresses });
}

export async function updateFirestoreAddress(
  uid: string,
  addressId: string,
  patch: Partial<FirestoreAddress>
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  const user = await getFirestoreUser(uid);
  if (!user) return;
  const addresses = (user.addresses ?? []).map((a) =>
    a.id === addressId ? { ...a, ...patch } : a
  );
  await updateDoc(ref, { addresses });
}

export async function removeFirestoreAddress(
  uid: string,
  addressId: string
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  const user = await getFirestoreUser(uid);
  if (!user) return;
  const addresses = (user.addresses ?? []).filter((a) => a.id !== addressId);
  await updateDoc(ref, { addresses });
}

/* ---------- Cart ---------- */

export async function setFirestoreCart(
  uid: string,
  cart: FirestoreCartItem[]
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  await updateDoc(ref, { cart });
}

/* ---------- Wishlist ---------- */

export async function setFirestoreWishlist(
  uid: string,
  wishlist: FirestoreWishlistItem[]
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, USERS_COLLECTION, uid);
  await updateDoc(ref, { wishlist });
}

/* ---------- Orders (real-time listener) ---------- */

export async function createFirestoreOrder(
  order: FirestoreOrder
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  const ref = doc(firebaseDb, ORDERS_COLLECTION, order.orderId);
  await setDoc(ref, order);
}

export async function getFirestoreOrders(
  uid: string
): Promise<FirestoreOrder[]> {
  if (!isFirebaseConfigured || !firebaseDb) return [];
  const q = query(
    collection(firebaseDb, ORDERS_COLLECTION),
    where("userId", "==", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FirestoreOrder);
}

export function watchFirestoreOrders(
  uid: string,
  callback: (orders: FirestoreOrder[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !firebaseDb) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(firebaseDb, ORDERS_COLLECTION),
    where("userId", "==", uid)
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as FirestoreOrder)),
    () => callback([])
  );
}

/* ============================================================================
 * ORDER CREATION HELPERS — buildOrderObject + addOrderToUserDocument
 * Dual-write: top-level orders/{orderId} + users/{uid}/orders[] (arrayUnion)
 * ============================================================================ */

export interface BuildOrderObjectInput {
  orderId: string;
  orderNumber: string;
  userId: string;
  name: string;
  phone: string;
  addressDetails: FirestoreOrderAddressDetails;
  products: FirestoreOrderProduct[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  discount?: number;
  tax?: number;
  paymentMethod: string;       // "cod" | "online"
  paymentStatus: string;       // "Pending" | "Paid"
  notes?: string;
  /** Initial status — default "placed" */
  status?: string;
  adminNotes?: string;
}

/**
 * Build a plain-object FirestoreOrder from API/checkout input.
 *
 * Writes BOTH status fields (kept in sync):
 *   - status: "placed" (lowercase — primary, used by timeline)
 *   - orderStatus: "Placed" (capitalized — backward compat)
 *
 * Also writes:
 *   - orderTime: formatted display string "12 Jul 2026, 03:45 PM"
 *   - address: formatted single-line string
 *   - statusHistory: initial entry [{ status: "placed", timestamp, note }]
 */
export function buildOrderObject(input: BuildOrderObjectInput): FirestoreOrder {
  const now = new Date();
  const nowIso = now.toISOString();

  // Format: "12 Jul 2026, 03:45 PM"
  const orderTime = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Formatted address: "Name, house, street, city, state - pincode"
  const addressLine = [
    input.name,
    input.addressDetails.house,
    input.addressDetails.street,
    input.addressDetails.city,
    `${input.addressDetails.state} - ${input.addressDetails.pincode}`,
  ].filter(Boolean).join(", ");

  const initialStatus = input.status ?? "placed";

  const statusHistory: FirestoreOrderStatusEvent[] = [
    {
      status: initialStatus,
      timestamp: nowIso,
      note: "Order placed by customer.",
      updatedBy: input.userId,
    },
  ];

  return {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    userId: input.userId,
    orderPlacedAt: nowIso,
    orderTime,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    name: input.name,
    phone: input.phone,
    address: addressLine,
    addressDetails: input.addressDetails,
    products: input.products,
    subtotal: input.subtotal,
    shippingFee: input.shippingFee,
    shippingCharge: input.shippingFee,
    discount: input.discount ?? 0,
    totalAmount: input.totalAmount,
    status: initialStatus,                    // lowercase — primary
    orderStatus: capitalizeStatus(initialStatus), // capitalized — sync
    adminNotes: input.adminNotes ?? "",
    statusHistory,
    tax: input.tax ?? 0,
    notes: input.notes,
  };
}

/** Capitalize status for the orderStatus field: "placed" → "Placed", "out_for_delivery" → "Out For Delivery" */
function capitalizeStatus(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Atomic Firestore batch write — adds the order to BOTH:
 *   1. orders/{orderId}        (top-level collection — for admin reads + real-time)
 *   2. users/{uid} → orders[]   (embedded array — for client convenience)
 *
 * Either both succeed or both fail (Firestore batch atomicity).
 *
 * If Firebase is not configured, this is a no-op (logged).
 */
export async function addOrderToUserDocument(
  uid: string,
  order: FirestoreOrder
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) {
    console.warn("[firestore] addOrderToUserDocument: Firebase not configured — skipping dual write");
    return;
  }

  const orderRef = doc(firebaseDb, ORDERS_COLLECTION, order.orderId);
  const userRef = doc(firebaseDb, USERS_COLLECTION, uid);

  try {
    const batch = writeBatch(firebaseDb);
    // 1. Top-level orders/{orderId} doc
    batch.set(orderRef, order);
    // 2. Append order to users/{uid}.orders[] (arrayUnion — dedupes by reference equality)
    batch.update(userRef, { orders: arrayUnion(order) });
    await batch.commit();
  } catch (err) {
    // Fail-soft: log only. PostgreSQL/Prisma already saved the order — Firestore
    // is the secondary mirror. Admin can rebuild it from PostgreSQL if needed.
    console.error("[firestore] addOrderToUserDocument dual-write failed:", err);
  }
}

/* ============================================================================
 * REAL-TIME LISTENERS — onUserOrdersSnapshot + onUserOrderSnapshot
 * ============================================================================ */

/**
 * Subscribe to ALL of a user's orders in real-time.
 * Fires callback immediately with the current snapshot, and again whenever any
 * order changes. Returns an unsubscribe function.
 *
 * Used by: OrdersContext (orders list page).
 */
export function onUserOrdersSnapshot(
  uid: string,
  callback: (orders: FirestoreOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !firebaseDb) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(firebaseDb, ORDERS_COLLECTION),
    where("userId", "==", uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs
        .map((d) => d.data() as FirestoreOrder)
        .sort((a, b) => {
          // Sort by orderPlacedAt desc (string|Timestamp|Date)
          const tA = normalizeTime(a.orderPlacedAt);
          const tB = normalizeTime(b.orderPlacedAt);
          return tB - tA;
        });
      callback(orders);
    },
    (err) => {
      console.warn("[firestore] onUserOrdersSnapshot error:", err);
      onError?.(err);
      callback([]);
    }
  );
}

/**
 * Subscribe to a SINGLE order document in real-time.
 * Fires callback immediately with the current doc, and again whenever the doc
 * changes (e.g. admin updates status from "shipped" → "out_for_delivery").
 * Returns an unsubscribe function.
 *
 * Used by: OrderTrackingClient (order detail page).
 */
export function onUserOrderSnapshot(
  uid: string,
  orderId: string,
  callback: (order: FirestoreOrder | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !firebaseDb) {
    callback(null);
    return () => {};
  }
  const ref = doc(firebaseDb, ORDERS_COLLECTION, orderId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data() as FirestoreOrder;
      // Security: only deliver the doc if it belongs to this user
      if (data.userId !== uid) {
        console.warn("[firestore] onUserOrderSnapshot: doc belongs to different user — ignoring");
        callback(null);
        return;
      }
      callback(data);
    },
    (err) => {
      console.warn("[firestore] onUserOrderSnapshot error:", err);
      onError?.(err);
      callback(null);
    }
  );
}

/* ---------- Internal helpers ---------- */

function normalizeTime(
  t: FirestoreOrder["orderPlacedAt"]
): number {
  if (!t) return 0;
  if (typeof t === "string") return new Date(t).getTime();
  if (t instanceof Date) return t.getTime();
  // Firestore Timestamp
  if (typeof (t as Timestamp).toMillis === "function") {
    return (t as Timestamp).toMillis();
  }
  // C10 FIX: Handle plain objects from SSR hydration ({ seconds, nanoseconds })
  if (typeof t === "object" && t !== null && "seconds" in t) {
    return (t as { seconds: number; nanoseconds?: number }).seconds * 1000
      + ((t as { nanoseconds?: number }).nanoseconds ?? 0) / 1e6;
  }
  return 0;
}
