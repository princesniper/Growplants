"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CART_MAX_QUANTITY_PER_ITEM } from "@/lib/constants";

/**
 * QuantitySelector — numeric stepper for cart/checkout/product detail.
 *
 * Rules (PRD §10.1 FR-CART-004):
 *   - Min: 1
 *   - Max: 10 (CART_MAX_QUANTITY_PER_ITEM) OR availableStock — whichever is lower
 *   - Buttons disabled at bounds
 *
 * Used on: PDP, CartItemRow, CartDrawer item, OrderItemRow (display-only).
 */
export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number; // defaults to CART_MAX_QUANTITY_PER_ITEM (10)
  min?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "readonly";
}

const BTN_SIZE = {
  sm: "size-7",
  md: "size-9",
} as const;

const TEXT_SIZE = {
  sm: "text-body-sm w-8",
  md: "text-body w-10",
} as const;

export function QuantitySelector({
  value,
  onChange,
  max = CART_MAX_QUANTITY_PER_ITEM,
  min = 1,
  disabled = false,
  size = "sm",
  className,
  variant = "default",
}: QuantitySelectorProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  if (variant === "readonly") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 font-medium tabular-nums",
          TEXT_SIZE[size],
          className
        )}
      >
        Qty {value}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card",
        size === "sm" ? "p-0.5" : "p-1",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="group"
      aria-label="Quantity selector"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={atMin || disabled}
        className={cn(BTN_SIZE[size], "rounded-full hover:bg-sage-wash")}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </Button>
      <span
        className={cn(
          "text-center font-medium tabular-nums text-foreground",
          TEXT_SIZE[size]
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={atMax || disabled}
        className={cn(BTN_SIZE[size], "rounded-full hover:bg-sage-wash")}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
