"use client";

/**
 * GrowPlants — LiveStatusBanner
 * ============================================================================
 * Highlighted banner at the top of the tracking section. Gives the user the
 * headline status in one glance.
 *
 * Example:
 *   📦 Your order has been shipped.
 *   Expected delivery: Tomorrow between 10:00 AM – 2:00 PM
 *
 * Variants by current status:
 *   - pending / payment_confirmed → gold/brass (order received)
 *   - confirmed / processing / quality_inspection / packed → pine/terracotta (preparing)
 *   - shipped → gold/brass (shipped, with ETA)
 *   - out_for_delivery → terracotta/clay (out for delivery, with arrival time)
 *   - delivered → moss/sage (delivered, with delivery time)
 *   - cancelled → terracotta
 * ============================================================================
 */
import { cn } from "@/lib/utils";
import { Package, Truck, MapPin, CheckCircle2, XCircle, Leaf, Clock, Wallet, Box, Shield } from "lucide-react";
import type { Order } from "@/contexts/OrdersContext";
import { getCurrentStageIndex, TIMELINE_STAGES } from "./timeline-stages";

interface LiveStatusBannerProps {
  order: Order;
  /** Optional ETA string (e.g. "Tomorrow between 10:00 AM – 2:00 PM") */
  estimatedDelivery?: string;
  className?: string;
}

interface BannerConfig {
  icon: typeof Package;
  emoji: string;
  headline: string;
  subline?: string;
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  headlineColor: string;
  sublineColor: string;
}

function getBannerConfig(order: Order, estimatedDelivery?: string): BannerConfig {
  const stageIdx = getCurrentStageIndex(order.orderStatus, order.paymentStatus);
  const stage = stageIdx >= 0 ? TIMELINE_STAGES[stageIdx] : null;

  // Cancelled
  if (order.orderStatus === "cancelled") {
    return {
      icon: XCircle,
      emoji: "❌",
      headline: "Your order has been cancelled.",
      subline: order.statusHistory.find((s) => s.status === "cancelled")?.note,
      bg: "bg-terracotta/10",
      border: "border-terracotta/30",
      iconBg: "bg-clay",
      iconColor: "text-terracotta",
      headlineColor: "text-terracotta",
      sublineColor: "text-terracotta",
    };
  }

  // Delivered
  if (order.orderStatus === "delivered") {
    const deliveryEvent = order.statusHistory.find((s) => s.status === "delivered");
    const deliveryTime = deliveryEvent?.date
      ? new Date(deliveryEvent.date).toLocaleString("en-IN", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
        })
      : undefined;
    return {
      icon: CheckCircle2,
      emoji: "🎉",
      headline: "Your order has been delivered!",
      subline: deliveryTime ? `Delivered on ${deliveryTime}` : undefined,
      bg: "bg-sage-wash",
      border: "border-moss/25",
      iconBg: "bg-sage-wash",
      iconColor: "text-moss",
      headlineColor: "text-moss",
      sublineColor: "text-moss",
    };
  }

  // Shipped — show ETA
  if (order.orderStatus === "shipped") {
    return {
      icon: Truck,
      emoji: "📦",
      headline: "Your order has been shipped.",
      subline: estimatedDelivery ? `Expected delivery: ${estimatedDelivery}` : undefined,
      bg: "bg-gold-tint/60",
      border: "border-brass/30",
      iconBg: "bg-gold-tint",
      iconColor: "text-brass-deep",
      headlineColor: "text-pine",
      sublineColor: "text-ink-soft",
    };
  }

  // Out for delivery
  if (order.orderStatus === "out_for_delivery") {
    return {
      icon: MapPin,
      emoji: "🚚",
      headline: "Your order is out for delivery!",
      subline: estimatedDelivery ? `Arriving: ${estimatedDelivery}` : "Delivery agent is on the way",
      bg: "bg-clay/60",
      border: "border-terracotta/30",
      iconBg: "bg-clay",
      iconColor: "text-terracotta",
      headlineColor: "text-terracotta",
      sublineColor: "text-terracotta/80",
    };
  }

  // Quality inspection
  if (order.orderStatus === "quality_inspection") {
    return {
      icon: Shield,
      emoji: "🌿",
      headline: "Your plants are undergoing quality inspection.",
      subline: "Each plant is being carefully checked for health and quality.",
      bg: "bg-sage-wash",
      border: "border-pine/20",
      iconBg: "bg-sage-wash",
      iconColor: "text-pine",
      headlineColor: "text-pine",
      sublineColor: "text-ink-soft",
    };
  }

  // Packed
  if (order.orderStatus === "packed") {
    return {
      icon: Box,
      emoji: "📦",
      headline: "Your order has been packed safely.",
      subline: "Ready to be handed over to the courier.",
      bg: "bg-stone",
      border: "border-line",
      iconBg: "bg-stone",
      iconColor: "text-pine",
      headlineColor: "text-pine",
      sublineColor: "text-ink-soft",
    };
  }

  // Processing
  if (order.orderStatus === "processing") {
    return {
      icon: Package,
      emoji: "🌱",
      headline: "We're preparing your plants.",
      subline: "Your order is being carefully prepared for dispatch.",
      bg: "bg-clay/60",
      border: "border-terracotta/30",
      iconBg: "bg-clay",
      iconColor: "text-terracotta",
      headlineColor: "text-terracotta",
      sublineColor: "text-terracotta/80",
    };
  }

  // Payment confirmed
  if (order.orderStatus === "payment_confirmed" || (order.orderStatus === "pending" && order.paymentStatus === "paid")) {
    return {
      icon: Wallet,
      emoji: "✅",
      headline: "Payment confirmed. Thank you!",
      subline: "Our team will confirm your order shortly.",
      bg: "bg-sage-wash",
      border: "border-moss/25",
      iconBg: "bg-sage-wash",
      iconColor: "text-moss",
      headlineColor: "text-moss",
      sublineColor: "text-moss",
    };
  }

  // Pending (just placed)
  return {
    icon: Leaf,
    emoji: "🌿",
    headline: "We've received your order!",
    subline: order.paymentMethod === "cod"
      ? "Please keep the cash ready for delivery."
      : "We're verifying your payment.",
    bg: "bg-gold-tint/60",
    border: "border-brass/30",
    iconBg: "bg-gold-tint",
    iconColor: "text-brass-deep",
    headlineColor: "text-pine",
    sublineColor: "text-ink-soft",
  };
}

export function LiveStatusBanner({
  order,
  estimatedDelivery,
  className,
}: LiveStatusBannerProps) {
  const config = getBannerConfig(order, estimatedDelivery);
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300",
        config.bg,
        config.border,
        "hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className={cn(
            "size-11 sm:size-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm",
            config.iconBg,
          )}
        >
          <Icon className={cn("size-5 sm:size-6", config.iconColor)} strokeWidth={2.2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={cn("font-display text-sm sm:text-base leading-tight", config.headlineColor)}>
            <span className="mr-1.5" aria-hidden="true">{config.emoji}</span>
            {config.headline}
          </p>
          {config.subline && (
            <p className={cn("text-xs sm:text-sm leading-relaxed", config.sublineColor)}>
              {config.subline}
            </p>
          )}
        </div>

        {/* Live indicator */}
        {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-moss opacity-75 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-sage-wash0" />
            </span>
            <span className="text-[10px] font-medium text-ink-soft uppercase tracking-wide">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Decorative leaf pattern (botanical theme) */}
      <Leaf
        className="absolute -bottom-3 -right-3 size-20 text-pine opacity-10 rotate-12"
        aria-hidden="true"
      />
    </div>
  );
}
