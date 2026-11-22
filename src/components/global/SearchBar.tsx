"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useBilingual } from "@/store/useBilingual";

/**
 * SearchBar — header search input with autocomplete suggestions.
 * Source: PRD §18.1 (Search & Filter System)
 *
 * Phase 3 scope (UI only — wired to mock data):
 *   - Input with search icon + clear button
 *   - Dropdown showing suggestions as user types (min 2 chars)
 *   - Two sections: Products (with thumbnail) + Categories
 *   - Recent searches (from localStorage) when input is empty + focused
 *   - Popular searches when no recent searches
 *   - Enter key navigates to /shop?q=...
 *
 * Phase 7 (Shop) will wire this to the real /api/products/search endpoint
 * and Phase 11 will add services to the suggestions.
 */

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
}

interface SuggestionCategory {
  id: string;
  name: string;
  slug: string;
}

// Phase 3 mock data — replaced by API calls in Phase 7
const MOCK_PRODUCTS: SuggestionProduct[] = [
  { id: "1", name: "Snake Plant (Sansevieria)", slug: "snake-plant", image: "https://nurserylive.com/cdn/shop/products/nurserylive-snake-plant-sansevieria-trifasciata-plant_600x600.jpg", price: 299 },
  { id: "2", name: "Money Plant (Pothos)", slug: "money-plant", image: "https://nurserylive.com/cdn/shop/products/nurserylive-money-plant-po-thos-plant_600x600.jpg", price: 249 },
  { id: "3", name: "Areca Palm", slug: "areca-palm", image: "https://nurserylive.com/cdn/shop/products/nurserylive-areca-palm-plant_600x600.jpg", price: 499 },
  { id: "4", name: "Peace Lily", slug: "peace-lily", image: "https://nurserylive.com/cdn/shop/products/nurserylive-peace-lily-plant_600x600.jpg", price: 349 },
  { id: "5", name: "ZZ Plant", slug: "zz-plant", image: "https://nurserylive.com/cdn/shop/products/nurserylive-zz-plant_600x600.jpg", price: 599 },
];

const MOCK_CATEGORIES: SuggestionCategory[] = [
  { id: "1", name: "Indoor Plants", slug: "indoor-plants" },
  { id: "2", name: "Outdoor Plants", slug: "outdoor-plants" },
  { id: "3", name: "Succulents", slug: "succulents" },
  { id: "4", name: "Ceramic Planters", slug: "ceramic-planters" },
  { id: "5", name: "Gardening Tools", slug: "gardening-tools" },
];

const POPULAR_SEARCHES = ["Snake Plant", "Money Plant", "Indoor Plants", "Succulents"];
const RECENT_KEY = "growplants-recent-searches";

export interface SearchBarProps {
  variant?: "header" | "mobile";
  className?: string;
}

export function SearchBar({ variant = "header", className }: SearchBarProps) {
  const router = useRouter();
  const { t } = useBilingual();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw).slice(0, 5));
    } catch {
      // ignore
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions (Phase 3: client-side mock; Phase 7: API)
  const productSuggestions = query.length >= 2
    ? MOCK_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];
  const categorySuggestions = query.length >= 2
    ? MOCK_CATEGORIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)
    : [];

  const saveRecent = (term: string) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const updated = [term, ...existing.filter((s) => s !== term)].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setIsOpen(false);
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSuggestionClick = (suggestion: { type: "product" | "category"; slug: string; name: string }) => {
    saveRecent(suggestion.name);
    setIsOpen(false);
    setQuery(suggestion.name);
    if (suggestion.type === "product") {
      router.push(`/product/${suggestion.slug}`);
    } else {
      router.push(`/shop?category=${suggestion.slug}`);
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    saveRecent(term);
    setIsOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
    >
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
              variant === "mobile" ? "size-5" : "size-4"
            )}
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={t("nav.search")}
            aria-label={t("nav.search")}
            aria-expanded={isOpen}
            aria-controls="search-suggestions"
            className={cn(
              "pl-9 pr-8 rounded-full bg-muted border-border",
              "focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring",
              variant === "mobile" && "h-11"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div
          id="search-suggestions"
          role="listbox"
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-50",
            "rounded-[18px] border border-border bg-popover shadow-lg overflow-hidden",
            "max-h-[70vh] overflow-y-auto scrollbar-pretty"
          )}
        >
          {/* Product suggestions */}
          {productSuggestions.length > 0 && (
            <div className="p-2">
              <p className="text-overline text-muted-foreground px-2 py-1.5">Products</p>
              {productSuggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSuggestionClick({ type: "product", slug: p.slug, name: p.name })}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                  role="option"
                  aria-selected="false"
                >
                  <Package
                    className="size-10 rounded-lg bg-sand text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-caption text-muted-foreground">₹{p.price}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Category suggestions */}
          {categorySuggestions.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-overline text-muted-foreground px-2 py-1.5">Categories</p>
              {categorySuggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSuggestionClick({ type: "category", slug: c.slug, name: c.name })}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                  role="option"
                  aria-selected="false"
                >
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Search className="size-4 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-body-sm font-medium text-foreground">{c.name}</p>
                </button>
              ))}
            </div>
          )}

          {/* No results (when query >= 2 chars and no matches) */}
          {query.length >= 2 &&
            productSuggestions.length === 0 &&
            categorySuggestions.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-body-sm text-muted-foreground">
                  No results for &quot;{query}&quot;
                </p>
              </div>
            )}

          {/* Recent + popular (when input empty but focused) */}
          {query.length < 2 && (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <>
                  <p className="text-overline text-muted-foreground px-2 py-1.5">Recent searches</p>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleRecentClick(term)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      <X className="size-3.5 text-muted-foreground rotate-45" aria-hidden="true" />
                      <span className="text-body-sm text-foreground">{term}</span>
                    </button>
                  ))}
                </>
              )}
              <p className="text-overline text-muted-foreground px-2 py-1.5 flex items-center gap-1.5">
                <TrendingUp className="size-3" aria-hidden="true" />
                Popular searches
              </p>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleRecentClick(term)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                >
                  <TrendingUp className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-body-sm text-foreground">{term}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
