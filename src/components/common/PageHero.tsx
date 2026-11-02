import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * PageHero — reusable page header with breadcrumb + title + subtitle.
 * Used on: About, Contact, FAQ, Terms, Privacy, Refund Policy pages.
 *
 * Visual: light green surface (#F3F8F1) with breadcrumb, overline label,
 * large title, and optional subtitle. Centered or left-aligned.
 */
export interface PageHeroProps {
  overline?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  align?: "left" | "center";
  className?: string;
}

export function PageHero({
  overline,
  title,
  subtitle,
  breadcrumbs = [{ label: "Home", href: "/" }],
  align = "left",
  className,
}: PageHeroProps) {
  return (
    <section className={cn("bg-[#F3F8F1] border-b border-slate-200", className)}>
      <Container className="py-10 md:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-1.5 text-sm text-slate-500">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3 text-slate-400" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#16382B] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#16382B] font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={cn(align === "center" && "text-center mx-auto max-w-3xl")}>
          {overline && (
            <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B] mb-2">
              {overline}
            </p>
          )}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#16382B] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-slate-600 mt-3 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
