"use client";

import { useState, useMemo, useCallback, Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, SearchX, PackageSearch } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/feedback/ProductCardSkeleton";
import { FilterSidebar, DEFAULT_FILTERS, type ShopFilters } from "@/components/shop/FilterSidebar";
import { SortDropdown } from "@/components/shop/SortDropdown";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { MobileFilterSheet } from "@/components/shop/MobileFilterSheet";
import { ShopPagination } from "@/components/shop/ShopPagination";
import { SHOP_PRODUCTS, type ShopProduct, type SortValue } from "@/data/shopData";
import type { Product } from "@/data/homepageData";

const PRODUCTS_PER_PAGE = 12;

function toProductCard(p: ShopProduct): Product {
  return {
    id: p.id, categoryBadge: p.category.toUpperCase(), name: p.name, image: p.image,
    rating: p.rating, reviewCount: p.reviewCount, sunInfo: p.sunInfo, waterInfo: p.waterInfo,
    price: p.price, originalPrice: p.originalPrice, discountPercent: p.discountPercent,
    isBestseller: p.isBestseller, slug: p.slug, availableStock: p.inStock ? 10 : 0,
    isBestseller_bool: p.isBestseller, isNewArrival: p.isNewArrival, isAirPurifying: p.isAirPurifying,
    tags: [...(p.isBestseller ? ["bestseller"] : []), ...(p.isNewArrival ? ["new"] : []), ...(p.isAirPurifying ? ["air-purifying"] : [])],
  };
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageInner />
    </Suspense>
  );
}

function ShopPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialCategory = searchParams.get("category");

  const [filters, setFilters] = useState<ShopFilters>({
    ...DEFAULT_FILTERS,
    categories: initialCategory ? [initialCategory] : [],
  });
  const [sort, setSort] = useState<SortValue>("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // C13 FIX: Sync ALL filters to URL (was missing price, sunlight, difficulty, suitableFor)
  const updateURL = useCallback((newFilters: ShopFilters) => {
    const params = new URLSearchParams();
    if (newFilters.categories.length === 1) params.set("category", newFilters.categories[0]);
    if (newFilters.categories.length > 1) params.set("categories", newFilters.categories.join(","));
    if (newFilters.minRating > 0) params.set("rating", String(newFilters.minRating));
    if (newFilters.inStockOnly) params.set("in_stock", "true");
    if (newFilters.petSafeOnly) params.set("pet_safe", "true");
    // C13: Added missing filter params
    if (newFilters.priceRange[0] > 0) params.set("min_price", String(newFilters.priceRange[0]));
    if (newFilters.priceRange[1] < 10000) params.set("max_price", String(newFilters.priceRange[1]));
    if (newFilters.sunlight.length > 0) params.set("sunlight", newFilters.sunlight.join(","));
    if (newFilters.difficulty.length > 0) params.set("difficulty", newFilters.difficulty.join(","));
    if (newFilters.suitableFor.length > 0) params.set("suitable_for", newFilters.suitableFor.join(","));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname]);

  const handleFilterChange = (newFilters: ShopFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters);
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    router.replace(pathname, { scroll: false });
  };

  const handleRemoveChip = (key: keyof ShopFilters, value?: string) => {
    const newFilters = { ...filters };
    if (key === "categories" || key === "sunlight" || key === "difficulty" || key === "suitableFor") {
      if (value) (newFilters[key] as string[]) = (newFilters[key] as string[]).filter((v) => v !== value);
    } else if (key === "minRating") { newFilters.minRating = 0; }
    else if (key === "priceRange") { newFilters.priceRange = [0, 2000]; }
    else if (key === "inStockOnly") { newFilters.inStockOnly = false; }
    else if (key === "petSafeOnly") { newFilters.petSafeOnly = false; }
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters);
  };

  const filteredProducts = useMemo(() => {
    let result = SHOP_PRODUCTS.filter((p) => {
      if (filters.categories.length > 0 && !filters.categories.includes(p.categorySlug)) return false;
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
      if (p.rating < filters.minRating) return false;
      if (filters.sunlight.length > 0 && !filters.sunlight.includes(p.sunInfo)) return false;
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(p.difficulty)) return false;
      if (filters.suitableFor.length > 0 && !p.suitableFor.some((s) => filters.suitableFor.includes(s))) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.petSafeOnly && !p.isPetSafe) return false;
      return true;
    });
    switch (sort) {
      case "price_asc": result = [...result].sort((a, b) => a.price - b.price); break;
      case "price_desc": result = [...result].sort((a, b) => b.price - a.price); break;
      case "rating": result = [...result].sort((a, b) => b.rating - a.rating); break;
      case "newest": result = [...result].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival)); break;
      case "bestseller": result = [...result].sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller)); break;
      default: result = [...result].sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller)); break;
    }
    return result;
  }, [filters, sort]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  return (
    <>
      <PageHero
        overline="Shop"
        title="All Plants & Products"
        subtitle="Browse our curated collection of healthy plants, premium planters, and gardening supplies — delivered fresh to your door in Sonipat."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />

      <section className="py-8 md:py-12 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-5">
                <FilterSidebar filters={filters} onChange={handleFilterChange} onClear={handleClear} />
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-[#1A6B3C]">{filteredProducts.length}</span> products found
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(true)} className="lg:hidden gap-2 border-[#1A6B3C] text-[#1A6B3C]">
                    <SlidersHorizontal className="size-4" aria-hidden="true" />Filters
                  </Button>
                  <SortDropdown value={sort} onChange={setSort} />
                </div>
              </div>

              <ActiveFilterChips filters={filters} onRemove={handleRemoveChip} onClear={handleClear} />

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {paginatedProducts.map((p) => <ProductCard key={p.id} product={toProductCard(p)} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="size-16 rounded-full bg-[#F3F8F1] flex items-center justify-center">
                    <SearchX className="size-8 text-[#1A6B3C]" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">No products found</h3>
                  <p className="text-sm text-slate-500 max-w-md">No products match your current filters. Try adjusting or clearing filters to see more results.</p>
                  <Button onClick={handleClear} className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2 mt-2">
                    <PackageSearch className="size-4" aria-hidden="true" />Clear All Filters
                  </Button>
                </div>
              )}

              {!isLoading && totalPages > 1 && (
                <ShopPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="pt-4" />
              )}
            </div>
          </div>
        </Container>
      </section>

      <MobileFilterSheet filters={filters} onChange={handleFilterChange} onClear={handleClear} open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} resultCount={filteredProducts.length} />
    </>
  );
}
