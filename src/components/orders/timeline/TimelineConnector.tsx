"use client";

/**
 * GrowPlants — TimelineConnector
 * ============================================================================
 * Animated connector line between timeline steps.
 *
 * Desktop (horizontal): renders a horizontal line to the right of the step.
 * Mobile (vertical):   renders a vertical line below the step.
 *
 * States:
 *   - completed → solid brand green, full fill, animated draw-in
 *   - current   → brand green at 50% (partial fill, animating toward full)
 *   - upcoming  → light grey, no animation
 *   - cancelled → red dashed
 * ============================================================================
 */
import { cn } from "@/lib/utils";

interface TimelineConnectorProps {
  state: "completed" | "current" | "upcoming" | "cancelled_step";
  orientation: "horizontal" | "vertical";
  /** Whether this is the last step (no connector rendered) */
  isLast?: boolean;
  className?: string;
}

export function TimelineConnector({
  state,
  orientation,
  isLast = false,
  className,
}: TimelineConnectorProps) {
  if (isLast) return null;

  if (orientation === "horizontal") {
    return (
      <div
        className={cn(
          "absolute top-5 left-1/2 w-full h-1 rounded-full overflow-hidden",
          className,
        )}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-slate-200" />
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-700 ease-out",
            state === "completed" && "bg-[#16382B] w-full",
            state === "current" && "bg-[#16382B] w-1/2",
            state === "upcoming" && "w-0",
            state === "cancelled_step" && "bg-red-400 w-full opacity-50",
          )}
          style={{ transformOrigin: "left" }}
        />
      </div>
    );
  }

  // Vertical (mobile)
  return (
    <div
      className={cn(
        "absolute left-3.5 top-9 bottom-0 w-1 rounded-full overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-slate-200" />
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-700 ease-out",
          state === "completed" && "bg-[#16382B] h-full",
          state === "current" && "bg-[#16382B] h-1/2",
          state === "upcoming" && "h-0",
          state === "cancelled_step" && "bg-red-400 h-full opacity-50",
        )}
        style={{ transformOrigin: "top" }}
      />
    </div>
  );
}
