import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Flame, Star, PackageX } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * ProductBadges — Sale / New Arrival / Best Seller / Out of Stock badges for
 * ProductCard. Renders up to 2 badges (priority: OOS > Sale > BestSeller >
 * New Arrival), so the discount % stays the most prominent badge at a glance.
 *
 * Badge hierarchy in the locked system (blueprint E1):
 *   - Sale % OFF: solid terracotta (sale energy), ivory text — most prominent
 *   - Best Seller: solid pine, ivory text
 *   - New Arrival: sage wash, pine text — quietest, never competes with sale
 *   - Out of Stock: stone, muted text
 * Each badge renders ONLY when the product data actually carries that flag —
 * nothing is invented here.
 *
 * Used on: ProductCard, PDP header.
 */
export interface ProductBadgesProps {
  isOutOfStock?: boolean;
  isOnSale?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  discountPercent?: number; // shown if isOnSale
  className?: string;
  maxBadges?: number;
}

interface BadgeConfig {
  icon: LucideIcon;
  label: string;
  className: string;
}

export function ProductBadges({
  isOutOfStock,
  isOnSale,
  isBestseller,
  isNewArrival,
  discountPercent,
  className,
  maxBadges = 2,
}: ProductBadgesProps) {
  const badges: BadgeConfig[] = [];

  if (isOutOfStock) {
    badges.push({
      icon: PackageX,
      label: "Out of Stock",
      className: "bg-muted text-muted-foreground",
    });
  }
  if (isOnSale && discountPercent && discountPercent > 0) {
    badges.push({
      icon: Flame,
      label: `${discountPercent}% OFF`,
      className: "bg-terracotta text-ivory",
    });
  }
  if (isBestseller) {
    badges.push({
      icon: Star,
      label: "Best Seller",
      className: "bg-primary text-primary-foreground",
    });
  }
  if (isNewArrival) {
    badges.push({
      icon: Sparkles,
      label: "New Arrival",
      className: "bg-sage-wash text-pine border border-pine/20",
    });
  }

  const visible = badges.slice(0, maxBadges);
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((badge, i) => (
        <Badge
          key={i}
          className={cn(
            "gap-1 rounded-full border-0 px-2.5 py-0.5 text-caption font-semibold",
            badge.className
          )}
          variant="outline"
        >
          <badge.icon className="size-3" aria-hidden="true" />
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
