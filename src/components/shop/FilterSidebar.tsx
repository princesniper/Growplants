"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { SHOP_CATEGORIES, SUNLIGHT_OPTIONS, DIFFICULTY_OPTIONS, SUITABLE_FOR_OPTIONS } from "@/data/shopData";

export interface ShopFilters {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  sunlight: string[];
  difficulty: string[];
  suitableFor: string[];
  inStockOnly: boolean;
  petSafeOnly: boolean;
}

export interface FilterSidebarProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  onClear: () => void;
  className?: string;
}

const PRICE_MIN = 0;
const PRICE_MAX = 2000;

export function FilterSidebar({ filters, onChange, onClear, className }: FilterSidebarProps) {
  const toggleArray = (key: "categories" | "sunlight" | "difficulty" | "suitableFor", value: string) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#16382B]">Filters</h3>
        <button onClick={onClear} className="text-xs font-semibold text-[#C6A15B] hover:underline">Clear All</button>
      </div>
      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-700">Category</h4>
        <ul className="space-y-1.5">
          {SHOP_CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#16382B] transition-colors">
                <Checkbox checked={filters.categories.includes(cat.slug)} onCheckedChange={() => toggleArray("categories", cat.slug)} />
                <span className="text-sm text-slate-600 flex-1">{cat.name}</span>
                <span className="text-xs text-slate-400">({cat.count})</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-700">Price Range</h4>
        <Slider value={filters.priceRange} min={PRICE_MIN} max={PRICE_MAX} step={50} onValueChange={(val) => onChange({ ...filters, priceRange: [val[0], val[1]] as [number, number] })} className="py-2" />
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>₹{filters.priceRange[0]}</span>
          <span>₹{filters.priceRange[1]}{filters.priceRange[1] === PRICE_MAX ? "+" : ""}</span>
        </div>
      </div>
      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-700">Minimum Rating</h4>
        <div className="flex items-center gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button key={r} onClick={() => onChange({ ...filters, minRating: r })}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", filters.minRating === r ? "bg-[#16382B] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {r === 0 ? "All" : `${r}★+`}
            </button>
          ))}
        </div>
      </div>
      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-700">Sunlight</h4>
        <ul className="space-y-1.5">
          {SUNLIGHT_OPTIONS.map((s) => (
            <li key={s}><label className="flex items-center gap-2 cursor-pointer hover:text-[#16382B] transition-colors"><Checkbox checked={filters.sunlight.includes(s)} onCheckedChange={() => toggleArray("sunlight", s)} /><span className="text-sm text-slate-600">{s}</span></label></li>
          ))}
        </ul>
      </div>
      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-700">Care Difficulty</h4>
        <ul className="space-y-1.5">
          {DIFFICULTY_OPTIONS.map((d) => (
            <li key={d}><label className="flex items-center gap-2 cursor-pointer hover:text-[#16382B] transition-colors"><Checkbox checked={filters.difficulty.includes(d)} onCheckedChange={() => toggleArray("difficulty", d)} /><span className="text-sm text-slate-600">{d}</span></label></li>
          ))}
        </ul>
      </div>
      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-700">Suitable For</h4>
        <ul className="space-y-1.5">
          {SUITABLE_FOR_OPTIONS.map((s) => (
            <li key={s}><label className="flex items-center gap-2 cursor-pointer hover:text-[#16382B] transition-colors"><Checkbox checked={filters.suitableFor.includes(s)} onCheckedChange={() => toggleArray("suitableFor", s)} /><span className="text-sm text-slate-600">{s}</span></label></li>
          ))}
        </ul>
      </div>
      <Separator />

      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-medium text-slate-700">In Stock Only</span><Checkbox checked={filters.inStockOnly} onCheckedChange={(v) => onChange({ ...filters, inStockOnly: !!v })} /></label>
        <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-medium text-slate-700">Pet Safe Only</span><Checkbox checked={filters.petSafeOnly} onCheckedChange={(v) => onChange({ ...filters, petSafeOnly: !!v })} /></label>
      </div>
    </div>
  );
}

export const DEFAULT_FILTERS: ShopFilters = {
  categories: [], priceRange: [PRICE_MIN, PRICE_MAX], minRating: 0, sunlight: [], difficulty: [], suitableFor: [], inStockOnly: false, petSafeOnly: false,
};
