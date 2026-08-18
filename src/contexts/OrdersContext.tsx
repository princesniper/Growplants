"use client";

/**
 * GrowPlants — Orders Context (Dual-DB, Firestore real-time)
 *
 * Architecture (matches old project):
 *   1. Order creation: POST /api/orders (Prisma transaction) →
 *      client-side buildOrderObject() + addOrderToUserDocument() (Firestore dual write)
 *   2. Order list real-time: onUserOrdersSnapshot(uid) — query(collection('orders'), where('userId','==',uid))
 *   3. Order detail real-time: onUserOrderSnapshot(uid, orderId) — doc(orders, orderId)
 *
 * Status flow (12 statuses):
 *   Timeline (7): pending → confirmed → processing → packed → shipped → out_for_delivery → delivered
 *   Auxiliary:    cancelled, completed, returned, refunded, failed, on_hold
 *
 * Payment statuses: pending, paid, failed, refunded, partial_refund
 */
import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from "react";
import {
  onUserOrdersSnapshot,
  buildOrderObject,
  addOrderToUserDocument,
} from "@/lib/firebase/firestore";
import type { FirestoreOrder, FirestoreOrderProduct, FirestoreOrderAddressDetails } from "@/types/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string | null;
  /** Stock Keeping Unit — unique product code for inventory */
  sku?: string;
  /** Variant details (size, color, model, etc.) */
  variant?: {
    size?: string;
    color?: string;
    model?: string;
    label?: string; // generic variant label
  };
  /** Item-level subtotal (price × quantity) — computed if not provided */
  itemSubtotal?: number;
  /** Item-level status (for split shipments) */
  itemStatus?: OrderStatus;
}
export interface OrderAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  /** GPS coordinates (latitude/longitude) for verified addresses */
  latitude?: number | null;
  longitude?: number | null;
}

export type OrderStatus =
  // 7-step timeline statuses (exact match with admin panel)
  | "placed" | "confirmed" | "processing"
  | "packed" | "shipped" | "out_for_delivery" | "delivered"
  // Auxiliary statuses (non-timeline)
  | "cancelled" | "completed" | "returned" | "refunded" | "failed" | "on_hold"
  // Legacy compat (normalized to "placed" by normalizeAdminStatus)
  | "pending" | "payment_confirmed" | "quality_inspection";

export type PaymentMethod = "cod" | "card" | "upi" | "netbanking" | "wallet" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partial_refund";
export type ShippingMethod = "standard" | "express" | "same_day" | "pickup";

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  address: OrderAddress;
  /** Billing address (if different from shipping) */
  billingAddress?: OrderAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Transaction/reference ID from payment gateway (Razorpay, etc.) */
  transactionId?: string;
  /** Coupon code applied (if any) */
  couponCode?: string;
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
  statusHistory: { status: OrderStatus; date: string; note?: string }[];
  /** True if order is from in-memory mock fallback (no DB persistence) */
  _mock?: boolean;
  /** Shipping method (Standard / Express / Same Day / Pickup) */
  shippingMethod?: ShippingMethod;
  /** Shipping/tracking metadata (populated when order is shipped) */
  tracking?: {
    courierPartner?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shipmentId?: string;
    dispatchedAt?: string;
    deliveryPartner?: string;
    driverContact?: string;
    currentLocation?: string;
    estimatedArrivalTime?: string;
    deliveredAt?: string;
    recipientName?: string;
    proofOfDelivery?: string;
    estimatedDeliveryDate?: string;
    estimatedDeliveryWindow?: string;
  };
}

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (data: Omit<Order, "id" | "orderNumber" | "orderStatus" | "paymentStatus" | "createdAt" | "statusHistory">) => Promise<Order>;
  getOrder: (id: string) => Order | null;
  cancelOrder: (id: string, reason?: string) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);
const STORAGE_KEY = "growplants-orders";

function loadFromStorage(): Order[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (_e) { return []; }
}
function saveToStorage(orders: Order[]) {
  if (typeof window !== "undefined") try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch (_e) {}
}

/**
 * Map a FirestoreOrder (raw, with possibly-Timestamp fields) to the client-side Order shape.
 * Handles field name differences: orderPlacedAt→createdAt, status→orderStatus,
 * products→items, shippingFee→shipping, totalAmount→total, addressDetails→address.
 */
function mapFirestoreOrderToOrder(fo: FirestoreOrder): Order {
  // Normalize orderPlacedAt → ISO string
  let createdAtIso: string;
  const t = fo.orderPlacedAt;
  if (typeof t === "string") {
    createdAtIso = t;
  } else if (t instanceof Date) {
    createdAtIso = t.toISOString();
  } else if (t && typeof (t as { toMillis?: () => number }).toMillis === "function") {
    // Firestore Timestamp
    createdAtIso = new Date((t as { toMillis: () => number }).toMillis()).toISOString();
  } else {
    createdAtIso = new Date().toISOString();
  }

  // Map items (FirestoreOrderProduct → OrderItem)
  const items: OrderItem[] = (fo.products ?? []).map((p: FirestoreOrderProduct) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug ?? "",
    price: p.price,
    image: p.image,
    quantity: p.quantity,
    variantId: p.variantId ?? null,
  }));

  // Map address — handle missing addressDetails gracefully (old orders may have
  // only a flat `address` string, or no addressDetails at all)
  const rawAddr = (fo as unknown as Record<string, unknown>).addressDetails;
  const addr = (rawAddr && typeof rawAddr === "object"
    ? (rawAddr as FirestoreOrderAddressDetails)
    : {}) as Partial<FirestoreOrderAddressDetails>;
  const address: OrderAddress = {
    fullName: fo.name ?? "",
    phone: fo.phone ?? "",
    addressLine1: addr?.house ?? (typeof fo.address === "string" ? fo.address : "") ?? "",
    addressLine2: addr?.street ?? undefined,
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    pincode: addr?.pincode ?? "",
  };

  // Map statusHistory (FirestoreOrderStatusEvent[] → Order.statusHistory)
  // Handle both `timestamp` (new field name) and `date` (legacy field name)
  const statusHistory = (fo.statusHistory ?? []).map((h) => {
    const ht = (h as { timestamp?: unknown; date?: unknown }).timestamp ?? (h as { date?: unknown }).date;
    let dateIso: string;
    if (typeof ht === "string") dateIso = ht;
    else if (ht instanceof Date) dateIso = ht.toISOString();
    else if (ht && typeof (ht as { toMillis?: () => number }).toMillis === "function") {
      dateIso = new Date((ht as { toMillis: () => number }).toMillis()).toISOString();
    } else {
      dateIso = createdAtIso;
    }
    return {
      status: normalizeAdminStatus(h.status as string) as OrderStatus,
      date: dateIso,
      note: h.note,
    };
  });

  // If statusHistory is empty, add a fallback entry
  if (statusHistory.length === 0) {
    statusHistory.push({ status: "placed", date: createdAtIso, note: "Order placed" });
  }

  // Defensive status extraction: admin panel writes to `status` field.
  // Old docs may also have `orderStatus` (capitalized). Read both, normalize.
  const rawStatus = (fo as unknown as Record<string, unknown>).status
    ?? (fo as unknown as Record<string, unknown>).orderStatus
    ?? "pending";

  return {
    id: fo.orderId,
    orderNumber: fo.orderNumber ?? fo.orderId,
    items,
    subtotal: fo.subtotal ?? 0,
    shipping: fo.shippingFee ?? 0,
    discount: fo.discount ?? 0,
    tax: fo.tax ?? 0,
    total: fo.totalAmount ?? 0,
    address,
    paymentMethod: (fo.paymentMethod === "razorpay" ? "razorpay" : "cod") as PaymentMethod,
    paymentStatus: (fo.paymentStatus as PaymentStatus) ?? "pending",
    orderStatus: normalizeAdminStatus(rawStatus as string) as OrderStatus,
    notes: fo.notes,
    createdAt: createdAtIso,
    statusHistory,
  };
}

/**
 * Normalize status values from Firestore.
 *
 * Admin panel writes (lowercase `status` field):
 *   "placed", "confirmed", "processing", "packed", "shipped",
 *   "out_for_delivery", "delivered", "cancelled"
 *
 * Legacy/old docs may have (capitalized `orderStatus` field):
 *   "Placed", "Confirmed", "Processing", etc. → lowercased + passed through
 *   "pending" / "order_placed" → "placed" (old client wrote this)
 *   "preparing" → "processing"
 *   "quality_inspection" → "processing" (skip this step in 7-step timeline)
 */
function normalizeAdminStatus(status: string | undefined | null): string {
  if (!status) return "placed";
  const s = String(status).toLowerCase().trim();

  // Legacy: "pending" / "order_placed" → "placed" (our 7-step uses "placed")
  if (s === "pending" || s === "order_placed" || s === "order placed") return "placed";

  // Legacy: "preparing" → "processing"
  if (s === "preparing" || s === "preparing your order" || s === "preparing your plants") return "processing";

  // Legacy: "quality_inspection" was in old 8-step timeline; skip to "processing"
  if (s === "quality_inspection" || s === "quality check") return "processing";

  // Legacy: "payment_confirmed" was in old 9-step; treat as "confirmed"
  if (s === "payment_confirmed" || s === "payment confirmed") return "confirmed";

  // Pass through all valid 7-step statuses
  return s;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Real-time listener on user's orders collection
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setHydrated(true);
      return;
    }

    setLoading(true);
    setError(null);

    // onUserOrdersSnapshot handles Firebase-not-configured by calling callback([])
    const unsub = onUserOrdersSnapshot(
      user.id,
      (firestoreOrders) => {
        const mapped = firestoreOrders.map(mapFirestoreOrderToOrder);

        // Merge with any local-only orders (e.g. mock fallback) that aren't yet in Firestore
        const localOrders = loadFromStorage();
        const firestoreIds = new Set(mapped.map((o) => o.id));
        // FIX #1: Don't filter out _mock orders — they're the only persistence for dev fallback orders
        const localOnly = localOrders.filter((o) => !firestoreIds.has(o.id));
        const merged = [...mapped, ...localOnly].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setOrders(merged);
        saveToStorage(merged);
        setLoading(false);
        setHydrated(true);
      },
      (err) => {
        console.warn("[Orders] Firestore listener error:", err);
        setError(err.message);
        setOrders(loadFromStorage());
        setLoading(false);
        setHydrated(true);
      }
    );

    return () => unsub();
  }, [user]);

  // Persist to localStorage on changes
  useEffect(() => { if (hydrated) saveToStorage(orders); }, [orders, hydrated]);

  /**
   * Create a new order.
   *
   * Flow:
   *   1. POST /api/orders  (Prisma transaction → returns { order_number, id, ... })
   *   2. buildOrderObject() — construct FirestoreOrder from API response + checkout data
   *   3. addOrderToUserDocument() — Firestore batch write (orders/{id} + users/{uid}.orders[])
   *   4. Return Order object to caller (checkout page navigates to confirmation)
   *
   * If API call fails (e.g. dev without DB), we fall back to creating a local-only
   * order with a generated ID — Firestore dual write still attempted.
   */
  const createOrder = useCallback(
    async (data: Omit<Order, "id" | "orderNumber" | "orderStatus" | "paymentStatus" | "createdAt" | "statusHistory">): Promise<Order> => {
      const now = new Date().toISOString();
      // A3 FIX: Never mark as "paid" without payment verification.
      // All orders start as "pending" until Razorpay is integrated.
      const paymentStatus: PaymentStatus = "pending";

      // A7 FIX: Call API and THROW on failure — do NOT silently create mock order.
      // The checkout page must catch this error and show it to the user.
      let apiOrderId = "";
      let apiOrderNumber = "";
      let apiMock = false;

      // Get Firebase ID token
      const { firebaseAuth } = await import("@/lib/firebase/client");
      const idToken = firebaseAuth?.currentUser
        ? await firebaseAuth.currentUser.getIdToken()
        : null;

      if (!idToken) {
        throw new Error("Not authenticated. Please log in to place an order.");
      }

      let apiResponse: { success: boolean; order?: any; error?: string };

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            firebaseUid: user?.id,
            address: {
              fullName: data.address.fullName,
              phone: data.address.phone,
              addressLine1: data.address.addressLine1,
              addressLine2: data.address.addressLine2,
              landmark: data.address.landmark,
              city: data.address.city,
              state: data.address.state,
              pincode: data.address.pincode,
              // FIX Bug #1: MUST include GPS coordinates — API requires them
              latitude: data.address.latitude ?? null,
              longitude: data.address.longitude ?? null,
            },
            paymentMethod: data.paymentMethod,
            items: data.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              slug: i.slug,
              image: i.image,
              quantity: i.quantity,
              unitPrice: i.price,
            })),
            subtotal: data.subtotal,
            shippingCharge: data.shipping,
            discount: data.discount,
            tax: data.tax,
            totalAmount: data.total,
            notes: data.notes,
          }),
        });

        apiResponse = await res.json();

        if (!res.ok || !apiResponse.success || !apiResponse.order) {
          // API returned an error — throw with the server's error message
          throw new Error(apiResponse.error || `Order creation failed (HTTP ${res.status})`);
        }

        apiOrderId = apiResponse.order.id;
        apiOrderNumber = apiResponse.order.order_number;
        apiMock = Boolean(apiResponse.order._mock);
      } catch (err) {
        // Network error or API error — re-throw so checkout can handle it
        console.error("[Orders] createOrder API call failed:", err);
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Network error. Please check your connection and try again.");
      }

      // Build the Order object (only reached on API success)
      const order: Order = {
        ...data,
        id: apiOrderId,
        orderNumber: apiOrderNumber,
        orderStatus: "placed",
        paymentStatus,
        createdAt: now,
        statusHistory: [{ status: "placed", date: now, note: "Order placed" }],
        _mock: apiMock,
      };

      // Add to local state immediately (optimistic)
      setOrders((prev) => {
        const next = [order, ...prev.filter((o) => o.id !== order.id)];
        saveToStorage(next);
        return next;
      });

      // Firestore dual write (orders/{id} + users/{uid}.orders[])
      // This is secondary — Prisma is the source of truth. Fail-soft is OK here.
      if (user) {
        try {
          const firestoreOrder = buildOrderObject({
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: user.id,
            name: data.address.fullName,
            phone: data.address.phone,
            addressDetails: {
              house: data.address.addressLine1,
              street: data.address.addressLine2 ?? "",
              city: data.address.city,
              state: data.address.state,
              pincode: data.address.pincode,
              lat: data.address.latitude ?? null,
              lng: data.address.longitude ?? null,
              instructions: data.notes ?? "",
            },
            products: data.items.map((i) => ({
              id: i.productId,
              name: i.name,
              image: i.image,
              price: i.price,
              quantity: i.quantity,
              type: "plant",
              size: i.variant?.size ?? "Standard",
              status: "placed",
              slug: i.slug,
              variantId: i.variantId,
            })),
            subtotal: data.subtotal,
            shippingFee: data.shipping,
            totalAmount: data.total,
            discount: data.discount,
            tax: data.tax,
            paymentMethod: data.paymentMethod === "cod" ? "cod" : "online",
            paymentStatus: "Pending", // A3 FIX: always Pending until verified
            notes: data.notes,
            status: "placed",
          });
          // Fire-and-forget — fail-soft (Prisma is source of truth)
          addOrderToUserDocument(user.id, firestoreOrder).catch((e) =>
            console.warn("[Orders] Firestore dual write failed (non-blocking — Prisma has the order):", e)
          );
        } catch (e) {
          console.warn("[Orders] buildOrderObject/addOrderToUserDocument error:", e);
        }
      }

      return order;
    },
    [user]
  );

  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id) ?? null, [orders]);

  const cancelOrder = useCallback(async (id: string, reason?: string) => {
    const now = new Date().toISOString();
    const note = reason ?? "Cancelled by customer";
    const cs = { status: "cancelled" as const, date: now, note };

    // B3 FIX: Call backend API to cancel order (updates Prisma + Firestore)
    try {
      const { firebaseAuth } = await import("@/lib/firebase/client");
      const idToken = firebaseAuth?.currentUser
        ? await firebaseAuth.currentUser.getIdToken()
        : null;

      if (idToken) {
        // Call the admin status update API to set status to "cancelled"
        const res = await fetch(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            status: "cancelled",
            note,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.warn("[Orders] Cancel API failed:", data.error);
          // Still update local state — the order may not be in Firestore yet
        }
      }
    } catch (err) {
      console.warn("[Orders] Cancel API call failed (non-blocking):", err);
    }

    // Update local state (optimistic — regardless of API result)
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && (o.orderStatus === "placed" || o.orderStatus === "pending" || o.orderStatus === "confirmed")
          ? { ...o, orderStatus: "cancelled", statusHistory: [...o.statusHistory, cs] }
          : o
      )
    );
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, loading, error, createOrder, getOrder, cancelOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}

/* ============================================================================
 * Exported constants (back-compat)
 * ============================================================================ */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Order Placed",
  pending: "Order Placed", // legacy
  payment_confirmed: "Payment Confirmed", // legacy
  confirmed: "Order Confirmed",
  processing: "Preparing Your Order",
  quality_inspection: "Quality Inspection", // legacy
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  completed: "Completed",
  returned: "Returned",
  refunded: "Refunded",
  failed: "Failed",
  on_hold: "On Hold",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  placed: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700", // legacy
  payment_confirmed: "bg-emerald-100 text-emerald-700", // legacy
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  quality_inspection: "bg-teal-100 text-teal-700", // legacy
  packed: "bg-cyan-100 text-cyan-700",
  shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  returned: "bg-rose-100 text-rose-700",
  refunded: "bg-teal-100 text-teal-700",
  failed: "bg-red-100 text-red-700",
  on_hold: "bg-slate-100 text-slate-700",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partial_refund: "Partial Refund",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-blue-100 text-blue-700",
  partial_refund: "bg-orange-100 text-orange-700",
};

// Premium 8-step tracking timeline (back-compat export; canonical source is
// src/components/orders/timeline/timeline-stages.ts)
export const ORDER_TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order Placed" },
  { status: "confirmed", label: "Order Confirmed" },
  { status: "processing", label: "Preparing Your Order" },
  { status: "quality_inspection", label: "Quality Inspection" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "out_for_delivery", label: "Out For Delivery" },
  { status: "delivered", label: "Delivered" },
];
