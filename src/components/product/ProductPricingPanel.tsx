"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Heart, Share2, Check, Minus, Plus, Bell, Leaf, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { appToast } from "@/lib/toast";
import { formatINR, discountPercent } from "@/lib/utils";
import { PotPairingSelector, type PotOption } from "@/components/product/PotPairingSelector";
import { GuaranteeCallout } from "@/components/common/GuaranteeCallout";
import { PincodeChecker } from "@/components/global/PincodeChecker";

interface ProductPricingPanelProps {
  price: number; salePrice: number | null; discount: number | null; savings: number | null;
  inStock: boolean; isBestSeller: boolean;
  productId: string; productName: string; productSlug: string; image: string;
  categoryName: string; categorySlug: string; stockQuantity: number;
  prices: Record<string, number> | null; productType: string;
  /** Pot-pairing options (plants only). When provided, "Plant + Pot" is the default tab. */
  pots?: PotOption[];
  /** Notifies the sticky buy bar of the selected variant + price. */
  onVariantChange?: (variantId: string | null, price: number) => void;
}

/**
 * ProductPricingPanel — buy panel. Plant + Pot is the default configuration
 * (blueprint D3); "Plant only (nursery pot)" is secondary. Pot pairing adds
 * plant + pot as TWO cart lines via the existing addItem payload — no
 * data-layer changes. Price authority stays server-side (display only).
 */
export function ProductPricingPanel(props: ProductPricingPanelProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    props.prices ? Object.keys(props.prices)[0] : null
  );
  const [mode, setMode] = useState<"combo" | "plant-only">(
    props.pots && props.pots.length > 0 ? "combo" : "plant-only"
  );
  const [selectedPot, setSelectedPot] = useState<PotOption | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const displayPrice = props.prices && selectedVariant ? props.prices[selectedVariant] : (props.salePrice ?? props.price);
  const discount = props.discount ?? discountPercent(props.price, displayPrice);
  const wishlisted = isWishlisted(props.productId);
  const comboActive = mode === "combo" && props.pots && props.pots.length > 0;

  const onVariantChange = props.onVariantChange;
  useEffect(() => {
    onVariantChange?.(selectedVariant, displayPrice);
  }, [selectedVariant, displayPrice, onVariantChange]);

  const plantLineName = `${props.productName}${selectedVariant ? ` (${selectedVariant})` : ""}`;

  const addPlantLine = (qty: number) =>
    addItem({
      productId: props.productId,
      variantId: selectedVariant,
      name: plantLineName,
      slug: props.productSlug,
      price: displayPrice,
      image: props.image,
      quantity: qty,
      inStock: props.inStock,
    });

  const handleAddToCart = () => {
    if (comboActive && selectedPot) {
      // Plant + pot = two separate cart lines (existing addItem, no data changes)
      addPlantLine(quantity);
      addItem({
        productId: selectedPot.slug,
        variantId: selectedPot.sizeLabel,
        name: `${selectedPot.name} (${selectedPot.sizeLabel})`,
        slug: selectedPot.slug,
        price: selectedPot.price,
        image: selectedPot.image,
        quantity,
        inStock: true,
      });
      appToast.success("Combo added to cart", `${plantLineName} + ${selectedPot.name}`);
    } else {
      addPlantLine(quantity);
      appToast.success("Added to cart", `${plantLineName} (${formatINR(displayPrice)})`);
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (comboActive && selectedPot) {
      addPlantLine(quantity);
      addItem({
        productId: selectedPot.slug,
        variantId: selectedPot.sizeLabel,
        name: `${selectedPot.name} (${selectedPot.sizeLabel})`,
        slug: selectedPot.slug,
        price: selectedPot.price,
        image: selectedPot.image,
        quantity,
        inStock: true,
      });
    } else {
      addPlantLine(quantity);
    }
    window.location.href = "/checkout";
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: props.productName, url: window.location.href }); } catch (_e) { /* dismissed */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      appToast.success("Link copied!", "Product link copied to clipboard");
    }
  };

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      {props.pots && props.pots.length > 0 && (
        <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-sand/60 p-1" role="tablist" aria-label="Purchase options">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "combo"}
            onClick={() => setMode("combo")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-all min-h-[44px]",
              mode === "combo" ? "bg-pine text-ivory shadow" : "text-ink-soft hover:text-pine"
            )}
          >
            <Package className="size-4" aria-hidden="true" />
            Plant + Pot
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "plant-only"}
            onClick={() => setMode("plant-only")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-all min-h-[44px]",
              mode === "plant-only" ? "bg-pine text-ivory shadow" : "text-ink-soft hover:text-pine"
            )}
          >
            <Leaf className="size-4" aria-hidden="true" />
            Plant only
          </button>
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-4xl text-pine tabular-nums">{formatINR(displayPrice)}</span>
        {props.salePrice && (
          <>
            <span className="text-lg text-ink-soft line-through tabular-nums">{formatINR(props.price)}</span>
            {discount > 0 && (
              <span className="text-sm font-bold text-ivory bg-terracotta rounded-full px-2.5 py-1">{discount}% OFF</span>
            )}
          </>
        )}
        {props.savings && (
          <span className="text-xs text-moss font-semibold">Save {formatINR(props.savings)}</span>
        )}
      </div>
      <p className="-mt-3 text-xs text-ink-soft">Inclusive of all taxes · COD available</p>

      {/* Pot pairing (combo mode) */}
      {comboActive && (
        <PotPairingSelector
          plantName={props.productName}
          options={props.pots ?? []}
          selectedSlug={selectedPot?.slug ?? null}
          onSelect={setSelectedPot}
        />
      )}
      {comboActive && !selectedPot && (
        <p className="text-xs text-ink-soft -mt-2">Ya phir neeche “Plant only” chunein — nursery pot ke saath.</p>
      )}

      {/* Variant selector (for pots with multiple sizes / plants with size pricing) */}
      {props.prices && Object.keys(props.prices).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-pine">Select Size:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(props.prices).map(([size, p]) => (
              <button
                key={size}
                onClick={() => setSelectedVariant(size)}
                aria-pressed={selectedVariant === size}
                className={cn(
                  "px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all min-h-[44px]",
                  selectedVariant === size
                    ? "border-pine bg-pine text-ivory"
                    : "border-line text-charcoal hover:border-brass"
                )}
              >
                {size} · {formatINR(p)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + stock */}
      {props.inStock ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-line rounded-full bg-paper">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-11 flex items-center justify-center text-pine hover:bg-sage-wash rounded-l-full" aria-label="Decrease quantity">
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-12 text-center text-sm font-semibold tabular-nums" aria-live="polite">{quantity}</span>
            <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="size-11 flex items-center justify-center text-pine hover:bg-sage-wash rounded-r-full" aria-label="Increase quantity">
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          {props.stockQuantity <= 5 && props.stockQuantity > 0 && (
            <span className="text-sm text-brass-deep font-semibold">Only {props.stockQuantity} left!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-terracotta/10 text-terracotta border border-terracotta/30">
          <Bell className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">Out of Stock — WhatsApp par notify-me ke liye message karein</span>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={!props.inStock || isAdded}
          className={cn(
            "flex-1 h-13 py-3.5 gap-2 rounded-full text-base font-semibold",
            isAdded ? "bg-moss hover:bg-moss text-ivory" : "bg-pine hover:bg-brass-deep text-ivory"
          )}
        >
          {isAdded ? (<><Check className="size-4" aria-hidden="true" />Added!</>) : (<><ShoppingCart className="size-4" aria-hidden="true" />{comboActive && selectedPot ? "Add Plant + Pot" : "Add to Cart"}</>)}
        </Button>
        <Button onClick={handleBuyNow} disabled={!props.inStock} variant="outline" className="flex-1 h-13 py-3.5 rounded-full text-base font-semibold border-2 border-pine text-pine hover:bg-pine hover:text-ivory">
          Buy Now
        </Button>
      </div>
      <p className="text-xs text-ink-soft -mt-2">Transit mein 1–2 patte jhadna normal hai — plant adjust ho raha hai.</p>

      {/* Wishlist + Share */}
      <div className="flex gap-3">
        <Button
          onClick={() => toggleWishlist(props.productId)}
          variant="outline"
          className="flex-1 h-11 gap-2 rounded-full border-line"
        >
          <Heart className={cn("size-4", wishlisted && "fill-terracotta text-terracotta")} aria-hidden="true" />
          {wishlisted ? "Wishlisted" : "Add to Wishlist"}
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 h-11 gap-2 rounded-full border-line">
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </Button>
      </div>

      {/* Pincode checker */}
      <div className="rounded-2xl border border-line bg-paper p-4">
        <PincodeChecker variant="full" />
      </div>

      {/* Guarantee callout — within one scroll of the buy button */}
      <GuaranteeCallout variant="inline" />
    </div>
  );
}
