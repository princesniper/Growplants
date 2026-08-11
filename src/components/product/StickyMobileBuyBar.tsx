"use client";

import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatINR } from "@/lib/utils";

export function StickyMobileBuyBar({
  price, salePrice, inStock, productId, productName, productSlug, image, categoryName, categorySlug,
}: {
  price: number; salePrice: number | null; inStock: boolean;
  productId: string; productName: string; productSlug: string;
  image: string; categoryName: string; categorySlug: string;
}) {
  const { addItem } = useCart();
  const displayPrice = salePrice ?? price;

  const handleAdd = () => {
    addItem({ productId, variantId: null, name: productName, slug: productSlug, price: displayPrice, image, quantity: 1, inStock });
  };

  return (
    <div
      className="lg:hidden fixed left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-lg"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 truncate">{productName}</p>
        <p className="text-lg font-bold text-[#1A6B3C] tabular-nums">{formatINR(displayPrice)}</p>
      </div>
      <Button
        onClick={handleAdd}
        disabled={!inStock}
        className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2 px-6"
      >
        <ShoppingCart className="size-4" aria-hidden="true" />
        {inStock ? "Add to Cart" : "Notify Me"}
      </Button>
    </div>
  );
}
