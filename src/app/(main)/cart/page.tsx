"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight, Tag, X, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FreeShippingProgressBar } from "@/components/common/FreeShippingProgressBar";
import { EmptyState } from "@/components/common/EmptyState";
import { useCart } from "@/contexts/CartContext";
import { formatINR } from "@/lib/utils";
import { appToast } from "@/lib/toast";

const TRUST_BADGES = [
  { icon: Truck, label: "Free delivery above ₹499" },
  { icon: RotateCcw, label: "24h damage replacement" },
  { icon: Shield, label: "Secure payments" },
];

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const shipping = subtotal >= 499 ? 0 : 49;
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

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our healthy plants and premium planters to get started. Free delivery on orders above ₹499 in Sonipat."
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A6B3C]">
            Shopping Cart <span className="text-base font-normal text-slate-500">({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          </h1>
        </div>
        <button
          onClick={() => {
            clearCart();
            appToast.info("Cart cleared", "All items removed from cart");
          }}
          className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ---------- Left: Cart items ---------- */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free shipping progress */}
          <FreeShippingProgressBar subtotal={subtotal} />

          {/* Item list */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                {/* Image */}
                <Link href={`/product/${item.slug}`} className="shrink-0">
                  <div className="relative size-20 rounded-lg overflow-hidden bg-slate-50">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <ShoppingBag className="size-8 text-slate-300 m-auto" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/product/${item.slug}`} className="text-sm font-medium text-slate-800 hover:text-[#1A6B3C] line-clamp-2">
                      {item.name}
                    </Link>
                    <button
                      onClick={() => {
                        removeItem(item.id);
                        appToast.info("Removed", `${item.name} removed from cart`);
                      }}
                      className="text-slate-400 hover:text-red-500 shrink-0 p-1"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-500">{formatINR(item.price)} each</p>

                  {!item.inStock && (
                    <span className="text-xs text-red-500 font-medium">Out of stock</span>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-1">
                    {/* Quantity */}
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="size-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="size-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Line total */}
                    <p className="text-base font-bold text-[#1A6B3C] tabular-nums">
                      {formatINR(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue shopping */}
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A6B3C] hover:underline">
            <ArrowRight className="size-4 rotate-180" aria-hidden="true" />
            Continue Shopping
          </Link>
        </div>

        {/* ---------- Right: Order summary ---------- */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Coupon */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Tag className="size-4 text-[#E8930A]" aria-hidden="true" />
                Coupon Code
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 p-2 bg-[#F3F8F1] rounded-lg">
                  <span className="text-sm font-semibold text-[#1A6B3C]">{appliedCoupon}</span>
                  <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-red-500" aria-label="Remove coupon">
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
                    className="h-10 text-sm"
                    aria-label="Coupon code"
                  />
                  <Button onClick={handleApplyCoupon} size="sm" className="bg-[#1A6B3C] hover:bg-[#16A34A] shrink-0">
                    Apply
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-400">Try GROW10 for 10% off or FLAT50 for ₹50 off</p>
            </div>

            {/* Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-base font-bold text-[#1A6B3C]">Order Summary</h3>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-slate-800 tabular-nums">{formatINR(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon})</span>
                    <span className="font-medium tabular-nums">-{formatINR(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery</span>
                  <span className="font-medium text-slate-800 tabular-nums">
                    {shipping === 0 ? "FREE" : formatINR(shipping)}
                  </span>
                </div>
                {/* GST removed — prices are inclusive */}
              </div>
              <Separator />
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-[#1A6B3C] tabular-nums">{formatINR(total)}</span>
              </div>

              {/* Checkout CTA */}
              <Button asChild className="w-full h-12 bg-[#1A6B3C] hover:bg-[#16A34A] gap-2 mt-2">
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              {/* Trust badges */}
              <div className="pt-2 space-y-1.5">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 text-xs text-slate-500">
                    <badge.icon className="size-3.5 text-[#1A6B3C]" aria-hidden="true" />
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
