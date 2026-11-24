"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ShopPagination({ currentPage, totalPages, onPageChange, className }: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > half + 1) pages.push("...");
    const start = Math.max(2, currentPage - half + 1);
    const end = Math.min(totalPages - 1, currentPage + half - 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - half) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="size-9 rounded-md flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-[#F3F8F1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "size-9 rounded-md flex items-center justify-center text-sm font-medium transition-colors",
              p === currentPage
                ? "bg-[#16382B] text-white"
                : "border border-slate-200 text-slate-600 hover:bg-[#F3F8F1]"
            )}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="size-9 rounded-md flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-[#F3F8F1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
