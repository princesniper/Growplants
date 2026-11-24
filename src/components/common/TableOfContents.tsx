"use client";

import { cn } from "@/lib/utils";

/**
 * TableOfContents — sticky sidebar TOC for legal/policy pages.
 * Links scroll to sections via anchor IDs. Active section is not tracked
 * (kept simple for Phase 6; do not add scroll-spy).
 */
export interface TocItem {
  id: string;
  label: string;
}

export interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "sticky top-24 hidden lg:block rounded-2xl border border-line bg-paper p-5 shadow-sm",
        className
      )}
    >
      <p className="text-overline text-brass-deep mb-4">
        On This Page
      </p>
      <ul className="space-y-1 border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block pl-3 py-1.5 text-sm text-ink-soft hover:text-pine hover:border-l-2 hover:border-pine -ml-px transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
