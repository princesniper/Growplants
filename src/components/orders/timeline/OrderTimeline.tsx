"use client";

/**
 * GrowPlants — OrderTimeline (Premium Orchestrator)
 * ============================================================================
 * Main component that orchestrates the entire premium tracking experience.
 *
 * Layout:
 *   Desktop (lg+): 3-column grid
 *     [ LiveStatusBanner (full width)                          ]
 *     [ Timeline (horizontal, span 2) ][ DeliveryProgressCard  ]
 *     [ TrackingSummaryCard (full width)                       ]
 *
 *   Tablet (md): 2-column
 *     [ LiveStatusBanner (full width)                          ]
 *     [ Timeline (horizontal)       ][ DeliveryProgressCard   ]
 *     [ TrackingSummaryCard (full width)                       ]
 *
 *   Mobile (<md): single column stack
 *     [ LiveStatusBanner ]
 *     [ DeliveryProgressCard ]
 *     [ Timeline (vertical) ]
 *     [ TrackingSummaryCard ]
 *
 * Props:
 *   - order: Order (the full order object)
 *   - trackingNumber?: string (courier tracking #, optional)
 *   - courierPartner?: string (e.g. "Delhivery", "BlueDart")
 *   - estimatedDelivery?: string (ISO date or formatted string)
 *   - loading?: boolean (shows skeleton)
 *   - error?: string | null (shows error state with retry)
 *   - onRetry?: () => void
 *   - onContactSupport?: () => void
 * ============================================================================
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Order } from "@/contexts/OrdersContext";
import {
  TIMELINE_STAGES,
  TOTAL_STAGES,
  getCurrentStageIndex,
  getStepState,
} from "./timeline-stages";
import { TimelineStep } from "./TimelineStep";
import { LiveStatusBanner } from "./LiveStatusBanner";
import { DeliveryProgressCard } from "./DeliveryProgressCard";
import { TrackingSummaryCard } from "./TrackingSummaryCard";
import { TrackingSkeleton } from "./TrackingSkeleton";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { TrackingErrorState } from "./TrackingErrorState";

interface OrderTimelineProps {
  order: Order | null;
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDelivery?: string;
  estimatedDeliveryTime?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

export function OrderTimeline({
  order,
  trackingNumber,
  courierPartner,
  estimatedDelivery,
  estimatedDeliveryTime,
  loading = false,
  error = null,
  onRetry,
  onContactSupport,
  className,
}: OrderTimelineProps) {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  // Responsive: detect viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setOrientation(mql.matches ? "horizontal" : "vertical");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  /* ---------- Loading state ---------- */
  if (loading) {
    return <TrackingSkeleton className={className} />;
  }

  /* ---------- Error state ---------- */
  if (error && !order) {
    return (
      <TrackingErrorState
        message={error}
        onRetry={onRetry}
        onContactSupport={onContactSupport}
        className={className}
      />
    );
  }

  /* ---------- Empty state (no order) ---------- */
  if (!order) {
    return <TrackingEmptyState className={className} />;
  }

  const currentIndex = getCurrentStageIndex(order.orderStatus, order.paymentStatus);
  const isCancelled = order.orderStatus === "cancelled";

  /* ---------- Build display fields per stage ---------- */
  const buildDisplayFields = (stageId: string): { key: string; label: string; value: string | undefined; critical?: boolean }[] => {
    switch (stageId) {
      case "order_placed":
        return [
          { key: "date", label: "Date", value: formatDateShort(order.createdAt), critical: true },
          { key: "time", label: "Time", value: formatTimeShort(order.createdAt) },
          { key: "orderId", label: "Order ID", value: `#${order.orderNumber}`, critical: true },
        ];
      case "payment_confirmed":
        return [
          { key: "paymentMethod", label: "Payment Method", value: order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)", critical: true },
        ];
      case "shipped":
        return [
          { key: "courierPartner", label: "Courier Partner", value: courierPartner, critical: true },
          { key: "trackingNumber", label: "Tracking Number", value: trackingNumber, critical: true },
          { key: "shipmentId", label: "Shipment ID", value: order.id },
          { key: "dispatchTime", label: "Dispatch Time", value: formatDateShort(order.statusHistory.find((s) => s.status === "shipped")?.date) },
        ];
      case "out_for_delivery":
        return [
          { key: "deliveryPartner", label: "Delivery Partner", value: "GrowPlants Delivery", critical: true },
          { key: "currentLocation", label: "Current Location", value: "On the way" },
          { key: "estimatedArrival", label: "Estimated Arrival", value: estimatedDeliveryTime ?? "Today, 10 AM – 6 PM", critical: true },
        ];
      case "delivered":
        return [
          { key: "deliveryTime", label: "Delivery Time", value: formatDateShort(order.statusHistory.find((s) => s.status === "delivered")?.date), critical: true },
          { key: "recipientName", label: "Recipient", value: order.address.fullName },
        ];
      default:
        return [];
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* ─────────── Live Status Banner (full width) ─────────── */}
      <LiveStatusBanner
        order={order}
        estimatedDelivery={
          estimatedDelivery
            ? `${formatDateShort(estimatedDelivery)} between ${estimatedDeliveryTime ?? "10:00 AM – 6:00 PM"}`
            : undefined
        }
      />

      {/* ─────────── Main grid: Timeline + Progress card ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline (spans 2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#16382B] animate-pulse" />
              Order Journey
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {isCancelled ? "Cancelled" : `${currentIndex >= 0 ? currentIndex + 1 : 0} of ${TOTAL_STAGES} steps`}
            </span>
          </div>

          {/* Cancelled notice */}
          {isCancelled && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">
                {order.statusHistory.find((s) => s.status === "cancelled")?.note ?? "This order was cancelled after being placed."}
              </p>
            </div>
          )}

          {/* Desktop: horizontal timeline */}
          {orientation === "horizontal" ? (
            <div
              className="flex items-start justify-between gap-1 pt-2"
              role="list"
              aria-label="Order tracking timeline"
            >
              {TIMELINE_STAGES.map((stage, i) => {
                const state = getStepState(i, currentIndex, isCancelled);
                const histEntry = order.statusHistory.find(
                  (s) => s.status === stage.status,
                );
                return (
                  <TimelineStep
                    key={stage.id}
                    stage={stage}
                    state={state}
                    stepIndex={i}
                    totalSteps={TOTAL_STAGES}
                    orientation="horizontal"
                    completedDate={histEntry?.date}
                    animationDelay={i * 60}
                  />
                );
              })}
            </div>
          ) : (
            /* Mobile: vertical timeline */
            <ol
              className="relative space-y-0"
              role="list"
              aria-label="Order tracking timeline"
            >
              {TIMELINE_STAGES.map((stage, i) => {
                const state = getStepState(i, currentIndex, isCancelled);
                const histEntry = order.statusHistory.find(
                  (s) => s.status === stage.status,
                );
                return (
                  <TimelineStep
                    key={stage.id}
                    stage={stage}
                    state={state}
                    stepIndex={i}
                    totalSteps={TOTAL_STAGES}
                    orientation="vertical"
                    completedDate={histEntry?.date}
                    displayFields={state === "current" || state === "completed" ? buildDisplayFields(stage.id) : []}
                    animationDelay={i * 60}
                  />
                );
              })}
            </ol>
          )}
        </div>

        {/* Delivery Progress Card (1 col) */}
        <DeliveryProgressCard
          order={order}
          estimatedDeliveryDate={estimatedDelivery}
          estimatedDeliveryTime={estimatedDeliveryTime}
        />
      </div>

      {/* ─────────── Tracking Summary Card (full width) ─────────── */}
      <TrackingSummaryCard
        order={order}
        trackingNumber={trackingNumber}
        courierPartner={courierPartner}
        estimatedDelivery={estimatedDelivery}
      />
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatDateShort(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return undefined;
  }
}

function formatTimeShort(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return undefined;
  }
}
