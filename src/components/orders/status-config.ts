/**
 * GrowPlants — Order Status Configuration
 * ============================================================================
 * Central registry of all order + payment statuses with display metadata:
 *   - Labels (English + Hindi)
 *   - Badge colors (Tailwind classes)
 *   - Timeline mapping (which statuses appear in the 7-step tracker)
 *   - Step ordering for completed/current/upcoming logic
 *
 * 12 ORDER STATUSES:
 *   Timeline (7):  pending → confirmed → processing → packed → shipped → out_for_delivery → delivered
 *   Non-timeline:  cancelled, completed, returned, refunded, failed, on_hold
 *
 * 5 PAYMENT STATUSES:
 *   pending, paid, failed, refunded, partial_refund
 * ============================================================================
 */
import type { OrderStatus, PaymentStatus } from "@/contexts/OrdersContext";

export interface StatusConfig {
  label: string;
  labelHi: string;
  /** Tailwind classes for badge (bg + text) */
  color: string;
  /** Dot color for icons */
  dotColor: string;
  /** Whether this status is in the 7-step timeline (true) or auxiliary (false) */
  isTimelineStep: boolean;
  /** Order index in the timeline (0-6). -1 for non-timeline statuses. */
  stepIndex: number;
  /** Whether the customer can still cancel the order at this status */
  cancellable: boolean;
  /** Short description shown in tooltip/help text */
  description: string;
  descriptionHi: string;
}

/* ============================================================================
 * ORDER STATUS CONFIG — 14 statuses (9 timeline + 5 auxiliary)
 * ============================================================================ */

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  placed: {
    label: "Order Placed",
    labelHi: "ऑर्डर दिया गया",
    color: "bg-gold-tint text-brass-deep border-brass/30",
    dotColor: "bg-brass",
    isTimelineStep: true,
    stepIndex: 0,
    cancellable: true,
    description: "Order placed, awaiting confirmation",
    descriptionHi: "ऑर्डर दिया गया, पुष्टि की प्रतीक्षा है",
  },
  pending: {
    label: "Order Placed",
    labelHi: "ऑर्डर दिया गया",
    color: "bg-gold-tint text-brass-deep border-brass/30",
    dotColor: "bg-brass",
    isTimelineStep: true,
    stepIndex: 0,
    cancellable: true,
    description: "Order placed, awaiting confirmation (legacy)",
    descriptionHi: "ऑर्डर दिया गया, पुष्टि की प्रतीक्षा है",
  },
  payment_confirmed: {
    label: "Payment Confirmed",
    labelHi: "भुगतान की पुष्टि",
    color: "bg-sage-wash text-moss border-moss/25",
    dotColor: "bg-moss",
    isTimelineStep: true,
    stepIndex: 1,
    cancellable: true,
    description: "Payment verified successfully",
    descriptionHi: "भुगतान सफलतापूर्वक सत्यापित",
  },
  confirmed: {
    label: "Order Confirmed",
    labelHi: "ऑर्डर की पुष्टि",
    color: "bg-pine/10 text-pine border-pine/20",
    dotColor: "bg-pine",
    isTimelineStep: true,
    stepIndex: 2,
    cancellable: true,
    description: "Order confirmed by seller",
    descriptionHi: "विक्रेता द्वारा ऑर्डर की पुष्टि की गई",
  },
  processing: {
    label: "Preparing Your Plants",
    labelHi: "पौधे तैयार किए जा रहे हैं",
    color: "bg-clay text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    isTimelineStep: true,
    stepIndex: 3,
    cancellable: false,
    description: "Being prepared for packing",
    descriptionHi: "पैकिंग के लिए तैयार किया जा रहा है",
  },
  quality_inspection: {
    label: "Quality Inspection",
    labelHi: "गुणवत्ता निरीक्षण",
    color: "bg-sage-wash text-pine border-pine/20",
    dotColor: "bg-sage",
    isTimelineStep: true,
    stepIndex: 4,
    cancellable: false,
    description: "Each plant inspected for health and quality",
    descriptionHi: "हर पौधे की गुणवत्ता की जांच हो रही है",
  },
  packed: {
    label: "Packed",
    labelHi: "पैक किया गया",
    color: "bg-stone text-charcoal border-line",
    dotColor: "bg-sage",
    isTimelineStep: true,
    stepIndex: 5,
    cancellable: false,
    description: "Packed and ready to ship",
    descriptionHi: "पैक हो गया, भेजने के लिए तैयार",
  },
  shipped: {
    label: "Shipped",
    labelHi: "भेज दिया गया",
    color: "bg-gold-tint text-brass-deep border-brass/30",
    dotColor: "bg-brass-deep",
    isTimelineStep: true,
    stepIndex: 6,
    cancellable: false,
    description: "Handed over to courier",
    descriptionHi: "कूरियर को सौंप दिया गया",
  },
  out_for_delivery: {
    label: "Out For Delivery",
    labelHi: "डिलीवरी के लिए रवाना",
    color: "bg-clay text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    isTimelineStep: true,
    stepIndex: 7,
    cancellable: false,
    description: "Out with delivery agent",
    descriptionHi: "डिलीवरी एजेंट के साथ रवाना",
  },
  delivered: {
    label: "Delivered",
    labelHi: "डिलीवर हो गया",
    color: "bg-sage-wash text-moss border-moss/25",
    dotColor: "bg-moss",
    isTimelineStep: true,
    stepIndex: 8,
    cancellable: false,
    description: "Successfully delivered",
    descriptionHi: "सफलतापूर्वक डिलीवर हो गया",
  },
  cancelled: {
    label: "Cancelled",
    labelHi: "रद्द किया गया",
    color: "bg-terracotta/10 text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    isTimelineStep: false,
    stepIndex: -1,
    cancellable: false,
    description: "Order was cancelled",
    descriptionHi: "ऑर्डर रद्द कर दिया गया",
  },
  // Non-timeline statuses (kept for completeness — admin may use these)
  completed: {
    label: "Completed",
    labelHi: "पूर्ण",
    color: "bg-sage-wash text-moss border-moss/25",
    dotColor: "bg-moss",
    isTimelineStep: false,
    stepIndex: -1,
    cancellable: false,
    description: "Order completed (post-delivery)",
    descriptionHi: "ऑर्डर पूर्ण (डिलीवरी के बाद)",
  },
  returned: {
    label: "Returned",
    labelHi: "वापस किया गया",
    color: "bg-clay text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    isTimelineStep: false,
    stepIndex: -1,
    cancellable: false,
    description: "Items returned by customer",
    descriptionHi: "ग्राहक द्वारा वापस किया गया",
  },
  refunded: {
    label: "Refunded",
    labelHi: "धन वापसी",
    color: "bg-sage-wash text-pine border-pine/20",
    dotColor: "bg-sage",
    isTimelineStep: false,
    stepIndex: -1,
    cancellable: false,
    description: "Refund processed",
    descriptionHi: "धन वापसी संसाधित",
  },
  failed: {
    label: "Failed",
    labelHi: "विफल",
    color: "bg-terracotta/10 text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    isTimelineStep: false,
    stepIndex: -1,
    cancellable: false,
    description: "Order failed (payment or fulfillment)",
    descriptionHi: "ऑर्डर विफल (भुगतान या पूर्ति)",
  },
  on_hold: {
    label: "On Hold",
    labelHi: "रुका हुआ",
    color: "bg-stone text-ink-soft border-line",
    dotColor: "bg-sage",
    isTimelineStep: false,
    stepIndex: -1,
    cancellable: true,
    description: "Order temporarily on hold",
    descriptionHi: "ऑर्डर अस्थायी रूप से रुका हुआ",
  },
};

/* ============================================================================
 * PAYMENT STATUS CONFIG — 5 statuses
 * ============================================================================ */

export interface PaymentStatusConfig {
  label: string;
  labelHi: string;
  color: string;
  dotColor: string;
  description: string;
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> = {
  pending: {
    label: "Pending",
    labelHi: "लंबित",
    color: "bg-gold-tint text-brass-deep border-brass/30",
    dotColor: "bg-brass",
    description: "Payment awaiting processing",
  },
  paid: {
    label: "Paid",
    labelHi: "भुगतान हो गया",
    color: "bg-sage-wash text-moss border-moss/25",
    dotColor: "bg-moss",
    description: "Payment successfully captured",
  },
  failed: {
    label: "Failed",
    labelHi: "विफल",
    color: "bg-terracotta/10 text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    description: "Payment failed",
  },
  refunded: {
    label: "Refunded",
    labelHi: "धन वापसी",
    color: "bg-pine/10 text-pine border-pine/20",
    dotColor: "bg-pine",
    description: "Full refund processed",
  },
  partial_refund: {
    label: "Partial Refund",
    labelHi: "आंशिक धन वापसी",
    color: "bg-clay text-terracotta border-terracotta/30",
    dotColor: "bg-terracotta",
    description: "Partial refund processed",
  },
};

/* ============================================================================
 * Helper accessors (back-compat with existing ORDER_STATUS_LABELS etc.)
 * ============================================================================ */

export function getStatusLabel(status: OrderStatus, lang: "en" | "hi" = "en"): string {
  return lang === "hi"
    ? ORDER_STATUS_CONFIG[status]?.labelHi ?? status
    : ORDER_STATUS_CONFIG[status]?.label ?? status;
}

export function getStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.color ?? "bg-stone text-ink-soft";
}

export function getPaymentStatusLabel(status: PaymentStatus, lang: "en" | "hi" = "en"): string {
  return lang === "hi"
    ? PAYMENT_STATUS_CONFIG[status]?.labelHi ?? status
    : PAYMENT_STATUS_CONFIG[status]?.label ?? status;
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  return PAYMENT_STATUS_CONFIG[status]?.color ?? "bg-stone text-ink-soft";
}

export function isCancellable(status: OrderStatus): boolean {
  return ORDER_STATUS_CONFIG[status]?.cancellable ?? false;
}

export function getStepIndex(status: OrderStatus): number {
  return ORDER_STATUS_CONFIG[status]?.stepIndex ?? -1;
}

export function isTimelineStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_CONFIG[status]?.isTimelineStep ?? false;
}
