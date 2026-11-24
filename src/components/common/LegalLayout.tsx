import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { TableOfContents, type TocItem } from "@/components/common/TableOfContents";

/**
 * LegalLayout — wrapper for legal/policy pages with sticky TOC sidebar
 * + main content area. Used on: Terms, Privacy Policy, Refund Policy.
 * API preserved: title, lastUpdated, tocItems, children, className?.
 * Typography/spacing only — policy wording is contractual and untouched.
 */
export interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  tocItems: TocItem[];
  children: React.ReactNode;
  className?: string;
}

export function LegalLayout({
  title,
  lastUpdated,
  tocItems,
  children,
  className,
}: LegalLayoutProps) {
  return (
    <Container className={cn("py-12 md:py-16", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
        {/* TOC sidebar */}
        <aside className="lg:col-span-1">
          <TableOfContents items={tocItems} />
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3 max-w-3xl">
          <div className="mb-10 border-b border-line pb-6">
            <h1 className="font-display text-h1 text-pine mb-3">
              {title}
            </h1>
            <p className="text-body-sm text-ink-soft">
              Last updated: <span className="font-medium text-ink">{lastUpdated}</span>
            </p>
          </div>
          <div className="prose prose-slate max-w-none space-y-10 text-ink-soft [&_h2]:font-display [&_h2]:text-pine [&_a]:text-pine [&_strong]:text-ink">
            {children}
          </div>
        </div>
      </div>
    </Container>
  );
}
