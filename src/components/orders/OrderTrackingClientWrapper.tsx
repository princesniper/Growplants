"use client";

/**
 * GrowPlants — OrderTrackingClientWrapper
 * ============================================================================
 * Handles Firestore real-time subscription, loading/error states, and renders
 * the ProfessionalOrderDetail component when order is available.
 * ============================================================================
 */
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useOrders,
  type Order,
} from "@/contexts/OrdersContext";
import { useAuth } from "@/contexts/AuthContext";
import { onUserOrderSnapshot } from "@/lib/firebase/firestore";
import type { FirestoreOrder, FirestoreOrderAddressDetails } from "@/types/firebase";
import {
  TrackingSkeleton,
  TrackingErrorState,
  TrackingEmptyState,
} from "@/components/orders/timeline";
import { ProfessionalOrderDetail } from "@/components/orders/ProfessionalOrderDetail";
import { appToast } from "@/lib/toast";

interface OrderTrackingClientWrapperProps {
  orderId: string;
}

const NOT_FOUND_TIMEOUT_MS = 30_000; // 30 seconds (was 10s — too short for slow connections)

export function OrderTrackingClientWrapper({ orderId }: OrderTrackingClientWrapperProps) {
  const { user } = useAuth();
  const { getOrder, cancelOrder } = useOrders();

  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setError(null);
    setLiveOrder(null);

    timeoutRef.current = setTimeout(() => {
      setNotFound(true);
      setLoading(false);
    }, NOT_FOUND_TIMEOUT_MS);

    const unsub = onUserOrderSnapshot(
      user.id,
      orderId,
      (fo: FirestoreOrder | null) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (!fo) {
          const cached = getOrder(orderId);
          if (cached) {
            setLiveOrder(enrichOrder(cached));
            setNotFound(false);
          } else {
            setNotFound(true);
          }
        } else {
          setLiveOrder(enrichOrder(mapFirestoreOrderInline(fo)));
          setNotFound(false);
        }
        setLoading(false);
      },
      (err) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        const cached = getOrder(orderId);
        if (cached) {
          setLiveOrder(enrichOrder(cached));
          setNotFound(false);
        } else {
          setError(err.message);
          setNotFound(true);
        }
        setLoading(false);
      },
    );

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]);

  if (loading && !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <div className="mb-4 h-4 w-32 bg-slate-100 rounded animate-shimmer" />
        <TrackingSkeleton />
      </Container>
    );
  }

  if (error && !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <Link href="/account/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1A6B3C] mb-4">
          <ArrowLeft className="size-3.5" /> Back to Orders
        </Link>
        <TrackingErrorState message={error} onRetry={() => window.location.reload()} />
      </Container>
    );
  }

  if (notFound || !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <Link href="/account/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1A6B3C] mb-4">
          <ArrowLeft className="size-3.5" /> Back to Orders
        </Link>
        <TrackingEmptyState orderNumber={orderId} />
      </Container>
    );
  }

  const order = liveOrder;

  const handleCancel = () => {
    cancelOrder(order.id, cancelReason || "Cancelled by customer");
    setShowCancelModal(false);
    appToast.success("Order cancelled", `Order #${order.orderNumber} has been cancelled`);
  };

  return (
    <Container className="py-6 md:py-10">
      <Link href="/account/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1A6B3C] mb-5 transition-colors">
        <ArrowLeft className="size-3.5" /> Back to Orders
      </Link>

      <ProfessionalOrderDetail
        order={order}
        onCancel={() => setShowCancelModal(true)}
        onReorder={() => appToast.info("Reorder", "Adding items to cart...")}
        onReturn={() => appToast.info("Return Request", "Opening return request form...")}
      />

      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Cancel Order?</h2>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Cancel order <span className="font-bold">#{order.orderNumber}</span>? You&apos;ll receive a confirmation email once the cancellation is processed.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Reason <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Tell us why you're cancelling..." className="resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>Keep Order</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleCancel}>Yes, Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

/* ============================================================================
 * Enrich order with mock data for fields not in Firestore yet
 * ============================================================================ */
function enrichOrder(order: Order): Order {
  return {
    ...order,
    shippingMethod: order.shippingMethod ?? "standard",
    tracking: order.tracking ?? (["shipped", "out_for_delivery", "delivered"].includes(order.orderStatus) ? {
      courierPartner: "GrowPlants Express",
      trackingNumber: `GP${order.orderNumber.slice(-8)}`,
      trackingUrl: `https://www.delhivery.com/tracking/GP${order.orderNumber.slice(-8)}`,
      shipmentId: `SHP-${order.id.slice(-6)}`,
      dispatchedAt: order.statusHistory.find((s) => s.status === "shipped")?.date,
      estimatedDeliveryDate: new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDeliveryWindow: "10:00 AM – 6:00 PM",
      deliveryPartner: order.orderStatus === "out_for_delivery" ? "Rajesh Kumar" : undefined,
      driverContact: order.orderStatus === "out_for_delivery" ? "+91 99999 99999" : undefined,
      currentLocation: order.orderStatus === "out_for_delivery" ? "Sonipat Hub" : undefined,
      deliveredAt: order.orderStatus === "delivered" ? order.statusHistory.find((s) => s.status === "delivered")?.date : undefined,
      recipientName: order.orderStatus === "delivered" ? order.address.fullName : undefined,
      proofOfDelivery: order.orderStatus === "delivered" ? "Signature captured" : undefined,
    } : undefined),
    transactionId: order.transactionId ?? (order.paymentMethod !== "cod" && order.paymentStatus === "paid" ? `pay_${order.id.slice(-12)}` : undefined),
    items: order.items.map((item, i) => ({
      ...item,
      sku: item.sku ?? `GP-${item.productId.slice(-6).toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
    })),
  };
}

/* ============================================================================
 * Inline mapper — FirestoreOrder → Order
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
    email: (fo as unknown as { email?: string }).email,
    addressLine1: addr?.house ?? (typeof fo.address === "string" ? fo.address : "") ?? "",
    addressLine2: addr?.street ?? undefined,
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    pincode: addr?.pincode ?? "",
  };

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
    return { status: normalizeAdminStatus(h.status as string) as Order["orderStatus"], date: dateIso, note: h.note };
  });

  if (statusHistory.length === 0) {
    statusHistory.push({ status: "placed", date: createdAtIso, note: "Order placed" });
  }

  // Read both `status` (admin writes this) and `orderStatus` (old field) for compat
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
    paymentMethod: (fo.paymentMethod === "razorpay" ? "razorpay" : "cod") as Order["paymentMethod"],
    paymentStatus: (fo.paymentStatus as Order["paymentStatus"]) ?? "pending",
    orderStatus: normalizeAdminStatus(rawStatus as string) as Order["orderStatus"],
    notes: fo.notes ?? undefined,
    createdAt: createdAtIso,
    statusHistory,
  };
}

/**
 * Normalize admin panel status values to our 7-step timeline's expected values.
 *
 * Admin writes (lowercase `status` field):
 *   "placed", "confirmed", "processing", "packed", "shipped",
 *   "out_for_delivery", "delivered", "cancelled"
 *
 * Legacy values normalized:
 *   - "pending" / "order_placed" → "placed"
 *   - "preparing" → "processing"
 *   - "quality_inspection" → "processing" (skip step in 7-step timeline)
 *   - "payment_confirmed" → "confirmed"
 */
function normalizeAdminStatus(status: string | undefined | null): string {
  if (!status) return "placed";
  const s = String(status).toLowerCase().trim();
  if (s === "pending" || s === "order_placed" || s === "order placed") return "placed";
  if (s === "preparing" || s === "preparing your order" || s === "preparing your plants") return "processing";
  if (s === "quality_inspection" || s === "quality check") return "processing";
  if (s === "payment_confirmed" || s === "payment confirmed") return "confirmed";
  return s;
}
