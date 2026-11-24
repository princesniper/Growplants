import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, PackageX, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * StockStatus — inventory state indicator for products.
 * Used on: ProductCard, PDP, CartItemRow.
 *
 * Variants (PRD §15.1):
 *   - in-stock: "In Stock" (green check)
 *   - low-stock: "Only X left" (amber alert) — when availableStock <= 5
 *   - out-of-stock: "Out of Stock" (red X) — when availableStock = 0
 *   - notify-me: variant of out-of-stock with bell icon (interactive caller
 *                handles the click → opens notify-me modal)
 */
export interface StockStatusProps {
  availableStock: number;
  lowStockThreshold?: number;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "notify-me";
  onNotify?: () => void;
}

interface VariantConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

function getConfig(stock: number, threshold: number): VariantConfig {
  if (stock === 0) {
    return {
      label: "Out of Stock",
      icon: PackageX,
      className: "text-destructive",
    };
  }
  if (stock <= threshold) {
    return {
      label: `Only ${stock} left`,
      icon: AlertCircle,
      className: "text-terracotta",
    };
  }
  return {
    label: "In Stock",
    icon: CheckCircle2,
    className: "text-success",
  };
}

export function StockStatus({
  availableStock,
  lowStockThreshold = 5,
  size = "sm",
  className,
  variant = "default",
  onNotify,
}: StockStatusProps) {
  const config = getConfig(availableStock, lowStockThreshold);
  const isOutOfStock = availableStock === 0;
  const isNotifyVariant = isOutOfStock && variant === "notify-me" && onNotify;

  const sizeClasses = size === "sm" ? "text-body-sm" : "text-body";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  if (isNotifyVariant) {
    return (
      <button
        type="button"
        onClick={onNotify}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-primary hover:text-brass-deep",
          sizeClasses,
          "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
      >
        <Bell className={iconSize} aria-hidden="true" />
        Notify Me
      </button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        sizeClasses,
        config.className,
        className
      )}
      role="status"
    >
      <config.icon className={iconSize} aria-hidden="true" />
      {config.label}
    </span>
  );
}
