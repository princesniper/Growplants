"use client";

import { cn } from "@/lib/utils";

/**
 * TableOfContents — sticky sidebar TOC for legal/policy pages.
 * Links scroll to sections via anchor IDs. Active section is not tracked
 * (kept simple for Phase 6; can add scroll-spy later).
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
        "sticky top-24 hidden lg:block space-y-1",
        className
      )}
    >
      <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B] mb-3">
        On This Page
      </p>
      <ul className="space-y-1 border-l border-slate-200">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block pl-3 py-1.5 text-sm text-slate-600 hover:text-[#16382B] hover:border-l-2 hover:border-[#16382B] -ml-px transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
