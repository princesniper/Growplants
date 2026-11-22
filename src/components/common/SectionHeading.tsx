import { cn } from "@/lib/utils";

/**
 * SectionHeading — reusable section heading with optional overline label,
 * title, subtitle, and optional action link.
 *
 * Used across all homepage sections for consistent heading hierarchy.
 * Heading level is configurable (h2 default; h3 for nested sections).
 *
 * Audit fix: provides consistent typography across all sections (audit §2.1.3).
 */
export interface SectionHeadingProps {
  overline?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  as?: "h2" | "h3";
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  overline,
  title,
  subtitle,
  action,
  as: Tag = "h2",
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 flex-wrap mb-8",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn("space-y-2", align === "center" && "max-w-2xl")}>
        {overline && (
          <p className="text-overline text-primary font-semibold">{overline}</p>
        )}
        <Tag
          className="text-h2 md:text-h2 text-foreground"
        >
          {title}
        </Tag>
        {subtitle && (
          <p className="text-body text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && (
        <a
          href={action.href}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3.5 py-1.5 text-body-sm font-medium text-primary transition-colors hover:border-brass hover:text-brass-deep shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {action.label} →
        </a>
      )}
    </div>
  );
}
