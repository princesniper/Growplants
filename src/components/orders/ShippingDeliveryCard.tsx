"use client";

/**
 * GrowPlants — ShippingDeliveryCard (Premium Edition)
 * ============================================================================
 * Premium shipping & delivery card with:
 *   - Shipping method hero (colored background + icon)
 *   - Courier partner info
 *   - Tracking number (clickable, external link, copyable)
 *   - Shipment ID
 *   - Dispatch date & time
 *   - ETA hero card (estimated delivery date + time window)
 *   - Delivered state (green hero + proof of delivery)
 *   - Out for delivery state (orange hero + driver info)
 *   - Empty state (waiting to ship)
 * ============================================================================
 */
import { cn, formatDate } from "@/lib/utils";
import {
  Truck, Package, Zap, Clock, Store, ExternalLink, MapPin, User, Phone,
  Calendar, CheckCircle2, Navigation, FileText, Box, Copy, Hash,
} from "lucide-react";
import type { Order, ShippingMethod } from "@/contexts/OrdersContext";

interface ShippingDeliveryCardProps {
  order: Order;
  className?: string;
}

const SHIPPING_METHOD_CONFIG: Record<ShippingMethod, {
  icon: typeof Truck;
  label: string;
  description: string;
  color: string;
  bg: string;
  borderColor: string;
}> = {
  standard: {
    icon: Truck,
    label: "Standard Delivery",
    description: "3-5 business days",
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  express: {
    icon: Zap,
    label: "Express Delivery",
    description: "1-2 business days",
    color: "text-purple-600",
    bg: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  same_day: {
    icon: Clock,
    label: "Same Day Delivery",
    description: "Within 6 hours",
    color: "text-orange-600",
    bg: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  pickup: {
    icon: Store,
    label: "Store Pickup",
    description: "Pickup from our nursery",
    color: "text-teal-600",
    bg: "bg-teal-50",
    borderColor: "border-teal-200",
  },
};

function InfoRow({
  icon: Icon,
  label,
  value,
  link,
  mono = false,
  copyable = false,
}: {
  icon: typeof Truck;
  label: string;
  value: string | undefined;
  link?: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  if (!value) return null;

  const handleCopy = () => {
    if (copyable) navigator.clipboard?.writeText(value);
  };

  return (
    <div className="flex items-start gap-2.5">
      <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-3.5 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        <div className="flex items-center gap-1.5">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#16382B] hover:underline font-medium"
            >
              <span className={cn(mono && "font-mono")}>{value}</span>
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <p className={cn("text-sm text-slate-700 font-medium", mono && "font-mono")}>{value}</p>
          )}
          {copyable && (
            <button
              onClick={handleCopy}
              className="p-0.5 rounded hover:bg-slate-100 transition-colors"
              aria-label={`Copy ${label}`}
            >
              <Copy className="size-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShippingDeliveryCard({ order, className }: ShippingDeliveryCardProps) {
  const method = order.shippingMethod ?? "standard";
  const methodConfig = SHIPPING_METHOD_CONFIG[method] ?? SHIPPING_METHOD_CONFIG.standard;
  const tracking = order.tracking;
  const isShipped = ["shipped", "out_for_delivery", "delivered"].includes(order.orderStatus);

  // Compute estimated delivery (3 days from order date if not provided)
  const estimatedDate = tracking?.estimatedDeliveryDate
    ?? new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const estimatedWindow = tracking?.estimatedDeliveryWindow ?? "10:00 AM – 6:00 PM";

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-5 sm:p-6 pb-3">
        <div className="size-9 rounded-xl bg-[#16382B] flex items-center justify-center shadow-sm">
          <Truck className="size-4 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Shipping & Delivery</h3>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="p-5 sm:p-6 pt-4 space-y-4">
        {/* Shipping method hero */}
        <div className={cn("rounded-xl border p-3.5", methodConfig.bg, methodConfig.borderColor)}>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <methodConfig.icon className={cn("size-5", methodConfig.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">{methodConfig.label}</p>
              <p className="text-xs text-slate-600">{methodConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Tracking info (only when shipped) */}
        {isShipped && tracking ? (
          <div className="space-y-3">
            <InfoRow
              icon={Box}
              label="Courier Partner"
              value={tracking.courierPartner ?? "GrowPlants Express"}
            />
            <InfoRow
              icon={Package}
              label="Tracking Number"
              value={tracking.trackingNumber}
              link={tracking.trackingUrl ?? `https://www.delhivery.com/tracking/${tracking.trackingNumber}`}
              mono
              copyable
            />
            {tracking.shipmentId && (
              <InfoRow
                icon={Hash}
                label="Shipment ID"
                value={tracking.shipmentId}
                mono
                copyable
              />
            )}
            {tracking.dispatchedAt && (
              <InfoRow
                icon={Calendar}
                label="Dispatched On"
                value={`${formatDate(tracking.dispatchedAt)} at ${new Date(tracking.dispatchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="size-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              {order.orderStatus === "pending" || order.orderStatus === "payment_confirmed"
                ? "Order received. Will be shipped soon."
                : "Preparing your order for dispatch."}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Delivery status hero */}
        {order.orderStatus === "delivered" && tracking?.deliveredAt ? (
          /* Delivered */
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-green-800">Delivered Successfully</p>
                <p className="text-xs text-green-700">
                  {formatDate(tracking.deliveredAt)} at{" "}
                  {new Date(tracking.deliveredAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit", hour12: true,
                  })}
                </p>
              </div>
            </div>
            {tracking.recipientName && (
              <InfoRow icon={User} label="Received By" value={tracking.recipientName} />
            )}
            {tracking.proofOfDelivery && (
              <InfoRow icon={FileText} label="Proof of Delivery" value={tracking.proofOfDelivery} />
            )}
          </div>
        ) : order.orderStatus === "out_for_delivery" && tracking ? (
          /* Out for delivery */
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Navigation className="size-5 text-orange-600 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-orange-800">Out for Delivery</p>
                <p className="text-xs text-orange-700">
                  Arriving today: {tracking.estimatedArrivalTime ?? estimatedWindow}
                </p>
              </div>
            </div>
            {tracking.deliveryPartner && (
              <InfoRow icon={User} label="Delivery Partner" value={tracking.deliveryPartner} />
            )}
            {tracking.driverContact && (
              <InfoRow icon={Phone} label="Driver Contact" value={tracking.driverContact} link={`tel:${tracking.driverContact}`} />
            )}
            {tracking.currentLocation && (
              <InfoRow icon={MapPin} label="Current Location" value={tracking.currentLocation} />
            )}
          </div>
        ) : (
          /* Estimated delivery (pending/processing) */
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-[#F3F8F1] to-green-50 border border-[#16382B]/10 rounded-xl">
            <div className="size-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Calendar className="size-5 text-[#16382B]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Estimated Delivery
              </p>
              <p className="text-sm font-bold text-slate-800">{formatDate(estimatedDate)}</p>
              <p className="text-xs text-slate-500">{estimatedWindow}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
