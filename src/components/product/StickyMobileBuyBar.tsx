"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatINR } from "@/lib/utils";

export interface StickyMobileBuyBarProps {
  price: number;
  salePrice: number | null;
  inStock: boolean;
  productId: string;
  productName: string;
  productSlug: string;
  image: string;
  categoryName: string;
  categorySlug: string;
  /** Selected size variant (synced from the buy panel); null = base price */
  variantId?: string | null;
  /** Explicit display price (e.g. selected variant price); falls back to salePrice ?? price */
  displayPrice?: number;
}

/**
 * StickyMobileBuyBar — mobile-only sticky buy bar (appears below the fold).
 * Synced with the buy panel's selected variant via BuyPanelBridge so the bar
 * never adds a different variant than the one shown in the panel.
 */
export function StickyMobileBuyBar({
  price, salePrice, inStock, productId, productName, productSlug, image,
  categoryName: _categoryName, categorySlug: _categorySlug,
  variantId = null, displayPrice,
}: StickyMobileBuyBarProps) {
  const { addItem } = useCart();
  const finalPrice = displayPrice ?? salePrice ?? price;
  const lineName = `${productName}${variantId ? ` (${variantId})` : ""}`;

  const handleAdd = () => {
    addItem({ productId, variantId, name: lineName, slug: productSlug, price: finalPrice, image, quantity: 1, inStock });
  };

  return (
    <div
      className="lg:hidden fixed left-0 right-0 z-50 bg-paper/95 backdrop-blur border-t border-line px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_rgba(22,56,43,0.12)]"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-soft truncate">{lineName}</p>
        <p className="text-lg font-bold text-pine tabular-nums">{formatINR(finalPrice)}</p>
      </div>
      <Button
        onClick={handleAdd}
        disabled={!inStock}
        className="bg-pine hover:bg-brass-deep text-ivory rounded-full gap-2 px-6 min-h-[44px]"
      >
        <ShoppingCart className="size-4" aria-hidden="true" />
        {inStock ? "Add to Cart" : "Notify Me"}
      </Button>
    </div>
  );
}
