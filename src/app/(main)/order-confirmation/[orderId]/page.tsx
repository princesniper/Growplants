"use client";

/**
 * GrowPlants — Order Confirmation Page (FIXED)
 * ============================================================================
 * FIX #3 (CRITICAL): Now uses Firestore real-time listener (onUserOrderSnapshot)
 *   with 30-second timeout fallback to local cache. Previously only did synchronous
 *   getOrder() which returned null if the order hadn't synced to state yet.
 *
 * FIX #4 (HIGH): Shows loading skeleton while waiting for order data.
 * FIX #5 (MEDIUM): Uses order.tracking?.estimatedDeliveryDate if available.
 * FIX #7 (LOW): Removed unused formatDate import.
 * ============================================================================
 */
import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Download, ArrowRight, MapPin, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useOrders, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  type Order,
} from "@/contexts/OrdersContext";
import { useAuth } from "@/contexts/AuthContext";
import { onUserOrderSnapshot } from "@/lib/firebase/firestore";
import type { FirestoreOrder, FirestoreOrderAddressDetails } from "@/types/firebase";
import { formatINR } from "@/lib/utils";
import { OrderTimeline, TrackingSkeleton } from "@/components/orders/timeline";

const FETCH_TIMEOUT_MS = 30_000;

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { getOrder } = useOrders();
  const { user } = useAuth();

  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX #3: Subscribe to Firestore real-time listener + fallback to local cache
  useEffect(() => {
    // First try local cache (instant — order was just created)
    const cached = getOrder(orderId);
    if (cached) {
      setLiveOrder(cached);
      setLoading(false);
      setNotFound(false);
      // Still set up the listener for real-time updates (status changes)
      // but don't show loading since we already have the cached order
    }

    if (!user) {
      // No user — try local cache only
      if (!cached) {
        setNotFound(true);
      }
      setLoading(false);
      return;
    }

    // Set up Firestore real-time listener
    timeoutRef.current = setTimeout(() => {
      // If we still don't have the order after 30s, show "not found"
      if (!cached && !liveOrder) {
        setNotFound(true);
        setLoading(false);
      }
    }, FETCH_TIMEOUT_MS);

    const unsub = onUserOrderSnapshot(
      user.id,
      orderId,
      (fo: FirestoreOrder | null) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!fo) {
          // Doc doesn't exist in Firestore yet — fall back to local cache
          if (cached) {
            setLiveOrder(cached);
            setNotFound(false);
          } else {
            setNotFound(true);
          }
        } else {
          // Map FirestoreOrder → Order (same logic as OrderTrackingClientWrapper)
          const mapped = mapFirestoreOrderInline(fo);
          setLiveOrder(mapped);
          setNotFound(false);
        }
        setLoading(false);
      },
      () => {
        // Error — fall back to local cache
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (cached) {
          setLiveOrder(cached);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    );

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]);

  /* ---------- Loading state ---------- */
  if (loading && !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <div className="mb-4 h-4 w-32 bg-slate-100 rounded animate-pulse" />
        <TrackingSkeleton />
      </Container>
    );
  }

  /* ---------- Not found state ---------- */
  if (notFound || !liveOrder) {
    return (
      <Container className="py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Order not found</h1>
        <p className="text-sm text-slate-500">This order may have been removed or is still syncing.</p>
        <Button asChild className="bg-[#1A6B3C] hover:bg-[#16A34A]"><Link href="/account/orders">View My Orders</Link></Button>
      </Container>
    );
  }

  const order = liveOrder;

  // FIX #5: Use order.tracking?.estimatedDeliveryDate if available
  const estimatedDelivery = order.tracking?.estimatedDeliveryDate
    ?? new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <Container className="py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-6 animate-page-enter">
        {/* Success header */}
        <div className="text-center space-y-3">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto animate-scale-in">
            <CheckCircle2 className="size-8 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A6B3C]">Order Placed Successfully!</h1>
          <p className="text-sm text-slate-500">Thank you for your order. We&apos;ll send updates via SMS and email.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F8F1] rounded-full">
            <span className="text-sm text-slate-600">Order ID:</span>
            <span className="text-sm font-bold text-[#1A6B3C]">#{order.orderNumber}</span>
          </div>
        </div>

        {/* Status + Timeline */}
        <OrderTimeline
          order={order}
          estimatedDelivery={estimatedDelivery}
          estimatedDeliveryTime="10:00 AM – 6:00 PM"
        />

        {/* Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Items ({order.items.length})</h2>
          <Separator />
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="relative size-12 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</p>
                <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatINR(item.price)}</p>
              </div>
              <p className="text-sm font-bold text-[#1A6B3C] tabular-nums">{formatINR(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Delivery + Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><MapPin className="size-3.5" />Delivery Address</h3>
            <p className="text-sm font-medium text-slate-800">{order.address.fullName}</p>
            <p className="text-xs text-slate-600">{order.address.addressLine1}</p>
            <p className="text-xs text-slate-600">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
            <p className="text-xs text-slate-600 mt-1">📞 {order.address.phone}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><CreditCard className="size-3.5" />Payment</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Method</span>
              <span className="text-sm font-medium text-slate-800">{order.paymentMethod === "cod" ? "COD" : "Online (Razorpay)"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", PAYMENT_STATUS_COLORS[order.paymentStatus])}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
            </div>
          </div>
        </div>

        {/* Price summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-medium tabular-nums">{formatINR(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span className="font-medium tabular-nums">-{formatINR(order.discount)}</span></div>}
          <div className="flex justify-between text-sm"><span className="text-slate-600">Delivery</span><span className="font-medium tabular-nums">{order.shipping === 0 ? "FREE" : formatINR(order.shipping)}</span></div>
          <Separator />
          <div className="flex justify-between items-baseline"><span className="text-base font-bold text-slate-800">Total Amount</span><span className="text-xl font-bold text-[#1A6B3C] tabular-nums">{formatINR(order.total)}</span></div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2"><Link href="/account/orders">View My Orders<ArrowRight className="size-4" /></Link></Button>
          <Button asChild variant="outline" className="gap-2"><Link href="/shop">Continue Shopping</Link></Button>
        </div>
      </div>
    </Container>
  );
}

/* ============================================================================
 * Inline mapper — FirestoreOrder → Order (same as OrderTrackingClientWrapper)
 * ============================================================================ */
function mapFirestoreOrderInline(fo: FirestoreOrder): Order {
  let createdAtIso: string;
  const t = fo.orderPlacedAt;
  if (typeof t === "string") createdAtIso = t;
  else if (t instanceof Date) createdAtIso = t.toISOString();
  else if (t && typeof (t as { toMillis?: () => number }).toMillis === "function") {
    createdAtIso = new Date((t as { toMillis: () => number }).toMillis()).toISOString();
  } else {
    createdAtIso = new Date().toISOString();
  }

  const items = (fo.products ?? []).map((p) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug ?? "",
    price: p.price,
    image: p.image,
    quantity: p.quantity,
    variantId: p.variantId ?? null,
  }));

  const rawAddr = (fo as unknown as Record<string, unknown>).addressDetails;
  const addr = (rawAddr && typeof rawAddr === "object" ? (rawAddr as FirestoreOrderAddressDetails) : {}) as Partial<FirestoreOrderAddressDetails>;
  const address = {
    fullName: fo.name ?? "",
    phone: fo.phone ?? "",
    addressLine1: addr?.house ?? (typeof fo.address === "string" ? fo.address : "") ?? "",
    addressLine2: addr?.street ?? undefined,
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    pincode: addr?.pincode ?? "",
  };

  const statusHistory = (fo.statusHistory ?? []).map((h) => {
    const ht = (h as unknown as Record<string, unknown>).timestamp ?? (h as unknown as Record<string, unknown>).date;
    let dateIso: string;
    if (typeof ht === "string") dateIso = ht;
    else if (ht instanceof Date) dateIso = ht.toISOString();
    else if (ht && typeof (ht as { toMillis?: () => number }).toMillis === "function") {
      dateIso = new Date((ht as { toMillis: () => number }).toMillis()).toISOString();
    } else {
      dateIso = createdAtIso;
    }
    return { status: (h.status as Order["orderStatus"]) ?? "placed", date: dateIso, note: h.note };
  });

  if (statusHistory.length === 0) {
    statusHistory.push({ status: "placed", date: createdAtIso, note: "Order placed" });
  }

  const rawStatus = (fo as unknown as Record<string, unknown>).status
    ?? (fo as unknown as Record<string, unknown>).orderStatus
    ?? "placed";
  const normalizedStatus = normalizeAdminStatus(rawStatus as string) as Order["orderStatus"];

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
    paymentMethod: (fo.paymentMethod === "razorpay" ? "razorpay" : "cod") as Order["paymentMethod"],
    paymentStatus: (fo.paymentStatus as Order["paymentStatus"]) ?? "pending",
    orderStatus: normalizedStatus,
    notes: fo.notes,
    createdAt: createdAtIso,
    statusHistory,
  };
}

function normalizeAdminStatus(status: string | undefined | null): string {
  if (!status) return "placed";
  const s = String(status).toLowerCase().trim();
  if (s === "pending" || s === "order_placed" || s === "order placed") return "placed";
  if (s === "preparing" || s === "preparing your order" || s === "preparing your plants") return "processing";
  if (s === "quality_inspection" || s === "quality check") return "processing";
  if (s === "payment_confirmed" || s === "payment confirmed") return "confirmed";
  return s;
}
