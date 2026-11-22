"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconBadge — icon button with a numeric bubble count overlay.
 * Used in Header for: Cart (item count), Wishlist (item count),
 * Notifications (unread count).
 *
 * States:
 *   - count=0: icon only, no bubble
 *   - count=1-9: small bubble with number
 *   - count=10-99: wider bubble with number
 *   - count=100+: bubble shows "99+"
 *
 * Accessibility:
 *   - Accessible name includes count (e.g., "Cart, 3 items")
 *   - Bubble is aria-hidden (decorative — count is in label)
 */
export interface IconBadgeProps {
  icon: LucideIcon;
  count: number;
  href?: string;
  onClick?: () => void;
  label: string; // e.g., "Cart"
  className?: string;
  size?: "sm" | "md";
  showCount?: boolean; // default true; set false to hide bubble
}

const ICON_SIZE = {
  sm: "size-4",
  md: "size-5",
} as const;

const BTN_SIZE = {
  sm: "size-9",
  md: "size-10",
} as const;

export function IconBadge({
  icon: Icon,
  count,
  href,
  onClick,
  label,
  className,
  size = "md",
  showCount = true,
}: IconBadgeProps) {
  const displayCount = count > 99 ? "99+" : String(count);
  const accessibleLabel =
    count > 0 ? `${label}, ${count} ${count === 1 ? "item" : "items"}` : label;

  const inner = (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full text-foreground hover:bg-sage-wash hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        BTN_SIZE[size],
        className
      )}
      role={href ? undefined : "button"}
      tabIndex={href ? undefined : 0}
    >
      <Icon className={ICON_SIZE[size]} aria-hidden="true" />
      {showCount && count > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
            "flex items-center justify-center",
            "rounded-full bg-warning text-on-warning text-[10px] font-bold tabular-nums",
            "ring-2 ring-background"
          )}
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex"
        aria-label={accessibleLabel}
        onClick={onClick}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={accessibleLabel}
      className="inline-flex bg-transparent border-0 p-0 cursor-pointer"
    >
      {inner}
    </button>
  );
}
