"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopFilters } from "@/components/shop/FilterSidebar";

export interface ActiveFilterChipsProps {
  filters: ShopFilters;
  onRemove: (key: keyof ShopFilters, value?: string) => void;
  onClear: () => void;
  className?: string;
}

export function ActiveFilterChips({ filters, onRemove, onClear, className }: ActiveFilterChipsProps) {
  const chips: { key: keyof ShopFilters; value: string; label: string }[] = [];

  filters.categories.forEach((c) => chips.push({ key: "categories", value: c, label: c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) }));
  filters.sunlight.forEach((s) => chips.push({ key: "sunlight", value: s, label: s }));
  filters.difficulty.forEach((d) => chips.push({ key: "difficulty", value: d, label: d }));
  filters.suitableFor.forEach((s) => chips.push({ key: "suitableFor", value: s, label: s }));
  if (filters.minRating > 0) chips.push({ key: "minRating", value: String(filters.minRating), label: `${filters.minRating}★+` });
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) chips.push({ key: "priceRange", value: "", label: `₹${filters.priceRange[0]}–₹${filters.priceRange[1]}` });
  if (filters.inStockOnly) chips.push({ key: "inStockOnly", value: "", label: "In Stock" });
  if (filters.petSafeOnly) chips.push({ key: "petSafeOnly", value: "", label: "Pet Safe" });

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip, i) => (
        <span
          key={`${chip.key}-${chip.value}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-[#16382B]/10 text-[#16382B] border border-[#16382B]/20 text-xs font-medium px-3 py-1"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.key, chip.value)}
            className="hover:bg-[#16382B]/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove filter: ${chip.label}`}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-xs font-semibold text-[#C6A15B] hover:underline ml-1"
      >
        Clear All
      </button>
    </div>
  );
}
