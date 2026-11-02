"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterSidebar, type ShopFilters } from "@/components/shop/FilterSidebar";

export interface MobileFilterSheetProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultCount: number;
}

export function MobileFilterSheet({ filters, onChange, onClear, open, onOpenChange, resultCount }: MobileFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col [&>button]:hidden">
        <SheetHeader className="p-4 border-b border-slate-200 space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-[#16382B] flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close filters" className="rounded-full">
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <FilterSidebar filters={filters} onChange={onChange} onClear={onClear} />
        </div>
        <div className="p-4 border-t border-slate-200">
          <Button onClick={() => onOpenChange(false)} className="w-full bg-[#16382B] hover:bg-[#A8843F]">
            Show {resultCount} Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
