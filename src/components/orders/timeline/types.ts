/**
 * GrowPlants — Order Timeline Types
 * ============================================================================
 * Shared TypeScript types for the premium order tracking timeline.
 * All components are props-driven — no hardcoded timeline data.
 * ============================================================================
 */
import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Order, OrderStatus } from "@/contexts/OrdersContext";

/** Visual state of a single timeline step. */
export type StepState =
  | "completed"     // green checkmark, filled connector
  | "current"       // primary color, pulse glow, elevated
  | "upcoming"      // muted grey, dashed connector
  | "cancelled"     // red X (only for cancelled orders)
  | "skipped";      // muted (e.g. payment_confirmed for COD orders)

/** A single stage definition in the tracking journey. */
export interface TimelineStage {
  /** Unique id (matches OrderStatus for completed/current logic) */
  id: string;
  /** Display label (e.g. "Order Placed") */
  label: string;
  /** Short description shown under the label */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Mapped OrderStatus — when order.orderStatus === this, step is "current" */
  status: OrderStatus;
  /**
   * Optional: stages that may be skipped depending on order data.
   * E.g. payment_confirmed is skipped for COD orders (payment on delivery).
   * Returns true if this stage should be skipped.
   */
  skipIf?: (order: Order) => boolean;
  /**
   * Optional: contextual fields to display when this step is completed or current.
   * E.g. courierPartner, trackingNumber, driverContact, etc.
   */
  displayFields?: (order: Order) => TimelineDisplayField[];
  /** Botanical theme accent — special styling for quality_inspection */
  accent?: "default" | "botanical";
}

/** A key-value field rendered in step detail (e.g. "Courier: Delhivery"). */
export interface TimelineDisplayField {
  label: string;
  value: string;
  /** Optional icon for the field */
  icon?: LucideIcon;
  /** Optional: render value as a link (e.g. tracking number → courier site) */
  href?: string;
}

/** Computed state for a single step in the timeline. */
export interface TimelineStepState {
  stage: TimelineStage;
  state: StepState;
  /** ISO date when this step was completed (from order.statusHistory), or null */
  completedAt: string | null;
  /** Index in the stages array (0-based) */
  index: number;
}

/** Props for the main OrderTimeline orchestrator. */
export interface OrderTimelineProps {
  order: Order;
  /** Loading state — shows skeleton */
  loading?: boolean;
  /** Error state — shows retry/support */
  error?: string | null;
  /** Retry callback (used by error state) */
  onRetry?: () => void;
  /** Show the live status banner at top */
  showBanner?: boolean;
  /** Show the progress card (with % and ETA) */
  showProgressCard?: boolean;
  /** Show the summary card (order#, tracking#, address, payment) */
  showSummaryCard?: boolean;
  /** Layout: 'auto' picks horizontal on desktop, vertical on mobile */
  layout?: "horizontal" | "vertical" | "auto";
  /** Compact mode (smaller spacing, used in order confirmation page) */
  compact?: boolean;
  /** Optional className for the root */
  className?: string;
}

/** Props shared by presentational components. */
export interface TimelinePrimitiveProps {
  className?: string;
}
