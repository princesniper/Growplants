import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/feedback/ProductCardSkeleton";

/**
 * SectionSkeleton — full section loading state with header + grid.
 * Used when an entire homepage/shop section is loading.
 *
 * Variants:
 *   - grid: header + N-column card grid (default)
 *   - carousel: header + horizontal scroll of cards
 *   - list: header + list items
 */
export interface SectionSkeletonProps {
  variant?: "grid" | "carousel" | "list";
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
  showHeader?: boolean;
}

const GRID_COLS = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const;

export function SectionSkeleton({
  variant = "grid",
  count = 4,
  columns = 4,
  className,
  showHeader = true,
}: SectionSkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div className={cn("space-y-6", className)} aria-hidden="true">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-sand" />
            <Skeleton className="h-3 w-32 bg-sand" />
          </div>
          <Skeleton className="h-4 w-16 bg-sand" />
        </div>
      )}

      {variant === "grid" && (
        <div className={cn("grid gap-4", GRID_COLS[columns])}>
          {items.map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {variant === "carousel" && (
        <div className="flex gap-4 overflow-hidden">
          {items.map((_, i) => (
            <ProductCardSkeleton key={i} className="w-[180px] sm:w-[220px] shrink-0" />
          ))}
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-3">
          {items.map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-[18px] bg-card">
              <Skeleton className="size-16 rounded-lg bg-sand shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-sand" />
                <Skeleton className="h-3 w-1/2 bg-sand" />
                <Skeleton className="h-4 w-1/3 bg-sand" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
