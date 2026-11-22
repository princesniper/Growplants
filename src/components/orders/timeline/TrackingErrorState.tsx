"use client";

/**
 * GrowPlants — TrackingErrorState
 * ============================================================================
 * Error state shown when tracking data can't be loaded. Includes retry and
 * support buttons.
 * ============================================================================
 */
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackingErrorStateProps {
  /** Error message */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Support callback (e.g. open WhatsApp / navigate to /contact) */
  onContactSupport?: () => void;
  className?: string;
}

export function TrackingErrorState({
  message = "Unable to load tracking information.",
  onRetry,
  onContactSupport,
  className,
}: TrackingErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-terracotta/30 bg-terracotta/5",
        className,
      )}
      role="alert"
    >
      {/* Icon */}
      <div className="size-16 rounded-full bg-clay flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="size-8 text-terracotta" strokeWidth={2} />
      </div>

      <h3 className="text-base font-bold text-terracotta mb-1.5">
        Tracking Unavailable
      </h3>
      <p className="text-sm text-terracotta max-w-sm leading-relaxed mb-5">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-pine hover:bg-brass-deep gap-2"
            size="sm"
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
        )}
        {onContactSupport && (
          <Button
            onClick={onContactSupport}
            variant="outline"
            className="border-terracotta/40 text-terracotta hover:bg-terracotta/10 gap-2"
            size="sm"
          >
            <Headphones className="size-4" />
            Contact Support
          </Button>
        )}
      </div>
    </div>
  );
}
