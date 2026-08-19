"use client";

/**
 * GrowPlants — OrderTrackingClient (Comprehensive Edition)
 * ============================================================================
 * Client wrapper that subscribes to a single order's Firestore document and
 * renders the complete professional order detail experience with 7 sections:
 *
 *   1. Order Information (OrderHeaderCard) — ID, status, date, total, payment badges
 *   2. Visual Status Timeline (OrderTimeline) — premium 9-step tracker
 *   3. Customer Details (CustomerDetailsCard) — name, phone, email, shipping + billing
 *   4. Product/Item Details (OrderItemsCard) — image, name, SKU, variant, qty, price, subtotal
 *   5. Payment Information (PaymentSummaryCard) — method, status, transaction ID, breakdown
 *   6. Shipping & Delivery (ShippingDeliveryCard) — method, courier, tracking#, ETA
 *   7. Order Actions (OrderActionsBar) — invoice, cancel, return, exchange, reorder, support
 *
 * Layout (Desktop, lg+):
 *   ┌─────────────────────────────────────┬───────────────────┐
 *   │ OrderHeaderCard (full width)        │                   │
 *   │ OrderTimeline (premium 9-step)      │ CustomerDetailsCard│
 *   │ OrderItemsCard                      │ PaymentSummaryCard │
 *   │ ShippingDeliveryCard                │ OrderActionsBar    │
 *   └─────────────────────────────────────┴───────────────────┘
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
  OrderTimeline,
  TrackingSkeleton,
  TrackingErrorState,
  TrackingEmptyState,
} from "@/components/orders/timeline";
import { OrderHeaderCard } from "@/components/orders/OrderHeaderCard";
import { OrderItemsCard } from "@/components/orders/OrderItemsCard";
import { PaymentSummaryCard } from "@/components/orders/PaymentSummaryCard";
import { CustomerDetailsCard } from "@/components/orders/CustomerDetailsCard";
import { ShippingDeliveryCard } from "@/components/orders/ShippingDeliveryCard";
import { OrderActionsBar } from "@/components/orders/OrderActionsBar";
import { appToast } from "@/lib/toast";

interface OrderTrackingClientProps {
  orderId: string;
}

const NOT_FOUND_TIMEOUT_MS = 10_000;

export function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
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
          const mapped = mapFirestoreOrderInline(fo);
          setLiveOrder(enrichOrder(mapped));
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

  /* ---------- LOADING STATE ---------- */
  if (loading && !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <div className="mb-4 h-4 w-32 bg-slate-100 rounded animate-shimmer" />
        <TrackingSkeleton />
      </Container>
    );
  }

  /* ---------- ERROR STATE ---------- */
  if (error && !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <Link
          href="/account/orders"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1A6B3C] mb-4"
        >
          <ArrowLeft className="size-3.5" /> Back to Orders
        </Link>
        <TrackingErrorState
          message={error}
          onRetry={() => window.location.reload()}
        />
      </Container>
    );
  }

  /* ---------- NOT FOUND STATE ---------- */
  if (notFound || !liveOrder) {
    return (
      <Container className="py-6 md:py-10">
        <Link
          href="/account/orders"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1A6B3C] mb-4"
        >
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

  const handleReorder = () => {
    appToast.info("Reorder", "Adding items to cart...");
  };

  const handleDownloadInvoice = () => {
    appToast.info("Invoice", "Generating invoice PDF...");
  };

  const handleReturn = () => {
    appToast.info("Return Request", "Opening return request form...");
  };

  const handleExchange = () => {
    appToast.info("Exchange Request", "Opening exchange request form...");
  };

  return (
    <Container className="py-6 md:py-10">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1A6B3C] mb-5 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to Orders
      </Link>

      {/* Main grid: 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* ═══════════════ LEFT COLUMN (2/3) ═══════════════ */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Order Information Header */}
          <OrderHeaderCard order={order} />

          {/* 2. Visual Order Status Timeline */}
          <OrderTimeline
            order={order}
            estimatedDelivery={computeETA(order)}
            estimatedDeliveryTime="10:00 AM – 6:00 PM"
          />

          {/* 3. Product/Item Details */}
          <OrderItemsCard order={order} />

          {/* 6. Shipping & Delivery */}
          <ShippingDeliveryCard order={order} />
        </div>

        {/* ═══════════════ RIGHT COLUMN (1/3) ═══════════════ */}
        <div className="lg:col-span-1 space-y-5">
          {/* 2. Customer Details */}
          <CustomerDetailsCard order={order} />

          {/* 5. Payment Information */}
          <PaymentSummaryCard order={order} />

          {/* 7. Order Actions */}
          <OrderActionsBar
            order={order}
            onCancel={() => setShowCancelModal(true)}
            onReorder={handleReorder}
            onDownloadInvoice={handleDownloadInvoice}
            onReturn={handleReturn}
            onExchange={handleExchange}
          />

          {/* GrowPlants Care guarantee */}
          <div className="bg-gradient-to-br from-[#F3F8F1] to-white rounded-2xl border border-[#1A6B3C]/10 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-[#1A6B3C] flex items-center justify-center shrink-0">
                <span className="text-lg">🌿</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 mb-1">GrowPlants Care</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Every plant comes with a 7-day health guarantee. If your plant arrives damaged or unhealthy, we&apos;ll replace it free.
                </p>
                <Link
                  href="/refund-policy"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A6B3C] hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ CANCEL MODAL ═══════════════ */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
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
              <Label className="text-sm font-medium">
                Reason <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tell us why you're cancelling (helps us improve)..."
                className="resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Order
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancel}
              >
                Yes, Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

/* ============================================================================
 * Enrich order with mock data for fields not yet in Firestore
 * (In production, these would come from the API)
 * ============================================================================ */
function enrichOrder(order: Order): Order {
  return {
    ...order,
    // Add shipping method if not set
    shippingMethod: order.shippingMethod ?? "standard",
    // Add tracking info mock if order is shipped
    tracking: order.tracking ?? (["shipped", "out_for_delivery", "delivered"].includes(order.orderStatus) ? {
      courierPartner: "GrowPlants Express",
      trackingNumber: `GP${order.orderNumber.slice(-8)}`,
      trackingUrl: `https://www.delhivery.com/tracking/GP${order.orderNumber.slice(-8)}`,
      shipmentId: `SHP-${order.id.slice(-6)}`,
      dispatchedAt: order.statusHistory.find((s) => s.status === "shipped")?.date,
      estimatedDeliveryDate: computeETA(order),
      estimatedDeliveryWindow: "10:00 AM – 6:00 PM",
      deliveryPartner: order.orderStatus === "out_for_delivery" ? "Rajesh Kumar" : undefined,
      driverContact: order.orderStatus === "out_for_delivery" ? "+91 99999 99999" : undefined,
      currentLocation: order.orderStatus === "out_for_delivery" ? "Sonipat Hub" : undefined,
      deliveredAt: order.orderStatus === "delivered"
        ? order.statusHistory.find((s) => s.status === "delivered")?.date
        : undefined,
      recipientName: order.orderStatus === "delivered" ? order.address.fullName : undefined,
      proofOfDelivery: order.orderStatus === "delivered" ? "Signature captured" : undefined,
    } : undefined),
    // Add transaction ID for online payments
    transactionId: order.transactionId ?? (order.paymentMethod !== "cod" && order.paymentStatus === "paid"
      ? `pay_${order.id.slice(-12)}`
      : undefined),
    // Add SKU + variant to items if not present
    items: order.items.map((item, i) => ({
      ...item,
      sku: item.sku ?? `GP-${item.productId.slice(-6).toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
    })),
  };
}

/* ============================================================================
 * Helpers
 * ============================================================================ */

function computeETA(order: Order): string {
  if (order.orderStatus === "delivered") {
    const lastHistory = order.statusHistory[order.statusHistory.length - 1];
    return lastHistory?.date ?? order.createdAt;
  }
  const d = new Date(order.createdAt);
  d.setDate(d.getDate() + 3);
  return d.toISOString();
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
  const addr = (rawAddr && typeof rawAddr === "object"
    ? (rawAddr as FirestoreOrderAddressDetails)
    : {}) as Partial<FirestoreOrderAddressDetails>;
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
    return {
      status: (h.status as Order["orderStatus"]) ?? "pending",
      date: dateIso,
      note: h.note,
    };
  });

  if (statusHistory.length === 0) {
    statusHistory.push({ status: "pending", date: createdAtIso, note: "Order placed" });
  }

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
    orderStatus: (fo.status as Order["orderStatus"]) ?? "pending",
    notes: fo.notes ?? undefined,
    createdAt: createdAtIso,
    statusHistory,
  };
}
