import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * PageHero — reusable page header with breadcrumb + title + subtitle.
 * Used on: About, Contact, FAQ, Terms, Privacy, Refund Policy pages.
 *
 * Visual: sage-wash band with breadcrumb, brass overline, Cormorant
 * display title, and optional subtitle. Centered or left-aligned.
 * API preserved: overline, title, subtitle?, breadcrumbs? (default Home),
 * align?, className?.
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
    <section className={cn("bg-sage-wash border-b border-line", className)}>
      <Container className="py-12 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex items-center gap-1.5 text-sm text-ink-soft">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3 text-ink-soft/60" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-pine transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-pine font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={cn(align === "center" && "text-center mx-auto max-w-3xl")}>
          {overline && (
            <p className="text-overline text-brass-deep mb-3">
              {overline}
            </p>
          )}
          <h1 className="font-display text-h1 text-pine leading-tight">
            {title}
          </h1>
          <span
            aria-hidden="true"
            className={cn(
              "mt-4 block h-0.5 w-12 rounded-full bg-brass",
              align === "center" && "mx-auto"
            )}
          />
          {subtitle && (
            <p className="text-body-lg text-ink-soft mt-4 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
