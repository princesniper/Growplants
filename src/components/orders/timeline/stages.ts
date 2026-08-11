/**
 * GrowPlants — Premium Order Timeline Stages Config
 * ============================================================================
 * Data-driven 9-stage tracking timeline. Adding a future status (e.g.
 * return_requested, refund_initiated) is a 1-line addition here — the UI
 * components automatically render it without code changes.
 *
 * Stages (in order):
 *   1. Order Placed           (pending)
 *   2. Payment Confirmed      (payment_confirmed) — skipped for COD
 *   3. Order Confirmed        (confirmed)
 *   4. Preparing Your Plants  (processing)
 *   5. Quality Inspection     (quality_inspection) — botanical accent, GrowPlants unique
 *   6. Packed                 (packed)
 *   7. Shipped                (shipped) — shows courier/tracking#/shipmentId
 *   8. Out For Delivery       (out_for_delivery) — shows driver/location/ETA
 *   9. Delivered              (delivered) — shows delivery time/recipient
 * ============================================================================
 */
import {
  ShoppingBag, Wallet, CheckCircle2, Package, ShieldCheck, Box, Truck, MapPin, BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import type { Order, OrderStatus } from "@/contexts/OrdersContext";
import type { TimelineStage, TimelineStepState, StepState, TimelineDisplayField } from "./types";

export const TIMELINE_STAGES: TimelineStage[] = [
  {
    id: "order_placed",
    label: "Order Placed",
    description: "We have successfully received your order.",
    icon: ShoppingBag,
    status: "pending",
    displayFields: (order) => [
      { label: "Order ID", value: `#${order.orderNumber}`, icon: ShoppingBag },
      { label: "Order Date", value: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
      { label: "Order Time", value: new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
    ],
  },
  {
    id: "payment_confirmed",
    label: "Payment Confirmed",
    description: "Your payment has been verified successfully.",
    icon: Wallet,
    status: "payment_confirmed",
    /** Skip payment_confirmed for COD orders — payment happens on delivery */
    skipIf: (order) => order.paymentMethod === "cod",
    displayFields: (order) => [
      { label: "Payment Method", value: order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)" },
      { label: "Amount Paid", value: `₹${order.total.toFixed(2)}` },
    ],
  },
  {
    id: "order_confirmed",
    label: "Order Confirmed",
    description: "Our team has confirmed your order.",
    icon: CheckCircle2,
    status: "confirmed",
  },
  {
    id: "preparing",
    label: "Preparing Your Plants",
    description: "Your plants and products are being carefully prepared for dispatch.",
    icon: Package,
    status: "processing",
  },
  {
    id: "quality_inspection",
    label: "Quality Inspection",
    description: "Each plant is being inspected for health and quality before shipping.",
    icon: ShieldCheck,
    status: "quality_inspection",
    accent: "botanical",
  },
  {
    id: "packed",
    label: "Packed",
    description: "Your order has been packed safely.",
    icon: Box,
    status: "packed",
  },
  {
    id: "shipped",
    label: "Shipped",
    description: "Your package has left our warehouse.",
    icon: Truck,
    status: "shipped",
    displayFields: (order) => {
      const t = order.tracking;
      const fields: TimelineDisplayField[] = [];
      if (t?.courierPartner) fields.push({ label: "Courier Partner", value: t.courierPartner, icon: Truck });
      if (t?.trackingNumber) fields.push({ label: "Tracking Number", value: t.trackingNumber });
      if (t?.shipmentId) fields.push({ label: "Shipment ID", value: t.shipmentId });
      if (t?.dispatchedAt) fields.push({ label: "Dispatch Time", value: new Date(t.dispatchedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) });
      return fields;
    },
  },
  {
    id: "out_for_delivery",
    label: "Out For Delivery",
    description: "Your package is out for delivery.",
    icon: MapPin,
    status: "out_for_delivery",
    displayFields: (order) => {
      const t = order.tracking;
      const fields: TimelineDisplayField[] = [];
      if (t?.deliveryPartner) fields.push({ label: "Delivery Partner", value: t.deliveryPartner, icon: MapPin });
      if (t?.currentLocation) fields.push({ label: "Current Location", value: t.currentLocation });
      if (t?.estimatedArrivalTime) fields.push({ label: "Estimated Arrival", value: t.estimatedArrivalTime });
      if (t?.driverContact) fields.push({ label: "Driver Contact", value: t.driverContact });
      return fields;
    },
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Your order has been delivered successfully.",
    icon: BadgeCheck,
    status: "delivered",
    displayFields: (order) => {
      const t = order.tracking;
      const fields: TimelineDisplayField[] = [];
      if (t?.deliveredAt) fields.push({ label: "Delivery Time", value: new Date(t.deliveredAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) });
      if (t?.recipientName) fields.push({ label: "Recipient Name", value: t.recipientName, icon: BadgeCheck });
      if (t?.proofOfDelivery) fields.push({ label: "Proof of Delivery", value: t.proofOfDelivery });
      return fields;
    },
  },
];

/* ============================================================================
 * Pure helper functions — derive step state from order
 * ============================================================================ */

/**
 * Get the index of the current active stage in TIMELINE_STAGES.
 * Returns -1 if status is unknown or auxiliary (cancelled, failed, etc.).
 */
export function getCurrentStageIndex(order: Order): number {
  if (!order.orderStatus) return -1;
  // Auxiliary statuses don't map to a timeline stage
  const auxiliary: OrderStatus[] = ["cancelled", "completed", "returned", "refunded", "failed", "on_hold"];
  if (auxiliary.includes(order.orderStatus)) return -1;
  return TIMELINE_STAGES.findIndex((s) => s.status === order.orderStatus);
}

/**
 * Compute the state of a single stage given the order.
 * Pure function — no side effects.
 */
export function getStepStateForStage(
  stage: TimelineStage,
  stageIndex: number,
  order: Order,
): StepState {
  // Cancelled order — only step 1 (Order Placed) is completed, step 2 is cancelled, rest upcoming
  if (order.orderStatus === "cancelled") {
    if (stageIndex === 0) return "completed";
    if (stageIndex === 1) return "cancelled";
    return "upcoming";
  }

  // Skip if order data says so (e.g. payment_confirmed for COD)
  if (stage.skipIf?.(order)) return "skipped";

  const currentIndex = getCurrentStageIndex(order);
  if (currentIndex < 0) return "upcoming";
  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "current";
  return "upcoming";
}

/**
 * Build the full step state array for an order.
 * Returns array of TimelineStepState, one per stage.
 */
export function buildStepStates(order: Order): TimelineStepState[] {
  return TIMELINE_STAGES.map((stage, index) => {
    const state = getStepStateForStage(stage, index, order);
    // Find completion date from statusHistory
    const histEntry = order.statusHistory?.find((h) => h.status === stage.status);
    return {
      stage,
      state,
      completedAt: histEntry?.date ?? null,
      index,
    };
  });
}

/**
 * Compute progress percentage (0-100) based on completed stages.
 * Skipped stages count as completed (they don't block progress).
 */
export function computeProgress(order: Order): number {
  const stepStates = buildStepStates(order);
  if (order.orderStatus === "delivered") return 100;
  if (order.orderStatus === "cancelled") return 0;
  const completedOrSkipped = stepStates.filter(
    (s) => s.state === "completed" || s.state === "skipped" || s.state === "current",
  ).length;
  return Math.round((completedOrSkipped / TIMELINE_STAGES.length) * 100);
}

/**
 * Get the current active stage (or null if none).
 */
export function getCurrentStage(order: Order): TimelineStage | null {
  const idx = getCurrentStageIndex(order);
  return idx >= 0 ? TIMELINE_STAGES[idx] : null;
}

/**
 * Get the next upcoming stage (or null if delivered or no upcoming).
 */
export function getNextStage(order: Order): TimelineStage | null {
  const stepStates = buildStepStates(order);
  const upcoming = stepStates.find((s) => s.state === "upcoming");
  return upcoming?.stage ?? null;
}

/**
 * Get ETA string for display.
 */
export function getEstimatedDelivery(order: Order): string | null {
  const t = order.tracking;
  if (t?.estimatedDeliveryDate && t?.estimatedDeliveryWindow) {
    return `${t.estimatedDeliveryDate} · ${t.estimatedDeliveryWindow}`;
  }
  if (t?.estimatedDeliveryDate) return t.estimatedDeliveryDate;
  if (t?.estimatedArrivalTime) return t.estimatedArrivalTime;
  // Fallback: 3-5 business days from now
  const eta = new Date();
  eta.setDate(eta.getDate() + 4);
  return eta.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Get the last updated timestamp from statusHistory.
 */
export function getLastUpdated(order: Order): string | null {
  if (!order.statusHistory?.length) return order.createdAt;
  return order.statusHistory[order.statusHistory.length - 1]?.date ?? order.createdAt;
}
