import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ListSkeleton — generic list-item skeleton for order/booking/address lists.
 * Used by: Order History, Booking History, Address Book, Notifications.
 *
 * Each item: small square thumbnail + 3 lines of text + trailing badge.
 */
export interface ListSkeletonProps {
  count?: number;
  className?: string;
  showThumbnail?: boolean;
}

export function ListSkeleton({
  count = 4,
  className,
  showThumbnail = true,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 border border-border rounded-[18px] bg-card"
        >
          {showThumbnail && (
            <Skeleton className="size-12 rounded-lg bg-sand shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2 bg-sand" />
            <Skeleton className="h-3 w-3/4 bg-sand" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-sand" />
        </div>
      ))}
    </div>
  );
}
