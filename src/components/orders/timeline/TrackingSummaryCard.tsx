"use client";

/**
 * GrowPlants — TrackingSummaryCard
 * ============================================================================
 * Premium summary card displaying all order + shipping metadata in a clean
 * grid layout.
 *
 * Fields:
 *   Order Number, Tracking Number, Courier Partner, Estimated Delivery,
 *   Current Status, Last Updated, Shipping Address, Payment Method
 * ============================================================================
 */
import { cn, formatDate, formatINR } from "@/lib/utils";
import {
  Hash, Truck, Calendar, Activity, Clock, MapPin, CreditCard, Package,
} from "lucide-react";
import type { Order } from "@/contexts/OrdersContext";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/contexts/OrdersContext";

interface TrackingSummaryCardProps {
  order: Order;
  /** Optional tracking number from courier */
  trackingNumber?: string;
  /** Optional courier partner name */
  courierPartner?: string;
  /** Optional estimated delivery date */
  estimatedDelivery?: string;
  className?: string;
}

interface SummaryField {
  icon: typeof Hash;
  label: string;
  value: string;
  /** Optional sub-value (smaller, below main value) */
  subValue?: string;
  /** Optional badge instead of plain text */
  badge?: { text: string; colorClass: string };
}

export function TrackingSummaryCard({
  order,
  trackingNumber,
  courierPartner,
  estimatedDelivery,
  className,
}: TrackingSummaryCardProps) {
  const lastUpdated = order.statusHistory.length > 0
    ? order.statusHistory[order.statusHistory.length - 1].date
    : order.createdAt;

  const addressLine = [
    order.address.fullName,
    order.address.addressLine1,
    order.address.addressLine2,
    `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    order.address.phone,
  ].filter(Boolean);

  const fields: SummaryField[] = [
    {
      icon: Hash,
      label: "Order Number",
      value: `#${order.orderNumber}`,
    },
    {
      icon: Truck,
      label: "Tracking Number",
      value: trackingNumber ?? "—",
      subValue: courierPartner ? `via ${courierPartner}` : undefined,
    },
    {
      icon: Calendar,
      label: "Estimated Delivery",
      value: estimatedDelivery ? formatDate(estimatedDelivery) : "—",
      subValue: estimatedDelivery ? "10:00 AM – 6:00 PM" : undefined,
    },
    {
      icon: Activity,
      label: "Current Status",
      value: ORDER_STATUS_LABELS[order.orderStatus],
      badge: {
        text: ORDER_STATUS_LABELS[order.orderStatus],
        colorClass: ORDER_STATUS_COLORS[order.orderStatus],
      },
    },
    {
      icon: Clock,
      label: "Last Updated",
      value: formatDate(lastUpdated),
      subValue: new Date(lastUpdated).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      }),
    },
    {
      icon: CreditCard,
      label: "Payment Method",
      value: order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)",
      badge: {
        text: PAYMENT_STATUS_LABELS[order.paymentStatus],
        colorClass: PAYMENT_STATUS_COLORS[order.paymentStatus],
      },
    },
  ];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Package className="size-4 text-[#16382B]" />
        <h3 className="text-sm font-bold text-slate-800">Tracking Summary</h3>
      </div>

      {/* Fields grid */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">
              <field.icon className="size-3 shrink-0" />
              {field.label}
            </dt>
            <dd className="text-sm font-semibold text-slate-800 truncate">
              {field.value}
            </dd>
            {field.subValue && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {field.subValue}
              </p>
            )}
            {field.badge && (
              <span
                className={cn(
                  "inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  field.badge.colorClass,
                )}
              >
                {field.badge.text}
              </span>
            )}
          </div>
        ))}
      </dl>

      {/* Shipping address — full width */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <dt className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1.5">
          <MapPin className="size-3 shrink-0" />
          Shipping Address
        </dt>
        <dd className="text-xs text-slate-700 leading-relaxed">
          {addressLine.map((line, i) => (
            <p key={i} className={i === 0 ? "font-semibold text-slate-800" : ""}>
              {line}
            </p>
          ))}
        </dd>
      </div>

      {/* Order total */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Order Total</span>
        <span className="text-lg font-bold text-[#16382B] tabular-nums">
          {formatINR(order.total)}
        </span>
      </div>
    </div>
  );
}
