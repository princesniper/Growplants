"use client";

/**
 * GrowPlants — TrackingEmptyState
 * ============================================================================
 * Premium illustration + message shown when tracking hasn't started yet
 * (order just placed, no tracking info available).
 * ============================================================================
 */
import { cn } from "@/lib/utils";
import { Sprout, Clock } from "lucide-react";

interface TrackingEmptyStateProps {
  orderNumber?: string;
  className?: string;
}

export function TrackingEmptyState({ orderNumber, className }: TrackingEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-[#F3F8F1] to-white",
        className,
      )}
      role="status"
    >
      {/* Illustration: sprout in a circle */}
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-[#16382B]/10 rounded-full blur-xl animate-pulse-soft" />
        <div className="relative size-20 rounded-full bg-gradient-to-br from-[#16382B] to-[#43A047] flex items-center justify-center shadow-lg">
          <Sprout className="size-10 text-white" strokeWidth={2} />
        </div>
        {/* Decorative leaves */}
        <Sprout className="absolute -top-1 -right-2 size-5 text-[#16382B]/40 rotate-12" />
        <Sprout className="absolute -bottom-1 -left-2 size-4 text-[#16382B]/30 -rotate-12" />
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-1.5">
        Tracking will begin soon
      </h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
        Tracking information will appear once your order is processed.
        {orderNumber && (
          <>
            <br />
            <span className="text-xs text-slate-400 mt-1 inline-block">
              Order #{orderNumber}
            </span>
          </>
        )}
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="size-3.5" />
        <span>Usually starts within 1-2 hours</span>
      </div>
    </div>
  );
}
