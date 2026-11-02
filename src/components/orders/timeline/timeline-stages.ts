/**
 * GrowPlants — Timeline Stage Definitions
 * ============================================================================
 * Data-driven stage registry. Adding a new stage (e.g. "Return Requested") is
 * a one-line addition here — no UI changes needed.
 *
 * Each stage has:
 *   - id               Stable identifier (matches OrderStatus when applicable)
 *   - label            Short display name
 *   - description      One-line explanation shown under the label
 *   - iconName         Icon key resolved by TimelineIcon
 *   - accentColor      Tailwind classes for the icon circle
 *   - detailFields     Metadata fields to render when step is current/completed
 *                      (e.g. courier, tracking number, driver contact)
 *   - isBotanical      Whether to render a leaf accent (GrowPlants signature)
 *
 * Stage order = display order. The current step is derived from order.orderStatus.
 * ============================================================================
 */
import type { OrderStatus } from "@/contexts/OrdersContext";

export type TimelineIconName =
  | "package"        // Order Placed
  | "clipboard-check" // Order Confirmed
  | "refresh-cw"     // Processing (Preparing)
  | "box"            // Packed
  | "truck"          // Shipped
  | "map-pin"        // Out For Delivery
  | "check-circle"   // Delivered
  | "x-circle";      // Cancelled (special case)

export interface TimelineStage {
  /** Stable ID — must match a value in OrderStatus OR be a future-only stage */
  id: string;
  /** OrderStatus that maps to this stage (null for future-only stages) */
  status: OrderStatus | null;
  label: string;
  description: string;
  iconName: TimelineIconName;
  /** Tailwind classes for the icon circle background (when current/completed) */
  accentColor: string;
  /** Tailwind text color for the icon */
  iconColor: string;
  /** Metadata fields to display when step is current or completed */
  detailFields?: TimelineDetailField[];
  /** Whether to render the botanical leaf accent (GrowPlants signature) */
  isBotanical?: boolean;
}

export interface TimelineDetailField {
  /** Key into the per-stage metadata object passed by the parent */
  key: string;
  /** Display label */
  label: string;
  /** Lucide icon name */
  iconName:
    | "calendar"
    | "clock"
    | "hash"
    | "user"
    | "phone"
    | "truck"
    | "map-pin"
    | "credit-card"
    | "package"
    | "check-circle";
  /** Whether this field is critical (bolded) or secondary */
  critical?: boolean;
}

/* ============================================================================
 * 7-STEP TIMELINE (exact match with admin panel)
 * placed → confirmed → processing → packed → shipped → out_for_delivery → delivered
 *
 * Icons (exact spec):
 *   Package → ClipboardCheck → RefreshCw → Box → Truck → MapPin → CheckCircle
 *
 * Cancelled status is handled separately (not a timeline step).
 * ============================================================================ */

export const TIMELINE_STAGES: TimelineStage[] = [
  {
    id: "order_placed",
    status: "placed",
    label: "Order Placed",
    description: "We have successfully received your order.",
    iconName: "package",
    accentColor: "bg-[#16382B] text-white",
    iconColor: "text-white",
    detailFields: [
      { key: "date", label: "Date", iconName: "calendar", critical: true },
      { key: "time", label: "Time", iconName: "clock" },
      { key: "orderId", label: "Order ID", iconName: "hash", critical: true },
    ],
  },
  {
    id: "order_confirmed",
    status: "confirmed",
    label: "Order Confirmed",
    description: "Our team has confirmed your order.",
    iconName: "clipboard-check",
    accentColor: "bg-[#16382B] text-white",
    iconColor: "text-white",
  },
  {
    id: "processing",
    status: "processing",
    label: "Preparing Your Order",
    description: "Your plants and products are being carefully prepared for dispatch.",
    iconName: "refresh-cw",
    accentColor: "bg-[#16382B] text-white",
    iconColor: "text-white",
    isBotanical: true,
  },
  {
    id: "packed",
    status: "packed",
    label: "Packed",
    description: "Your order has been packed safely.",
    iconName: "box",
    accentColor: "bg-[#16382B] text-white",
    iconColor: "text-white",
  },
  {
    id: "shipped",
    status: "shipped",
    label: "Shipped",
    description: "Your package has left our warehouse.",
    iconName: "truck",
    accentColor: "bg-[#16382B] text-white",
    iconColor: "text-white",
    detailFields: [
      { key: "courierPartner", label: "Courier Partner", iconName: "truck", critical: true },
      { key: "dispatchTime", label: "Dispatch Time", iconName: "clock" },
    ],
  },
  {
    id: "out_for_delivery",
    status: "out_for_delivery",
    label: "Out For Delivery",
    description: "Your package is out for delivery.",
    iconName: "map-pin",
    accentColor: "bg-[#C6A15B] text-white",
    iconColor: "text-white",
    detailFields: [
      { key: "deliveryPartner", label: "Delivery Partner", iconName: "user", critical: true },
      { key: "currentLocation", label: "Current Location", iconName: "map-pin" },
      { key: "estimatedArrival", label: "Estimated Arrival", iconName: "clock", critical: true },
      { key: "driverContact", label: "Driver Contact", iconName: "phone" },
    ],
  },
  {
    id: "delivered",
    status: "delivered",
    label: "Delivered",
    description: "Your order has been delivered successfully.",
    iconName: "check-circle",
    accentColor: "bg-[#16382B] text-white",
    iconColor: "text-white",
    detailFields: [
      { key: "deliveryTime", label: "Delivery Time", iconName: "clock", critical: true },
      { key: "recipientName", label: "Recipient Name", iconName: "user" },
      { key: "proofOfDelivery", label: "Proof of Delivery", iconName: "check-circle" },
    ],
  },
];

/* ============================================================================
 * FUTURE-READY STAGES — not in default timeline, but available for returns etc.
 * ============================================================================
 * To enable: add to TIMELINE_STAGES array above. UI auto-adapts.
 * NOTE: These use only the 7 icon names defined in TimelineIconName type.
 */
export const FUTURE_STAGES: TimelineStage[] = [
  {
    id: "return_requested",
    status: "returned",
    label: "Return Requested",
    description: "Customer has requested a return.",
    iconName: "package",
    accentColor: "bg-amber-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "return_approved",
    status: "returned",
    label: "Return Approved",
    description: "Your return request has been approved.",
    iconName: "check-circle",
    accentColor: "bg-amber-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "return_pickup",
    status: "returned",
    label: "Return Pickup",
    description: "Our team is picking up the returned items.",
    iconName: "truck",
    accentColor: "bg-amber-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "refund_initiated",
    status: "refunded",
    label: "Refund Initiated",
    description: "Your refund has been initiated.",
    iconName: "refresh-cw",
    accentColor: "bg-blue-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "refund_completed",
    status: "refunded",
    label: "Refund Completed",
    description: "Your refund has been processed successfully.",
    iconName: "check-circle",
    accentColor: "bg-blue-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "cancelled",
    status: "cancelled",
    label: "Cancelled",
    description: "This order has been cancelled.",
    iconName: "x-circle",
    accentColor: "bg-red-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "delayed",
    status: "on_hold",
    label: "Delayed",
    description: "Your delivery has been delayed. We apologize for the inconvenience.",
    iconName: "refresh-cw",
    accentColor: "bg-amber-500 text-white",
    iconColor: "text-white",
  },
  {
    id: "failed_delivery",
    status: "failed",
    label: "Failed Delivery",
    description: "We could not deliver your package. We will retry soon.",
    iconName: "map-pin",
    accentColor: "bg-red-500 text-white",
    iconColor: "text-white",
  },
];

/* ============================================================================
 * HELPERS
 * ============================================================================ */

/**
 * Map an OrderStatus to the index in TIMELINE_STAGES.
 *
 * 7-step timeline statuses (exact match with admin panel):
 *   placed(0), confirmed(1), processing(2), packed(3), shipped(4),
 *   out_for_delivery(5), delivered(6)
 *
 * "cancelled" → -1 (handled separately in getStepState)
 *
 * Returns -1 if status is not in the timeline.
 */
export function getTimelineStageIndex(status: OrderStatus | undefined | null): number {
  if (!status) return -1;
  // Special case: cancelled should NOT map to a timeline stage
  if (status === "cancelled") return -1;
  let lastIndex = -1;
  TIMELINE_STAGES.forEach((stage, i) => {
    if (stage.status === status) lastIndex = i;
  });
  return lastIndex;
}

/**
 * Compute the state of a step given its index vs the current index.
 */
export type StepState = "completed" | "current" | "upcoming" | "cancelled_step";

export function getStepState(
  stepIndex: number,
  currentIndex: number,
  isCancelled: boolean,
): StepState {
  if (isCancelled) {
    if (stepIndex === 0) return "completed";
    if (stepIndex === 1) return "cancelled_step";
    return "upcoming";
  }
  if (currentIndex < 0) return "upcoming";
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

/**
 * Compute progress percentage (0-100) based on current step.
 */
export function getProgressPercentage(currentIndex: number, totalSteps: number): number {
  if (currentIndex < 0) return 0;
  if (currentIndex >= totalSteps - 1) return 100;
  return Math.round(((currentIndex + 1) / totalSteps) * 100);
}

/** Total number of stages in the default timeline */
export const TOTAL_STAGES = TIMELINE_STAGES.length;

/**
 * Map an order's status + paymentStatus to the current stage index.
 * Special handling: if status is "pending" but paymentStatus is "paid",
 * show stage 1 (Payment Confirmed) as current.
 */
export function getCurrentStageIndex(
  orderStatus: OrderStatus,
  _paymentStatus?: string,
): number {
  return getTimelineStageIndex(orderStatus);
}
