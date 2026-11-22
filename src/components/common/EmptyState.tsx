import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * EmptyState — composable empty-state component used everywhere a list,
 * cart, wishlist, search, or dashboard section has no data.
 *
 * Structure:
 *   [Icon in tinted circle]
 *   [Title]
 *   [Description]
 *   [CTA Button (optional)]
 *
 * Bilingual support: pass raw strings OR translation keys resolved by the
 * caller via useBilingual().t() — EmptyState itself is presentational.
 */
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: {
    iconWrap: "size-10",
    icon: "size-5",
    title: "text-body-lg",
    desc: "text-body-sm",
    pad: "py-6",
  },
  md: {
    iconWrap: "size-14",
    icon: "size-7",
    title: "text-h3",
    desc: "text-body-sm",
    pad: "py-10",
  },
  lg: {
    iconWrap: "size-20",
    icon: "size-10",
    title: "text-h2",
    desc: "text-body",
    pad: "py-16",
  },
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const s = SIZE_MAP[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3",
        s.pad,
        className
      )}
      role="status"
    >
      <div
        className={cn(
          "rounded-full bg-primary/10 text-primary flex items-center justify-center",
          s.iconWrap
        )}
      >
        <Icon className={s.icon} aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className={cn("font-display font-semibold text-foreground", s.title)}>{title}</h3>
        {description && (
          <p className={cn("text-muted-foreground", s.desc)}>{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-2">
          {action.href ? (
            <Button asChild size={size === "lg" ? "default" : "sm"}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} size={size === "lg" ? "default" : "sm"}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
