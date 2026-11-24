"use client";

/**
 * GrowPlants — StatusBadge
 * ============================================================================
 * Reusable pill-shaped status badge. Used in:
 *   - Order header (current status)
 *   - Tracking summary card
 *   - Live status banner
 *
 * Variants:
 *   - solid  → solid colored background, white text
 *   - soft   → light tinted background, colored text
 *   - outline→ transparent background, colored border + text
 * ============================================================================
 */
import { cn } from "@/lib/utils";

type BadgeVariant = "solid" | "soft" | "outline";
type BadgeColor =
  | "amber" | "blue" | "green" | "red" | "purple" | "orange"
  | "teal" | "cyan" | "indigo" | "emerald" | "slate" | "rose";

interface StatusBadgeProps {
  label: string;
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: "xs" | "sm" | "md";
  icon?: React.ReactNode;
  className?: string;
}

const COLOR_MAP: Record<BadgeColor, { solid: string; soft: string; outline: string; dot: string }> = {
  amber:   { solid: "bg-brass text-white",           soft: "bg-gold-tint text-brass-deep",      outline: "border border-brass/50 text-brass-deep",      dot: "bg-brass" },
  blue:    { solid: "bg-pine text-ivory",            soft: "bg-pine/10 text-pine",              outline: "border border-pine/40 text-pine",             dot: "bg-pine" },
  green:   { solid: "bg-moss text-white",            soft: "bg-sage-wash text-moss",            outline: "border border-moss/40 text-moss",            dot: "bg-moss" },
  red:     { solid: "bg-terracotta text-white",      soft: "bg-terracotta/10 text-terracotta",  outline: "border border-terracotta/40 text-terracotta",  dot: "bg-terracotta" },
  purple:  { solid: "bg-brass-deep text-white",      soft: "bg-gold-tint text-brass-deep",      outline: "border border-brass/50 text-brass-deep",      dot: "bg-brass-deep" },
  orange:  { solid: "bg-terracotta text-white",      soft: "bg-clay text-terracotta",           outline: "border border-terracotta/40 text-terracotta",  dot: "bg-terracotta" },
  teal:    { solid: "bg-sage text-white",            soft: "bg-sage-wash text-pine",            outline: "border border-sage/50 text-pine",            dot: "bg-sage" },
  cyan:    { solid: "bg-charcoal text-ivory",        soft: "bg-stone text-charcoal",            outline: "border border-line text-charcoal",            dot: "bg-charcoal" },
  indigo:  { solid: "bg-pine text-ivory",            soft: "bg-pine/10 text-pine",              outline: "border border-pine/40 text-pine",             dot: "bg-pine" },
  emerald: { solid: "bg-moss text-white",            soft: "bg-sage-wash text-moss",            outline: "border border-moss/40 text-moss",            dot: "bg-moss" },
  slate:   { solid: "bg-charcoal text-ivory",        soft: "bg-stone text-ink-soft",            outline: "border border-line text-ink-soft",            dot: "bg-sage" },
  rose:    { solid: "bg-terracotta text-white",      soft: "bg-terracotta/10 text-terracotta",  outline: "border border-terracotta/40 text-terracotta",  dot: "bg-terracotta" },
};

const SIZE_MAP = {
  xs: "text-[10px] px-2 py-0.5 gap-1",
  sm: "text-xs px-2.5 py-1 gap-1.5",
  md: "text-sm px-3 py-1.5 gap-1.5",
};

export function StatusBadge({
  label,
  color = "slate",
  variant = "soft",
  size = "sm",
  icon,
  className,
}: StatusBadgeProps) {
  const colors = COLOR_MAP[color];

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap transition-colors",
        SIZE_MAP[size],
        variant === "solid" && colors.solid,
        variant === "soft" && colors.soft,
        variant === "outline" && colors.outline,
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
