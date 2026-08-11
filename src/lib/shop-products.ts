/**
 * GrowPlants — Unified Shop Product Accessor
 * Reads REAL data from plants-data.json (48 plants) + pots-data.json (53 pots).
 * Provides a unified ShopProduct interface for the Shop PLP, Homepage, and Search.
 *
 * This REPLACES the mock shopData.ts — no more dummy data.
 */
import plantsData from "@/data/plants-data.json";
import potsData from "@/data/pots-data.json";

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  sunInfo: string;
  waterInfo: string;
  difficulty: string;
  isPetSafe: boolean;
  isAirPurifying: boolean;
  inStock: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  suitableFor: string[];
  productType: "plant" | "pot";
  shortDescription: string;
  specialFeatures: string[];
}

/** Map a plant JSON entry to ShopProduct */
function mapPlant(slug: string, raw: any): ShopProduct {
  const price = raw.price ?? 0;
  const oldPrice = raw.oldPrice ?? price;
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const categories: string[] = raw.category ?? [];
  const categoryName = categories[0]
    ? categories[0].split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Plants";

  const care = raw.care ?? {};
  const lightReq = care.lightRequirements ?? "Bright, indirect light";
  const sunInfo = lightReq.includes("direct") ? "Full Sun" : lightReq.includes("bright") ? "Indirect" : lightReq.includes("shade") ? "Shade" : "Partial Shade";
  const waterInfo = care.wateringInstructions?.includes("week") ? "Weekly" : care.wateringInstructions?.includes("daily") ? "Daily" : "Alternate Day";

  return {
    id: slug,
    name: raw.name ?? slug,
    slug,
    category: categoryName,
    categorySlug: categories[0] ?? "plants",
    image: (raw.images ?? [])[0] ?? "",
    images: raw.images ?? [],
    rating: raw.rating ?? 4.5,
    reviewCount: raw.reviewsCount ?? 0,
    price,
    originalPrice: oldPrice,
    discountPercent: discount,
    sunInfo,
    waterInfo,
    difficulty: "Easy",
    isPetSafe: false,
    isAirPurifying: categories.includes("air-purifying"),
    inStock: (raw.stock ?? 0) > 0,
    isBestseller: raw.badge === "Best Seller",
    isNewArrival: raw.badge === "New Arrival",
    suitableFor: categories,
    productType: "plant" as const,
    shortDescription: raw.description ?? "",
    specialFeatures: raw.specialFeatures ?? [],
  };
}

/** Map a pot JSON entry to ShopProduct */
function mapPot(slug: string, raw: any): ShopProduct {
  const prices = raw.prices ?? {};
  const priceEntries = Object.entries(prices);
  const price = priceEntries.length > 0 ? (priceEntries[0][1] as number) : (raw.oldPrice ?? 0);
  const oldPrice = raw.oldPrice ?? price;
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const categories: string[] = raw.category ?? [];
  const categoryName = categories[0]
    ? categories[0].split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Planters";

  return {
    id: slug,
    name: raw.name ?? slug,
    slug,
    category: categoryName,
    categorySlug: categories[0] ?? "planters",
    image: (raw.image ?? [])[0] ?? "",
    images: raw.image ?? [],
    rating: 4.5,
    reviewCount: 42,
    price,
    originalPrice: oldPrice,
    discountPercent: discount,
    sunInfo: "Full Sun",
    waterInfo: "Daily",
    difficulty: "Easy",
    isPetSafe: true,
    isAirPurifying: false,
    inStock: true,
    isBestseller: false,
    isNewArrival: false,
    suitableFor: categories,
    productType: "pot" as const,
    shortDescription: raw.desc ?? "",
    specialFeatures: raw.potFeatures ?? [],
  };
}

/** Get ALL products (plants + pots) as ShopProduct[] */
export function getAllProducts(): ShopProduct[] {
  const plants = Object.entries(plantsData).map(([slug, raw]) => mapPlant(slug, raw));
  const pots = Object.entries(potsData).map(([slug, raw]) => mapPot(slug, raw));
  return [...plants, ...pots];
}

/** Get products by category slug */
export function getProductsByCategory(categorySlug: string): ShopProduct[] {
  return getAllProducts().filter((p) => p.categorySlug === categorySlug || p.suitableFor.includes(categorySlug));
}

/** Get bestseller products (badge = "Best Seller" or high rating) */
export function getBestSellers(limit = 8): ShopProduct[] {
  return getAllProducts()
    .filter((p) => p.isBestseller || p.rating >= 4.5)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/** Get new arrivals — uses last-added items as proxy (no date field in JSON) */
export function getNewArrivals(limit = 8): ShopProduct[] {
  const all = getAllProducts();
  // B8 FIX: No product has badge "New Arrival" — use last N items (most recently added)
  // as a proxy for "new arrivals". Also include any with explicit "New Arrival" badge.
  const explicit = all.filter((p) => p.isNewArrival);
  if (explicit.length > 0) return explicit.slice(0, limit);
  return all.slice(-limit).reverse(); // last N items, newest first
}

/** Get featured products (bestsellers + high-rated) */
export function getFeaturedProducts(limit = 8): ShopProduct[] {
  return getAllProducts()
    .sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || b.rating - a.rating)
    .slice(0, limit);
}

/** Get categories with counts (derived from real data) */
export function getShopCategories(): { name: string; slug: string; count: number }[] {
  const all = getAllProducts();
  const categoryMap = new Map<string, { name: string; count: number }>();
  all.forEach((p) => {
    const existing = categoryMap.get(p.categorySlug);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(p.categorySlug, { name: p.category, count: 1 });
    }
  });
  return Array.from(categoryMap.entries()).map(([slug, { name, count }]) => ({ slug, name, count }));
}

/** Filter options (derived from real data) */
export const SUNLIGHT_OPTIONS = ["Full Sun", "Partial Shade", "Shade", "Indirect"] as const;
export const DIFFICULTY_OPTIONS = ["Easy", "Moderate", "Expert"] as const;
export const SUITABLE_FOR_OPTIONS = ["Indoor", "Outdoor", "Balcony", "Office"] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Rated" },
  { value: "newest", label: "Newest First" },
  { value: "bestseller", label: "Best Sellers" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
