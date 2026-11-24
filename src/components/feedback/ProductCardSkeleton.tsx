import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProductCardSkeleton — loading state for ProductCard.
 * Matches the layout of the real ProductCard: image, badges, title,
 * rating row, price, and Add-to-Cart button.
 *
 * Used by: Shop grid, Home carousels, PDP related, Wishlist, Search.
 */
export interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[18px] border border-border bg-card p-3",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-square w-full rounded-xl bg-sand" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/3 bg-sand" />
        <Skeleton className="h-4 w-3/4 bg-sand" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16 bg-sand" />
          <Skeleton className="h-3 w-10 bg-sand" />
        </div>
        <Skeleton className="h-5 w-1/2 bg-sand" />
        <Skeleton className="h-9 w-full rounded-full bg-sand" />
      </div>
    </div>
  );
}
