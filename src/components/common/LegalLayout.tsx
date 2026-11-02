import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { TableOfContents, type TocItem } from "@/components/common/TableOfContents";

/**
 * LegalLayout — wrapper for legal/policy pages with sticky TOC sidebar
 * + main content area. Used on: Terms, Privacy Policy, Refund Policy.
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
    <Container className={cn("py-10 md:py-14", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
        {/* TOC sidebar */}
        <aside className="lg:col-span-1">
          <TableOfContents items={tocItems} />
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-[#16382B] mb-2">
              {title}
            </h1>
            <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
          </div>
          <div className="prose prose-slate max-w-none space-y-8">
            {children}
          </div>
        </div>
      </div>
    </Container>
  );
}
