"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Check, Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/lib/constants";
import { CareBadgeRow } from "@/components/products/CareBadgeRow";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { appToast } from "@/lib/toast";
import type { Product } from "@/data/homepageData";

export interface ProductCardProps { product: Product; className?: string; }

/**
 * ProductCard — blueprint E2: care info on cards de-risks in 2 seconds.
 * CareBadgeRow (light · water · pet-safe · difficulty), rating stars,
 * price + MRP strike, "COD available" microcopy, quick Add.
 * addItem payload shape is preserved exactly.
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const isOutOfStock = product.availableStock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    addItem({ productId: product.id, variantId: null, name: product.name, slug: product.slug, price: product.price, image: product.image, quantity: 1, inStock: !isOutOfStock });
    setIsAdded(true);
    appToast.success("Added to cart", `${product.name} (${formatINR(product.price)})`);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article className={cn("group relative flex flex-col rounded-[18px] border border-line bg-paper overflow-hidden transition-all duration-300 hover:shadow-[0_16px_40px_rgba(22,56,43,0.14)] hover:border-brass/50 hover:-translate-y-1 animate-scale-in", className)}>
      {/* Wishlist button moved OUTSIDE the Link (was invalid HTML) */}
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-sand overflow-hidden" aria-label={`View ${product.name}`}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" className={cn("object-cover transition-transform duration-500 group-hover:scale-105", isOutOfStock && "grayscale opacity-70")} loading="lazy" />
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
            {product.isBestseller && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-brass text-pine-ink uppercase">
                <BadgeCheck className="size-3" aria-hidden="true" />Bestseller
              </span>
            )}
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-terracotta text-ivory uppercase tracking-wide">
                -{product.discountPercent}%
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-charcoal/80 text-ivory uppercase tracking-wide">
                Out of stock
              </span>
            )}
          </div>
        </Link>
        {/* Wishlist — with heart beat animation on click */}
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlist(e); if (!wishlisted) { const el = e.currentTarget.querySelector('svg') as HTMLElement | null; if (el) { el.classList.remove('animate-heart-beat'); void el.offsetWidth; el.classList.add('animate-heart-beat'); } } }} className={cn("absolute top-2.5 right-2.5 z-10 size-9 rounded-full bg-paper/90 backdrop-blur shadow-sm flex items-center justify-center transition-all hover:bg-paper hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass", wishlisted ? "text-terracotta" : "text-ink-soft hover:text-pine")} aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={wishlisted}>
          <Heart className={cn("size-4", wishlisted && "fill-terracotta")} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 p-3.5 flex-1">
        <p className="text-[10px] font-bold text-brass-deep tracking-[0.12em] uppercase">{product.categoryBadge}</p>
        <Link href={`/product/${product.slug}`} className="font-display text-[17px] leading-snug text-pine line-clamp-2 hover:text-brass-deep transition-colors min-h-[2.75rem]">{product.name}</Link>

        <div className="flex items-center gap-1">
          <Star className="size-3.5 fill-brass text-brass" aria-hidden="true" />
          <span className="text-sm font-semibold text-charcoal tabular-nums">{product.rating > 0 ? product.rating.toFixed(1) : "New"}</span>
          <span className="text-xs text-ink-soft">({product.reviewCount})</span>
        </div>

        {/* Care badges — de-risk at a glance */}
        <CareBadgeRow
          sunInfo={product.sunInfo}
          waterInfo={product.waterInfo}
          isPetSafe={product.isPetSafe}
          difficulty={product.difficulty}
        />

        {/* Price + quick add */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-auto pt-2.5">
          <div>
            <p className="text-lg font-bold text-pine tabular-nums">{formatINR(product.price)}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-ink-soft line-through tabular-nums">{formatINR(product.originalPrice)}</p>
            )}
          </div>
          {isOutOfStock ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
              className="gap-1.5 rounded-full w-full sm:w-auto border-pine/30 text-pine hover:bg-pine hover:text-ivory"
            >
              <a
                href={`${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(`Hi GrowPlants! Please notify me when "${product.name}" is back in stock.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Get notified on WhatsApp when ${product.name} is back in stock`}
              >
                Notify me
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAddToCart}
              size="sm"
              className={cn(
                "gap-1.5 rounded-full w-full sm:w-auto",
                isAdded
                  ? "bg-moss hover:bg-moss text-ivory"
                  : "bg-pine hover:bg-brass-deep text-ivory"
              )}
              aria-label={`Add ${product.name} to cart`}
            >
              {isAdded ? (<><Check className="size-3.5" aria-hidden="true" />Added</>) : (<><ShoppingCart className="size-3.5" aria-hidden="true" />Add</>)}
            </Button>
          )}
        </div>
        <p className="text-[11px] text-ink-soft">COD available · Inclusive of all taxes</p>
      </div>
    </article>
  );
}
