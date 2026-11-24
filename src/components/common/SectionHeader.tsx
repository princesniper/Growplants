import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

/**
 * SectionHeader — reusable section title + optional subtitle + optional
 * action link (e.g., "View All"). Editorial rhythm per blueprint:
 * serif H2 → one-line subline → single CTA, with a brass rule accent.
 */
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  icon?: LucideIcon;
  as?: "h1" | "h2" | "h3";
  className?: string;
  align?: "start" | "center";
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  as: Tag = "h2",
  className,
  align = "start",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 flex-wrap",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center")}>
        <span
          className={cn("h-1 w-12 rounded-full bg-brass", align === "center" && "mx-auto")}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="size-5 text-brass-deep" aria-hidden="true" />
          )}
          <Tag className="font-display text-h2 text-pine">
            {title}
          </Tag>
        </div>
        {subtitle && (
          <p className="text-body-sm text-ink-soft max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <a
          href={action.href}
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:text-primary-hover transition-colors group/action rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`${action.label} — ${title}`}
        >
          {action.label}
          <ArrowRight
            className="size-4 transition-transform group-hover/action:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      )}
    </div>
  );
}
