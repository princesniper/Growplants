"use client";

import { useState } from "react";
import { ProductPricingPanel } from "@/components/product/ProductPricingPanel";
import { StickyMobileBuyBar } from "@/components/product/StickyMobileBuyBar";
import type { PotOption } from "@/components/product/PotPairingSelector";

interface BuyPanelBridgeProps {
  price: number; salePrice: number | null; discount: number | null; savings: number | null;
  inStock: boolean; isBestSeller: boolean;
  productId: string; productName: string; productSlug: string; image: string;
  categoryName: string; categorySlug: string; stockQuantity: number;
  prices: Record<string, number> | null; productType: string;
  pots?: PotOption[];
}

/**
 * BuyPanelBridge — owns the selected size-variant state shared between the
 * desktop buy panel and the mobile sticky buy bar, so both always add the
 * SAME variant (reconciles StickyMobileBuyBar's old variantId: null behavior).
 */
export function BuyPanelBridge(props: BuyPanelBridgeProps) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [variantPrice, setVariantPrice] = useState<number>(props.salePrice ?? props.price);

  return (
    <>
      <StickyMobileBuyBar
        price={props.price}
        salePrice={props.salePrice}
        inStock={props.inStock}
        productId={props.productId}
        productName={props.productName}
        productSlug={props.productSlug}
        image={props.image}
        categoryName={props.categoryName}
        categorySlug={props.categorySlug}
        variantId={variantId}
        displayPrice={variantPrice}
      />
      <ProductPricingPanel
        {...props}
        onVariantChange={(v, p) => { setVariantId(v); setVariantPrice(p); }}
      />
    </>
  );
}
