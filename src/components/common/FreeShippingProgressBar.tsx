"use client";

import { Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

/**
 * FreeShippingProgressBar — visual indicator showing how much more a
 * customer needs to add to their cart to unlock free shipping.
 *
 * Rules (PRD §10.1 FR-CART-012, §32.2):
 *   - Free shipping threshold: ₹499
 *   - When threshold met: shows success state with checkmark
 *   - Otherwise: shows progress bar + remaining amount
 *
 * Used in: CartDrawer (Phase 3), Cart page (Phase 9).
 */
export interface FreeShippingProgressBarProps {
  subtotal: number;
  className?: string;
  variant?: "full" | "compact";
}

export function FreeShippingProgressBar({
  subtotal,
  className,
  variant = "full",
}: FreeShippingProgressBarProps) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const achieved = subtotal >= FREE_SHIPPING_THRESHOLD;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (achieved) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-[18px] bg-success/10 text-success border border-success/30 px-3 py-2",
          className
        )}
        role="status"
      >
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-body-sm font-medium">
          {variant === "full"
            ? "You've unlocked FREE shipping!"
            : "FREE shipping unlocked"}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <p className="text-caption text-muted-foreground">
          Add <span className="font-semibold text-foreground">{formatINR(remaining)}</span> more for FREE shipping
        </p>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-base"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[18px] bg-sage-wash border border-line", className)}
      role="status"
      aria-live="polite"
    >
      <Truck className="size-5 text-primary shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <p className="text-body-sm text-foreground">
          Add{" "}
          <span className="font-semibold text-primary">
            {formatINR(remaining)}
          </span>{" "}
          more for{" "}
          <span className="font-semibold">FREE shipping</span>
        </p>
        <div
          className="h-1.5 w-full rounded-full bg-border overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Free shipping progress: ${Math.round(progressPercent)}%`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-base"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
