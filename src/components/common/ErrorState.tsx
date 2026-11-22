import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ErrorState — composable error-state component for failed data fetches,
 * API errors, or page-level failures. Includes a retry CTA and optional
 * error code / support link.
 *
 * Used by: every page's error boundary, list/grid sections when fetch fails,
 * API-dependent panels (cart sync, address list, order list).
 */
export interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  retry?: {
    label?: string;
    onClick: () => void | Promise<void>;
  };
  errorCode?: string;
  showSupport?: boolean;
  className?: string;
}

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "Please try again. If the problem persists, contact support.",
  retry,
  errorCode,
  showSupport = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 py-10 px-4",
        className
      )}
      role="alert"
    >
      <div
        className="size-14 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center"
      >
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
        <p className="text-body-sm text-muted-foreground">{description}</p>
      </div>
      {errorCode && (
        <p className="text-caption text-muted-foreground font-mono">
          Error code: {errorCode}
        </p>
      )}
      {retry && (
        <Button
          onClick={() => retry.onClick()}
          variant="outline"
          size="sm"
          className="mt-2 gap-2"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {retry.label ?? "Retry"}
        </Button>
      )}
      {showSupport && (
        <a
          href="/contact"
          className="text-body-sm text-primary hover:text-brass-deep mt-1 underline-offset-4 hover:underline"
        >
          Contact support
        </a>
      )}
    </div>
  );
}
