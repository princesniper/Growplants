import { cn } from "@/lib/utils";

/**
 * RatingHistogram — visual rating breakdown (5→1 stars with bar + count + %).
 * Used on: PDP reviews summary, ServiceDetail reviews, ProviderProfile.
 *
 * Props:
 *   - breakdown: array of { stars, count, percentage }
 *   - averageRating, totalCount: shown above the bars
 *
 * Bar fill uses brass to match the Rating star colour (blueprint E1).
 */
export interface RatingHistogramProps {
  breakdown: { stars: 1 | 2 | 3 | 4 | 5; count: number; percentage: number }[];
  averageRating?: number;
  totalCount?: number;
  className?: string;
  showHeader?: boolean;
}

const STAR_LABELS = ["", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"];

export function RatingHistogram({
  breakdown,
  averageRating,
  totalCount,
  className,
  showHeader = false,
}: RatingHistogramProps) {
  // Sort 5→1
  const sorted = [...breakdown].sort((a, b) => b.stars - a.stars);

  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (averageRating !== undefined || totalCount !== undefined) && (
        <div className="flex items-baseline gap-3 mb-2">
          {averageRating !== undefined && (
            <span className="text-h2 font-bold text-foreground tabular-nums">
              {averageRating.toFixed(1)}
            </span>
          )}
          {totalCount !== undefined && (
            <span className="text-body-sm text-muted-foreground">
              based on {totalCount} review{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((row) => (
          <div key={row.stars} className="flex items-center gap-2">
            <span className="text-body-sm text-muted-foreground w-14 shrink-0 tabular-nums">
              {row.stars} star
            </span>
            <div
              className="flex-1 h-2 rounded-full bg-line overflow-hidden"
              role="img"
              aria-label={`${STAR_LABELS[row.stars]}: ${row.percentage}% (${row.count} reviews)`}
            >
              <div
                className="h-full rounded-full bg-warning transition-all duration-500 ease-base"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
            <span className="text-body-sm text-muted-foreground w-10 text-right tabular-nums shrink-0">
              {row.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
