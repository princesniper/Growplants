"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Check, Star, Sun, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { appToast } from "@/lib/toast";
import type { Product } from "@/data/homepageData";

export interface ProductCardProps { product: Product; className?: string; }

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
    <article className={cn("group relative flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#1A6B3C]/30 hover:-translate-y-1 animate-scale-in", className)}>
      {/* C15 FIX: Wishlist button moved OUTSIDE the Link (was invalid HTML) */}
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-slate-50 overflow-hidden" aria-label={`View ${product.name}`}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {product.isBestseller && <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E8930A] text-white">BESTSELLER</span>}
            {product.discountPercent && product.discountPercent > 0 && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">-{product.discountPercent}%</span>}
          </div>
        </Link>
        {/* Wishlist — with heart beat animation on click */}
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlist(e); if (!wishlisted) { const el = e.currentTarget.querySelector('svg') as HTMLElement | null; if (el) { el.classList.remove('animate-heart-beat'); void el.offsetWidth; el.classList.add('animate-heart-beat'); } } }} className={cn("absolute top-2 right-2 z-10 size-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center transition-all hover:bg-white hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A6B3C]", wishlisted ? "text-red-500" : "text-slate-500 hover:text-[#1A6B3C]")} aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={wishlisted}>
          <Heart className={cn("size-4", wishlisted && "fill-red-500")} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-xs font-bold text-[#1A6B3C] tracking-wide">{product.categoryBadge}</p>
        <Link href={`/product/${product.slug}`} className="text-sm font-medium text-slate-800 line-clamp-2 hover:text-[#1A6B3C] transition-colors min-h-[2.5rem]">{product.name}</Link>

        <div className="flex items-center gap-1">
          <Star className="size-3.5 fill-[#E8930A] text-[#E8930A]" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-800 tabular-nums">{product.rating > 0 ? product.rating.toFixed(1) : "New"}</span>
          <span className="text-sm text-slate-500">({product.reviewCount})</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 min-h-[1rem]">
          <span className="flex items-center gap-1 truncate"><Sun className="size-3 shrink-0" aria-hidden="true" />{product.sunInfo}</span>
          <span className="shrink-0">•</span>
          <span className="flex items-center gap-1 truncate"><Droplets className="size-3 shrink-0" aria-hidden="true" />{product.waterInfo}</span>
        </div>

        {/* C14 FIX: Stack price above button on mobile, row on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-auto pt-2">
          <div>
            <p className="text-lg font-bold text-[#1A6B3C] tabular-nums">{formatINR(product.price)}</p>
            {product.originalPrice && <p className="text-xs text-slate-400 line-through tabular-nums">{formatINR(product.originalPrice)}</p>}
          </div>
          <Button type="button" onClick={handleAddToCart} disabled={isOutOfStock} size="sm" className={cn("gap-1.5 bg-[#1A6B3C] hover:bg-[#16A34A] w-full sm:w-auto", isAdded && "bg-green-600 hover:bg-green-600")} aria-label={`Add ${product.name} to cart`}>
            {isAdded ? <><Check className="size-3.5" aria-hidden="true" />Added</> : <><ShoppingCart className="size-3.5" aria-hidden="true" /><span className="hidden sm:inline">Add to Cart</span><span className="sm:hidden">Add</span></>}
          </Button>
        </div>
      </div>
    </article>
  );
}
