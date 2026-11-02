"use client";

/**
 * GrowPlants — DeliveryProgressCard
 * ============================================================================
 * Premium progress card showing:
 *   - Circular progress ring with percentage
 *   - Current step label
 *   - Expected next step
 *   - Estimated delivery date + time
 *
 * The circular ring animates from 0% to current % on mount.
 * ============================================================================
 */
import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Calendar, Clock, ChevronRight, Sparkles } from "lucide-react";
import type { Order } from "@/contexts/OrdersContext";
import {
  getCurrentStageIndex,
  getProgressPercentage,
  TIMELINE_STAGES,
  TOTAL_STAGES,
} from "./timeline-stages";

interface DeliveryProgressCardProps {
  order: Order;
  /** Optional estimated delivery date (ISO string or formatted) */
  estimatedDeliveryDate?: string;
  /** Optional estimated delivery time window (e.g. "10:00 AM – 2:00 PM") */
  estimatedDeliveryTime?: string;
  className?: string;
}

export function DeliveryProgressCard({
  order,
  estimatedDeliveryDate,
  estimatedDeliveryTime,
  className,
}: DeliveryProgressCardProps) {
  const currentIndex = getCurrentStageIndex(order.orderStatus, order.paymentStatus);
  const targetProgress = getProgressPercentage(currentIndex, TOTAL_STAGES);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress on mount + when currentIndex changes
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(targetProgress), 200);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  const currentStage = currentIndex >= 0 ? TIMELINE_STAGES[currentIndex] : null;
  const nextStage = currentIndex >= 0 && currentIndex < TOTAL_STAGES - 1
    ? TIMELINE_STAGES[currentIndex + 1]
    : null;

  const isDelivered = order.orderStatus === "delivered";
  const isCancelled = order.orderStatus === "cancelled";

  // Ring geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Circular progress ring */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100"
            />
            {/* Progress arc */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={isCancelled ? "#EF4444" : "url(#progressGradient)"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#16382B" />
                <stop offset="100%" stopColor="#43A047" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-xl font-bold tabular-nums",
              isCancelled ? "text-red-500" : "text-[#16382B]",
            )}>
              {animatedProgress}%
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-wide font-medium">
              {isDelivered ? "Done" : isCancelled ? "Cancelled" : "Complete"}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
              Current Step
            </p>
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {isCancelled ? "Cancelled" : currentStage?.label ?? "—"}
            </p>
          </div>

          {nextStage && !isCancelled && !isDelivered && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ChevronRight className="size-3 text-slate-400" />
              <span>Next: <span className="font-medium text-slate-700">{nextStage.label}</span></span>
            </div>
          )}

          {isDelivered && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Sparkles className="size-3" />
              <span className="font-medium">Order completed successfully!</span>
            </div>
          )}
        </div>
      </div>

      {/* ETA section */}
      {!isCancelled && (estimatedDeliveryDate || isDelivered) && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#16382B] shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">
                {isDelivered ? "Delivered On" : "Est. Delivery"}
              </p>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {isDelivered
                  ? order.statusHistory.find((s) => s.status === "delivered")?.date
                    ? formatDate(order.statusHistory.find((s) => s.status === "delivered")!.date)
                    : formatDate(order.createdAt)
                  : estimatedDeliveryDate
                    ? formatDate(estimatedDeliveryDate)
                    : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-[#16382B] shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">
                {isDelivered ? "Delivery Time" : "Time Window"}
              </p>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {isDelivered
                  ? order.statusHistory.find((s) => s.status === "delivered")?.date
                    ? new Date(order.statusHistory.find((s) => s.status === "delivered")!.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                    : "—"
                  : estimatedDeliveryTime ?? "10:00 AM – 6:00 PM"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
