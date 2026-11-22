import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  OrderStatus,
  PaymentStatus,
  BookingStatus,
  ProviderVerificationStatus,
  ReturnStatus,
  UserStatus,
} from "@/lib/enums";

/**
 * StatusPill — enum-aware status badge.
 * Maps every GrowPlants status enum to a consistent color + label.
 * Used across: order cards, booking cards, provider lists, admin tables,
 * returns, customer profiles.
 *
 * Colors follow the locked premium tokens (blueprint Part E1 — no blue/green/
 * amber Tailwind pastels): moss = success, brass = warning, terracotta =
 * danger, pine tint = informational (confirmed / out for delivery), stone =
 * muted/refunded. Pill shape per blueprint radii (chips 999px).
 */
export interface StatusPillProps {
  status:
    | OrderStatus
    | PaymentStatus
    | BookingStatus
    | ProviderVerificationStatus
    | ReturnStatus
    | UserStatus;
  className?: string;
}

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

const STATUS_MAP: Record<string, { label: string; variant: Variant }> = {
  /* Order */
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  processing: { label: "Processing", variant: "warning" },
  out_for_delivery: { label: "Out for Delivery", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  return_requested: { label: "Return Requested", variant: "warning" },
  return_approved: { label: "Return Approved", variant: "info" },
  return_completed: { label: "Return Completed", variant: "secondary" },
  refunded: { label: "Refunded", variant: "secondary" },

  /* Payment */
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  partial_refund: { label: "Partial Refund", variant: "secondary" },

  /* Booking */
  provider_assigned: { label: "Provider Assigned", variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  no_show_provider: { label: "No-Show (Provider)", variant: "destructive" },
  no_show_customer: { label: "No-Show (Customer)", variant: "destructive" },
  disputed: { label: "Disputed", variant: "destructive" },

  /* Provider Verification */
  approved_provider: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },

  /* Return */
  requested: { label: "Requested", variant: "warning" },
  under_review: { label: "Under Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },

  /* User */
  active: { label: "Active", variant: "success" },
  suspended: { label: "Suspended", variant: "warning" },
  deleted: { label: "Deleted", variant: "secondary" },
};

const VARIANT_CLASSES: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground border-border",
  success: "bg-success/15 text-success border border-success/30 hover:bg-success/20",
  warning: "bg-warning/15 text-warning border border-warning/30 hover:bg-warning/20",
  info: "bg-pine/10 text-pine border border-pine/25 hover:bg-pine/15",
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: "outline" as Variant,
  };

  return (
    <Badge
      className={cn(
        "font-medium capitalize rounded-full border-0",
        VARIANT_CLASSES[config.variant],
        className
      )}
      variant="outline"
    >
      {config.label}
    </Badge>
  );
}
