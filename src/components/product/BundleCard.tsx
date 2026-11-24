"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { appToast } from "@/lib/toast";

interface BundleCardProps {
  name: string;
  desc: string;
  price: number;
  image: string;
  /** Parent product slug — used as the cart line's link target */
  productSlug: string;
  index: number;
}

/**
 * BundleCard — "Frequently Bought Together" card. The old "Add Bundle to
 * Cart" button was dead; this wires it to the real cart via addItem with a
 * stable line id (bundle-<slug>-<index>), so repeat taps increment quantity
 * instead of duplicating lines. Prices are placeholders, displayed as-is.
 */
export function BundleCard({ name, desc, price, image, productSlug, index }: BundleCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      productId: `bundle-${productSlug}-${index}`,
      variantId: null,
      name: `Bundle: ${name}`,
      slug: productSlug,
      price,
      image,
      quantity: 1,
      inStock: true,
    });
    setIsAdded(true);
    appToast.success("Bundle added to cart", `${name} (${formatINR(price)})`);
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div className="bg-paper border border-line rounded-[18px] overflow-hidden hover:shadow-[0_16px_40px_rgba(22,56,43,0.14)] transition-all group">
      <div className="aspect-[4/3] bg-sand relative overflow-hidden">
        {image ? (
          <Image src={image} alt={name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : null}
      </div>
      <div className="p-4">
        <p className="font-display text-lg text-pine">{name}</p>
        <p className="text-xs text-ink-soft mt-1 line-clamp-2">{desc}</p>
        <p className="text-base font-bold text-pine mt-2 tabular-nums">{formatINR(price)}</p>
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "mt-3 w-full text-sm font-semibold rounded-full py-3 transition-all min-h-[44px] flex items-center justify-center gap-1.5",
            isAdded
              ? "bg-moss text-ivory"
              : "text-pine border-2 border-pine hover:bg-pine hover:text-ivory"
          )}
        >
          {isAdded ? (<><Check className="size-4" aria-hidden="true" />Added to Cart</>) : (<><Plus className="size-4" aria-hidden="true" />Add Bundle to Cart</>)}
        </button>
      </div>
    </div>
  );
}
