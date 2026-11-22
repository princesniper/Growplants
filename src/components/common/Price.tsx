import { cn } from "@/lib/utils";
import { formatINR, discountPercent } from "@/lib/utils";

/**
 * Price — INR-formatted price display with optional original (strikethrough)
 * and discount percentage badge. Used on every ProductCard, ProductDetail,
 * CartItemRow, OrderItemRow, ServiceCard.
 *
 * Rules (PRD §9.3 Pricing Rules):
 *   - basePrice (MRP) and sellingPrice always stored
 *   - discount % auto-calculated: ((base - selling) / base) × 100
 *   - GST 18% is tax-inclusive by default (no separate display)
 */
export interface PriceProps {
  sellingPrice: number;
  basePrice?: number; // MRP, optional — only show strikethrough if greater than selling
  size?: "sm" | "md" | "lg" | "xl";
  showDiscount?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

const SELLING_SIZE = {
  sm: "text-body-sm",
  md: "text-body",
  lg: "text-h4",
  xl: "text-h3",
} as const;

const BASE_SIZE = {
  sm: "text-caption",
  md: "text-body-sm",
  lg: "text-body-sm",
  xl: "text-body",
} as const;

export function Price({
  sellingPrice,
  basePrice,
  size = "md",
  showDiscount = true,
  className,
  align = "start",
}: PriceProps) {
  const hasDiscount = !!basePrice && basePrice > sellingPrice;
  const discount = hasDiscount ? discountPercent(basePrice!, sellingPrice) : 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        className
      )}
    >
      <span
        className={cn(
          "font-semibold text-foreground tabular-nums",
          SELLING_SIZE[size]
        )}
      >
        {formatINR(sellingPrice)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through tabular-nums",
              BASE_SIZE[size]
            )}
          >
            {formatINR(basePrice!)}
          </span>
          {showDiscount && discount > 0 && (
            <span className="text-body-sm font-semibold text-terracotta tabular-nums">
              {discount}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}
