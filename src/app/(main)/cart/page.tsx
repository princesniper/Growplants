"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight, Tag, X, Truck, ShieldCheck, RotateCcw, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FreeShippingProgressBar } from "@/components/common/FreeShippingProgressBar";
import { EmptyState } from "@/components/common/EmptyState";
import { GuaranteeCallout } from "@/components/common/GuaranteeCallout";
import { useCart } from "@/contexts/CartContext";
import { formatINR } from "@/lib/utils";
import { appToast } from "@/lib/toast";
import { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_CHARGE } from "@/lib/constants";

const TRUST_BADGES = [
  { icon: Truck, label: `Free delivery above ₹${FREE_SHIPPING_THRESHOLD}` },
  { icon: RotateCcw, label: "30-day replacement promise" },
  { icon: ShieldCheck, label: "Secure payments · COD available" },
];

/**
 * Cart page — qty edit mutates the line (never appends duplicates), remove
 * offers undo via sonner. Client never computes order totals for the server:
 * the summary shown here is the cart's client-side display; the server is
 * authoritative at checkout.
 */
export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart, addItem } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_CHARGE;
  const tax = 0; // GST removed — prices are inclusive
  const total = subtotal - couponDiscount + shipping;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    if (code === "GROW10") {
      setAppliedCoupon(code);
      setCouponDiscount(Math.round(subtotal * 0.1));
      appToast.success("Coupon applied!", "10% discount applied with GROW10");
    } else if (code === "FLAT50") {
      setAppliedCoupon(code);
      setCouponDiscount(50);
      appToast.success("Coupon applied!", "₹50 off with FLAT50");
    } else {
      appToast.error("Invalid coupon", "Please check the code and try again");
    }
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    appToast.info("Coupon removed", "Discount has been removed");
  };

  const handleRemoveItem = (id: string) => {
    const removed = items.find((i) => i.id === id);
    if (!removed) return;
    removeItem(id);
    // Undo: re-add the exact same line (stable id → no duplicates)
    import("sonner").then(({ toast }) => {
      toast("Item removed from cart", {
        description: removed.name,
        action: {
          label: "Undo",
          onClick: () =>
            addItem({
              productId: removed.productId,
              variantId: removed.variantId,
              name: removed.name,
              slug: removed.slug,
              price: removed.price,
              image: removed.image,
              quantity: removed.quantity,
              inStock: removed.inStock,
            }),
        },
        duration: 5000,
      });
    });
  };

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Cart khaali hai"
          description="Healthy plants aur premium planters dekhein — Sonipat mein ₹499 se upar free delivery."
          action={{ label: "Shop Plants", href: "/shop" }}
          size="lg"
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl md:text-4xl text-pine">
          Shopping Cart{" "}
          <span className="font-sans text-base font-normal text-ink-soft">
            ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        </h1>
        <button
          onClick={() => {
            clearCart();
            appToast.info("Cart cleared", "All items removed from cart");
          }}
          className="text-sm font-medium text-ink-soft hover:text-terracotta transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ---------- Left: Cart items ---------- */}
        <div className="lg:col-span-2 space-y-4">
          <FreeShippingProgressBar subtotal={subtotal} />

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-paper border border-line rounded-[18px] hover:shadow-[0_8px_24px_rgba(22,56,43,0.08)] transition-shadow"
              >
                <Link href={`/product/${item.slug}`} className="shrink-0">
                  <div className="relative size-20 md:size-24 rounded-2xl overflow-hidden bg-sand">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                    ) : (
                      <ShoppingBag className="size-8 text-ink-soft/40 m-auto" />
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/product/${item.slug}`} className="font-display text-lg leading-snug text-pine hover:text-brass-deep line-clamp-2">
                      {item.name}
                    </Link>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-ink-soft hover:text-terracotta shrink-0 p-1.5 -m-1 rounded-full hover:bg-terracotta/10 transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-soft tabular-nums">{formatINR(item.price)} each</p>

                  {!item.inStock && (
                    <span className="text-xs text-terracotta font-medium">Out of stock</span>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center border border-line rounded-full bg-ivory">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="size-9 flex items-center justify-center text-pine hover:bg-sage-wash rounded-l-full transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="size-9 flex items-center justify-center text-pine hover:bg-sage-wash rounded-r-full transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="text-base font-bold text-pine tabular-nums">
                      {formatINR(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:text-brass-deep transition-colors">
            <ArrowRight className="size-4 rotate-180" aria-hidden="true" />
            Continue Shopping
          </Link>
        </div>

        {/* ---------- Right: Order summary ---------- */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-4">
            {/* Coupon */}
            <div className="bg-paper border border-line rounded-[18px] p-4 space-y-3">
              <h3 className="text-sm font-bold text-pine flex items-center gap-2">
                <Tag className="size-4 text-brass-deep" aria-hidden="true" />
                Coupon Code
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 p-2.5 bg-sage-wash rounded-xl">
                  <span className="text-sm font-semibold text-pine">{appliedCoupon}</span>
                  <button onClick={handleRemoveCoupon} className="text-ink-soft hover:text-terracotta" aria-label="Remove coupon">
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (try GROW10)"
                    className="h-11 text-sm rounded-full"
                    aria-label="Coupon code"
                  />
                  <Button onClick={handleApplyCoupon} size="sm" className="bg-pine hover:bg-brass-deep text-ivory rounded-full shrink-0 h-11 px-5">
                    Apply
                  </Button>
                </div>
              )}
              <p className="text-xs text-ink-soft">Try GROW10 for 10% off or FLAT50 for ₹50 off</p>
            </div>

            {/* Summary */}
            <div className="bg-paper border border-line rounded-[18px] p-5 space-y-3">
              <h3 className="font-display text-xl text-pine">Order Summary</h3>
              <Separator className="bg-line" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-charcoal tabular-nums">{formatINR(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-moss">
                    <span>Discount ({appliedCoupon})</span>
                    <span className="font-medium tabular-nums">-{formatINR(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-soft">Delivery</span>
                  <span className={cn("font-semibold tabular-nums", shipping === 0 ? "text-moss" : "text-charcoal")}>
                    {shipping === 0 ? "FREE" : formatINR(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Tax</span>
                  <span className="text-charcoal">₹0 <span className="text-xs text-ink-soft">(inclusive)</span></span>
                </div>
              </div>
              <Separator className="bg-line" />
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-charcoal">Total</span>
                <span className="font-display text-2xl text-pine tabular-nums">{formatINR(total)}</span>
              </div>

              <Button asChild className="w-full h-13 py-3.5 rounded-full bg-pine hover:bg-brass-deep text-ivory text-base font-semibold gap-2 mt-2">
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              <GuaranteeCallout variant="compact" className="pt-1" />

              <div className="pt-1 space-y-1.5">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 text-xs text-ink-soft">
                    <badge.icon className="size-3.5 text-pine" aria-hidden="true" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
