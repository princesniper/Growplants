"use client";

/**
 * GrowPlants — OrderHeaderCard (Premium Edition)
 * ============================================================================
 * Premium order header with hero design:
 *   - Large status hero with gradient background
 *   - Order ID + status badge prominently displayed
 *   - Quick stats grid (Date, Items, Total, Payment)
 *   - Botanical leaf decorations
 *   - Live indicator pulse
 * ============================================================================
 */
import { cn, formatINR, formatDate } from "@/lib/utils";
import {
  Calendar, Hash, IndianRupee, CreditCard, Package, Sparkles, Leaf, Clock,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type Order,
} from "@/contexts/OrdersContext";

interface OrderHeaderCardProps {
  order: Order;
  className?: string;
}

export function OrderHeaderCard({ order, className }: OrderHeaderCardProps) {
  const placedDate = new Date(order.createdAt);
  const dateStr = formatDate(order.createdAt);
  const timeStr = placedDate.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const itemCount = order.items.length;
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Status icon
  const isDelivered = order.orderStatus === "delivered";
  const isCancelled = order.orderStatus === "cancelled";
  const isPending = ["pending", "payment_confirmed", "confirmed"].includes(order.orderStatus);
  const isShipped = ["shipped", "out_for_delivery"].includes(order.orderStatus);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg",
        isDelivered && "bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200",
        isCancelled && "bg-gradient-to-br from-red-50 via-white to-rose-50 border-red-200",
        isShipped && "bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200",
        isPending && "bg-gradient-to-br from-amber-50 via-white to-yellow-50 border-amber-200",
        !isDelivered && !isCancelled && !isShipped && !isPending && "bg-gradient-to-br from-[#F3F8F1] via-white to-green-50 border-slate-200",
        className,
      )}
    >
      {/* Botanical decorations */}
      <Leaf className="absolute -top-6 -right-6 size-40 text-[#16382B]/5 rotate-12" aria-hidden="true" />
      <Leaf className="absolute -bottom-8 -left-8 size-32 text-[#16382B]/5 -rotate-12" aria-hidden="true" />

      <div className="relative p-5 sm:p-7">
        {/* Top row: Order ID + Live indicator */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-[#16382B] flex items-center justify-center shadow-sm">
                <Hash className="size-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Order Number</p>
                <h1 className="text-lg sm:text-2xl font-bold text-[#16382B] tracking-tight leading-none">
                  {order.orderNumber}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 ml-11">
              <Calendar className="size-3.5" />
              <span>{dateStr}</span>
              <span className="text-slate-300">·</span>
              <Clock className="size-3.5" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* Live indicator + Status badge */}
          <div className="flex flex-col items-end gap-2">
            {!isDelivered && !isCancelled && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur border border-slate-200">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Live</span>
              </div>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-sm",
                ORDER_STATUS_COLORS[order.orderStatus],
              )}
            >
              {isDelivered && <CheckCircle2 className="size-3.5" />}
              {isCancelled && <XCircle className="size-3.5" />}
              {isPending && <Clock className="size-3.5" />}
              {isShipped && <Package className="size-3.5" />}
              {ORDER_STATUS_LABELS[order.orderStatus]}
            </span>
            {order._mock && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                Mock Data
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-5" />

        {/* Quick stats grid — 4 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <Calendar className="size-3" />
              <span>Order Date</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{dateStr}</p>
            <p className="text-[10px] text-slate-500">{timeStr}</p>
          </div>

          {/* Items */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <Package className="size-3" />
              <span>Items</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
            <p className="text-[10px] text-slate-500">{totalQuantity} {totalQuantity === 1 ? "unit" : "units"}</p>
          </div>

          {/* Total */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <IndianRupee className="size-3" />
              <span>Total</span>
            </div>
            <p className="text-sm font-bold text-[#16382B] tabular-nums">{formatINR(order.total)}</p>
            <p className="text-[10px] text-slate-500">
              {order.shipping === 0 ? "Free delivery" : `+ ${formatINR(order.shipping)} delivery`}
            </p>
          </div>

          {/* Payment */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <CreditCard className="size-3" />
              <span>Payment</span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {order.paymentMethod === "cod" ? "COD" : "Online"}
            </p>
            <span
              className={cn(
                "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                PAYMENT_STATUS_COLORS[order.paymentStatus],
              )}
            >
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
