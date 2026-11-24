"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortValue } from "@/data/shopData";

export interface SortDropdownProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor="sort-select" className="text-sm text-slate-500 mr-2 hidden sm:inline">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-9 py-2 text-sm font-medium text-slate-700 hover:border-[#16382B]/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16382B]/20"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
