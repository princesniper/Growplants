import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GuaranteeCallout — single source of truth for the replacement-promise copy.
 * Reused on PDP buy panel, cart, checkout, and FAQ so the wording never drifts.
 *
 * NOTE (owner decision pending): the "30-day replacement, photo within 48h,
 * keep the plant" wording comes from the approved design blueprint (research
 * best practice). Confirm the exact terms before launch.
 */
export interface GuaranteeCalloutProps {
  variant?: "inline" | "compact";
  className?: string;
}

export function GuaranteeCallout({ variant = "inline", className }: GuaranteeCalloutProps) {
  if (variant === "compact") {
    return (
      <p className={cn("flex items-center gap-1.5 text-caption text-ink-soft", className)}>
        <ShieldCheck className="size-3.5 text-moss shrink-0" aria-hidden="true" />
        30-day replacement promise · photo within 48h
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-brass/40 bg-gold-tint/60 p-3.5",
        className
      )}
    >
      <span className="size-9 rounded-full bg-pine text-ivory flex items-center justify-center shrink-0">
        <ShieldCheck className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-pine">30-day replacement promise</p>
        <p className="text-caption text-ink-soft mt-0.5 leading-relaxed">
          Plant damaged in transit? Photo bhejein 48h ke andar — free replacement, purana plant aapke paas.
        </p>
      </div>
    </div>
  );
}
